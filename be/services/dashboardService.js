/**
 * services/dashboardService.js
 * Returns stats in the exact shape the frontend DashboardStats interface expects:
 * { revenue, orders, users, products, revenueChart, topProducts }
 */
const { db } = require('../config/firebase');

const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const getDashboardStats = async () => {
  const [productsSnap, ordersSnap, usersSnap] = await Promise.all([
    db.collection('products').get(),
    db.collection('orders').get(),
    db.collection('users').get(),
  ]);

  const products = productsSnap.docs.map(d => d.data());
  const orders   = ordersSnap.docs.map(d => d.data());
  const users    = usersSnap.docs.map(d => d.data());

  // ── Revenue ──────────────────────────────────────────────────
  const paidOrders   = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total || 0), 0);

  // ── Revenue chart — last 12 months ───────────────────────────
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now        = new Date();
  const revenueChart = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = monthNames[d.getMonth()];
    const year       = d.getFullYear();
    const monthOrders = orders.filter(o => {
      const ms = toMs(o.createdAt);
      const od = new Date(ms);
      return od.getFullYear() === year && od.getMonth() === d.getMonth();
    });
    revenueChart.push({
      month:   monthLabel,
      revenue: +monthOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0).toFixed(2),
      orders:  monthOrders.length,
    });
  }

  // ── Top products by order count ───────────────────────────────
  const productSales = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const pid = String(item.productId || '');
      if (!pid) return;
      if (!productSales[pid]) productSales[pid] = { productId: pid, name: item.name || '', sold: 0, revenue: 0, image: item.image || '' };
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
  };
};

module.exports = { getDashboardStats };
