/**
 * services/dashboardService.js
 *
 * Returns dashboard stats + a chart dataset that respects the requested
 * period / date-range.
 *
 * getDashboardStats(options)
 *   options.period   : 'monthly' | 'quarterly' | 'annually'  (default 'monthly')
 *   options.startDate: ISO date string  (optional — custom range)
 *   options.endDate  : ISO date string  (optional — custom range)
 *
 * revenueChart shape depends on period:
 *   monthly   → last 12 months, one bucket per month  { month, revenue, orders }
 *   quarterly → last 4 quarters                        { quarter, revenue, orders }
 *   annually  → last 5 years, one bucket per year     { year, revenue, orders }
 *   custom    → daily buckets between startDate–endDate{ date, revenue, orders }
 */

const { db } = require('../config/firebase');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const toMs = (v) =>
  v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'];

/** Zero-pad to 2 digits */
const pad = (n) => String(n).padStart(2, '0');

// ─────────────────────────────────────────────────────────────────────────────
// Chart builders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * MONTHLY — last 12 calendar months, grouped by month.
 * If a custom date range is provided, group daily within that range instead.
 */
const buildMonthlyChart = (orders, startMs, endMs) => {
  const now = new Date();
  const chart = [];

  for (let i = 11; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear() !== now.getFullYear() ? d.getFullYear() : ''}`.trim();
    const year  = d.getFullYear();
    const month = d.getMonth();

    // Apply optional date-range filter ON TOP of the 12-month window
    const bucket = orders.filter(o => {
      const ms = toMs(o.createdAt);
      if (startMs && ms < startMs) return false;
      if (endMs   && ms > endMs)   return false;
      const od = new Date(ms);
      return od.getFullYear() === year && od.getMonth() === month;
    });

    chart.push({
      month:   label,
      revenue: +bucket.filter(o => o.status !== 'cancelled')
                       .reduce((s, o) => s + (o.total || 0), 0).toFixed(2),
      orders:  bucket.length,
    });
  }
  return chart;
};

/**
 * QUARTERLY — last 4 rolling quarters (Q1–Q4 labels relative to now).
 */
const buildQuarterlyChart = (orders, startMs, endMs) => {
  const now     = new Date();
  const chart   = [];
  const curQ    = Math.floor(now.getMonth() / 3); // 0-based current quarter

  for (let i = 3; i >= 0; i--) {
    let q    = curQ - i;
    let year = now.getFullYear();
    while (q < 0) { q += 4; year -= 1; }
    const qStartMonth = q * 3;       // 0,3,6,9
    const qEndMonth   = qStartMonth + 2;

    const label = `Q${q + 1} ${year}`;

    const bucket = orders.filter(o => {
      const ms = toMs(o.createdAt);
      if (startMs && ms < startMs) return false;
      if (endMs   && ms > endMs)   return false;
      const od = new Date(ms);
      return (
        od.getFullYear() === year &&
        od.getMonth()    >= qStartMonth &&
        od.getMonth()    <= qEndMonth
      );
    });

    chart.push({
      quarter: label,
      revenue: +bucket.filter(o => o.status !== 'cancelled')
                       .reduce((s, o) => s + (o.total || 0), 0).toFixed(2),
      orders:  bucket.length,
    });
  }
  return chart;
};

/**
 * ANNUALLY — last 5 years, one bucket per year.
 */
const buildAnnualChart = (orders, startMs, endMs) => {
  const now   = new Date();
  const chart = [];

  for (let i = 4; i >= 0; i--) {
    const year = now.getFullYear() - i;

    const bucket = orders.filter(o => {
      const ms = toMs(o.createdAt);
      if (startMs && ms < startMs) return false;
      if (endMs   && ms > endMs)   return false;
      return new Date(ms).getFullYear() === year;
    });

    chart.push({
      year:    String(year),
      revenue: +bucket.filter(o => o.status !== 'cancelled')
                       .reduce((s, o) => s + (o.total || 0), 0).toFixed(2),
      orders:  bucket.length,
    });
  }
  return chart;
};

/**
 * CUSTOM RANGE — daily buckets between startDate and endDate.
 * If range > 90 days, auto-group by week instead to keep chart readable.
 */
const buildCustomChart = (orders, startMs, endMs) => {
  const rangeMs   = endMs - startMs;
  const dayMs     = 86_400_000;
  const rangeDays = Math.ceil(rangeMs / dayMs);
  const chart     = [];

  if (rangeDays <= 90) {
    // Daily buckets
    for (let d = 0; d < rangeDays; d++) {
      const dayStart = startMs + d * dayMs;
      const dayEnd   = dayStart + dayMs;
      const label    = new Date(dayStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const bucket = orders.filter(o => {
        const ms = toMs(o.createdAt);
        return ms >= dayStart && ms < dayEnd;
      });

      chart.push({
        date:    label,
        revenue: +bucket.filter(o => o.status !== 'cancelled')
                         .reduce((s, o) => s + (o.total || 0), 0).toFixed(2),
        orders:  bucket.length,
      });
    }
  } else {
    // Weekly buckets for longer ranges
    const weekMs = 7 * dayMs;
    const weeks  = Math.ceil(rangeDays / 7);

    for (let w = 0; w < weeks; w++) {
      const wStart = startMs + w * weekMs;
      const wEnd   = Math.min(wStart + weekMs, endMs);
      const label  = `Wk ${w + 1} (${new Date(wStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

      const bucket = orders.filter(o => {
        const ms = toMs(o.createdAt);
        return ms >= wStart && ms < wEnd;
      });

      chart.push({
        date:    label,
        revenue: +bucket.filter(o => o.status !== 'cancelled')
                         .reduce((s, o) => s + (o.total || 0), 0).toFixed(2),
        orders:  bucket.length,
      });
    }
  }
  return chart;
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = async ({ period = 'monthly', startDate, endDate } = {}) => {
  const [productsSnap, ordersSnap, usersSnap] = await Promise.all([
    db.collection('products').get(),
    db.collection('orders').get(),
    db.collection('users').get(),
  ]);

  const products = productsSnap.docs.map(d => d.data());
  const orders   = ordersSnap.docs.map(d => d.data());
  const users    = usersSnap.docs.map(d => d.data());

  // Parse optional custom date-range boundaries
  const startMs = startDate ? new Date(startDate).setHours(0, 0, 0, 0)   : null;
  const endMs   = endDate   ? new Date(endDate).setHours(23, 59, 59, 999) : null;

  // ── Revenue KPI (always over ALL time, unaffected by chart filter) ─────────
  const paidOrders   = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);

  // ── Revenue chart — shape depends on period ───────────────────────────────
  let revenueChart;
  if (startMs && endMs) {
    revenueChart = buildCustomChart(orders, startMs, endMs);
  } else if (period === 'quarterly') {
    revenueChart = buildQuarterlyChart(orders, null, null);
  } else if (period === 'annually') {
    revenueChart = buildAnnualChart(orders, null, null);
  } else {
    // default: monthly
    revenueChart = buildMonthlyChart(orders, null, null);
  }

  // ── Top products ─────────────────────────────────────────────────────────
  const productSales = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const pid = String(item.productId || '');
      if (!pid) return;
      if (!productSales[pid]) productSales[pid] = {
        productId: pid, name: item.name || '',
        sold: 0, revenue: 0, image: item.image || '',
      };
      productSales[pid].sold    += Number(item.quantity || 1);
      productSales[pid].revenue += Number(item.price || 0) * Number(item.quantity || 1);
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5)
    .map(p => ({ ...p, revenue: +p.revenue.toFixed(2) }));

  return {
    revenue: {
      total:  +totalRevenue.toFixed(2),
      orders: paidOrders.length,
    },
    orders: {
      total:     orders.length,
      paid:      orders.filter(o => o.paid === true || o.paymentStatus === 'paid').length,
      pending:   orders.filter(o => o.status === 'pending').length,
      completed: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    },
    users: {
      total:    users.length,
      active:   users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      banned:   users.filter(u => u.status === 'banned').length,
    },
    products: {
      total:      products.length,
      active:     products.filter(p => p.status === 'active').length,
      inactive:   products.filter(p => p.status === 'inactive').length,
      draft:      products.filter(p => p.status === 'draft').length,
      outOfStock: products.filter(p => (p.stock || 0) === 0).length,
    },
    revenueChart,
    topProducts,
    meta: { period, startDate: startDate || null, endDate: endDate || null },
  };
};

module.exports = { getDashboardStats };
