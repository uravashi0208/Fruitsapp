/**
 * services/orderService.js
 * Full payment-method support:
 *   card | apple_pay | google_pay | paypal | klarna | revolut
 *   sepa_debit | ideal | bancontact | sofort | giropay | eps
 *   przelewy24 | blik | cod
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { sendMail, buildEmailTemplate } = require('../utils/mailer');

const COL  = 'orders';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const generateOrderNumber = () =>
  'ORD-' + Date.now().toString(36).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

// ─── Payment detail extractor ─────────────────────────────────────────────────
const extractPaymentDetails = (payment = {}) => {
  const method = payment.method || 'cod';
  const base   = { method, status: payment.status || 'pending' };

  switch (method) {
    case 'card': {
      const cd = payment.cardDetails || {};
      return {
        ...base,
        cardholderName: cd.cardholderName || '',
        last4:          cd.last4          || '',
        expiryMonth:    cd.expiryMonth    || '',
        expiryYear:     cd.expiryYear     || '',
        cardType:       cd.cardType       || 'visa',
        brand:          cd.brand          || '',
        transactionId:  payment.transactionId || '',
      };
    }
    case 'apple_pay':
    case 'google_pay': {
      const cd = payment.cardDetails || {};
      return {
        ...base,
        last4:         cd.last4  || '',
        cardType:      cd.cardType || '',
        brand:         cd.brand  || '',
        transactionId: payment.transactionId || '',
      };
    }
    case 'paypal':
      return { ...base, paypalEmail: payment.paypalEmail || '', paypalOrderId: payment.paypalOrderId || '', transactionId: payment.transactionId || '' };
    case 'klarna':
      return { ...base, klarnaOrderId: payment.klarnaOrderId || '', transactionId: payment.transactionId || '', instalments: payment.instalments || 3 };
    case 'revolut':
      return { ...base, revolutOrderId: payment.revolutOrderId || '', transactionId: payment.transactionId || '' };
    case 'sepa_debit':
      return { ...base, ibanLast4: payment.ibanLast4 || '', accountHolder: payment.accountHolder || '', mandateRef: payment.mandateRef || '', transactionId: payment.transactionId || '' };
    case 'ideal':
      return { ...base, idealBank: payment.idealBank || '', transactionId: payment.transactionId || '' };
    case 'bancontact':
      return { ...base, last4: payment.last4 || '', transactionId: payment.transactionId || '' };
    case 'sofort':
      return { ...base, sofortBank: payment.sofortBank || '', sofortRef: payment.sofortRef || '', transactionId: payment.transactionId || '' };
    case 'giropay':
      return { ...base, bic: payment.bic || '', transactionId: payment.transactionId || '' };
    case 'eps':
      return { ...base, epsBank: payment.epsBank || '', transactionId: payment.transactionId || '' };
    case 'przelewy24':
      return { ...base, p24TransactionId: payment.p24TransactionId || '', transactionId: payment.transactionId || '' };
    case 'blik':
      return { ...base, blikRef: payment.blikRef || '', transactionId: payment.transactionId || '' };
    case 'cod':
      return { ...base, codNote: payment.codNote || '' };
    default:
      return { ...base, transactionId: payment.transactionId || '' };
  }
};

// ─── Payment labels ───────────────────────────────────────────────────────────
const PAYMENT_LABELS = {
  card: 'Credit / Debit Card', apple_pay: 'Apple Pay', google_pay: 'Google Pay',
  paypal: 'PayPal', klarna: 'Klarna — Pay in 3', revolut: 'Revolut Pay',
  sepa_debit: 'SEPA Direct Debit', ideal: 'iDEAL', bancontact: 'Bancontact',
  sofort: 'SOFORT / Klarna Pay Now', giropay: 'Giropay', eps: 'EPS Transfer',
  przelewy24: 'Przelewy24', blik: 'BLIK', cod: 'Cash on Delivery',
};

// ─── Admin out-of-stock email (called OUTSIDE transactions) ───────────────────
const sendOutOfStockEmail = async (productName, productId, sku, newStock) => {
  try {
    const adminEmail = process.env.MAIL_USER;
    if (!adminEmail) {
      console.warn('[orderService] MAIL_USER not set — skipping out-of-stock email');
      return;
    }

    const subject = `🚨 Out of Stock: ${productName}`;
    const body = `
      <h2 style="color:#c0392b;margin:0 0 16px;">⚠️ Out of Stock Alert</h2>
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        A product has reached <strong>zero stock</strong> after a customer order.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;width:140px;">Product</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${productName}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">SKU</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${sku || '—'}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Remaining Stock</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#c0392b;font-weight:700;">${newStock}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Product ID</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:13px;color:#888;">${productId}</td>
        </tr>
      </table>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/products/${productId}"
         style="display:inline-block;background:#82ae46;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;">
        Restock in Admin Panel
      </a>
      <p style="margin-top:20px;font-size:12px;color:#aaa;">
        This is an automated inventory alert from Vegefoods.
      </p>`;

    const html = buildEmailTemplate({ subject, body });
    await sendMail({ to: adminEmail, subject, html });
    console.log(`[orderService] Out-of-stock email sent for "${productName}"`);
  } catch (err) {
    // Never let email failure crash the order — just log it
    console.error('[orderService] Failed to send out-of-stock email:', err.message);
  }
};

// ─── Deduct stock for one item (transaction only touches Firestore) ────────────
// Returns { productName, productId, sku, newStock, wasOutOfStock } or throws
const deductStock = async (productId, quantity) => {
  const productRef = db.collection('products').doc(productId);
  let result = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists) {
      // Product not found — skip silently (don't fail the order)
      result = null;
      return;
    }

    const data     = snap.data();
    const prevStock = Number(data.stock) || 0;
    const newStock  = Math.max(0, prevStock - quantity);

    // Determine new status
    let newStatus = data.status;
    if (newStatus !== 'inactive' && newStatus !== 'draft') {
      newStatus = newStock <= 0 ? 'out_of_stock' : 'active';
    }

    tx.update(productRef, {
      stock:     newStock,
      status:    newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    result = {
      productName:  data.name,
      productId,
      sku:          data.sku || '',
      newStock,
      wasOutOfStock: prevStock > 0 && newStock <= 0,
    };
  });

  return result; // null means product not found
};

// ─── Create order ─────────────────────────────────────────────────────────────
const createOrder = async (data, userId = null) => {
  const id          = uuidv4();
  const orderNumber = generateOrderNumber();

  const subtotal = data.items.reduce(
    (s, i) => s + i.price * (i.qty || i.quantity || 1), 0
  );
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax      = subtotal * 0.08;
  const total    = subtotal + shipping + tax;

  const paymentDetails = extractPaymentDetails(data.payment);

  const doc = {
    id,
    orderNumber,
    userId:         userId || null,
    sessionId:      data.sessionId || '',

    items: data.items.map(i => ({
      productId: String(i.productId || i.id || ''),
      name:      i.name      || i.productName || '',
      price:     Number(i.price),
      quantity:  Number(i.qty || i.quantity || 1),
      image:     i.image     || i.thumbnail || '',
    })),

    address:   data.billing || data.address || {},
    userName:  data.billing?.firstName
      ? `${data.billing.firstName} ${data.billing.lastName || ''}`.trim()
      : (data.userName || ''),
    userEmail: data.billing?.email || data.userEmail || '',

    paymentMethod:      paymentDetails.method,
    paymentMethodLabel: PAYMENT_LABELS[paymentDetails.method] || paymentDetails.method,
    paymentStatus:      paymentDetails.status,
    paid:               paymentDetails.status === 'paid',
    paymentDetails,

    status:   'pending',
    subtotal: +subtotal.toFixed(2),
    shipping: +shipping.toFixed(2),
    tax:      +tax.toFixed(2),
    total:    +total.toFixed(2),

    notes:        data.notes || '',
    trackingCode: '',
    adminNote:    '',
    statusHistory: [{
      status:    'pending',
      note:      'Order placed',
      timestamp: new Date().toISOString(),
    }],

    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // ── 1. Save the order first ───────────────────────────────────────────────
  await db.collection(COL).doc(id).set(doc);

  // ── 2. Deduct stock per item (each in its own transaction, non-blocking) ──
  //   - Transactions contain ONLY Firestore reads/writes (no network calls)
  //   - Email is sent AFTER the transaction commits
  //   - Errors are caught so a missing product never fails the order response
  const outOfStockAlerts = [];

  for (const item of doc.items) {
    if (!item.productId) continue;
    try {
      const result = await deductStock(item.productId, item.quantity);
      if (result?.wasOutOfStock) {
        // Collect for emailing after all transactions complete
        outOfStockAlerts.push(result);
      }
    } catch (err) {
      // Log but never crash — order is already saved
      console.error(
        `[orderService] Stock deduction failed for productId="${item.productId}":`,
        err.message
      );
    }
  }

  // ── 3. Send out-of-stock emails OUTSIDE transactions ─────────────────────
  for (const alert of outOfStockAlerts) {
    // setImmediate so response is sent first, email happens after
    setImmediate(() =>
      sendOutOfStockEmail(
        alert.productName,
        alert.productId,
        alert.sku,
        alert.newStock
      )
    );
  }

  return {
    ...doc,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// ─── List orders (admin) ──────────────────────────────────────────────────────
const listOrders = async ({
  page = 1, limit = 20, status = '',
  search = '', sortDir = 'desc', paymentMethod = '',
} = {}) => {
  const snap   = await db.collection(COL).get();
  let   orders = snap.docs.map(d => d.data());

  if (status)        orders = orders.filter(o => o.status === status);
  if (paymentMethod) orders = orders.filter(o => o.paymentMethod === paymentMethod);
  if (search) {
    const s = search.toLowerCase();
    orders = orders.filter(o =>
      o.orderNumber?.toLowerCase().includes(s) ||
      o.userEmail?.toLowerCase().includes(s)   ||
      o.userName?.toLowerCase().includes(s)    ||
      o.address?.email?.toLowerCase().includes(s)
    );
  }

  orders.sort((a, b) =>
    sortDir === 'desc'
      ? toMs(b.createdAt) - toMs(a.createdAt)
      : toMs(a.createdAt) - toMs(b.createdAt)
  );

  const total = orders.length;
  const start = (page - 1) * Number(limit);
  return {
    orders: orders.slice(start, start + Number(limit)),
    total,
    page:   Number(page),
    limit:  Number(limit),
  };
};

// ─── User's own orders ────────────────────────────────────────────────────────
const getUserOrders = async (userId) => {
  const snap   = await db.collection(COL).where('userId', '==', userId).get();
  const orders = snap.docs.map(d => d.data());
  orders.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return orders;
};

// ─── Single order ─────────────────────────────────────────────────────────────
const getOrder = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);
  return snap.data();
};

// ─── Update order status ──────────────────────────────────────────────────────
const updateOrderStatus = async (id, data) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);

  const old     = snap.data();
  const history = [
    ...(old.statusHistory || []),
    { status: data.status, note: data.note || '', timestamp: new Date().toISOString() },
  ];

  const update = {
    status:        data.status,
    statusHistory: history,
    updatedAt:     FieldValue.serverTimestamp(),
  };
  if (data.trackingCode !== undefined) update.trackingCode = data.trackingCode;
  if (data.adminNote    !== undefined) update.adminNote    = data.adminNote;

  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

// ─── Update payment status (webhook / manual) ─────────────────────────────────
const updatePaymentStatus = async (id, { paymentStatus, transactionId, note }) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);

  const old    = snap.data();
  const update = {
    paymentStatus,
    paid:      paymentStatus === 'paid',
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (transactionId) update['paymentDetails.transactionId'] = transactionId;
  if (note) {
    update.statusHistory = [
      ...(old.statusHistory || []),
      { status: old.status, note, timestamp: new Date().toISOString() },
    ];
  }

  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

// ─── Delete order ─────────────────────────────────────────────────────────────
const deleteOrder = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);
  await db.collection(COL).doc(id).delete();
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const getOrderStats = async () => {
  const snap   = await db.collection(COL).get();
  const orders = snap.docs.map(d => d.data());

  const revenueByMethod = {};
  const countByMethod   = {};
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const m = o.paymentMethod || 'unknown';
    revenueByMethod[m] = (revenueByMethod[m] || 0) + (o.total || 0);
    countByMethod[m]   = (countByMethod[m]   || 0) + 1;
  }

  return {
    total:      orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    confirmed:  orders.filter(o => o.status === 'confirmed').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped:    orders.filter(o => o.status === 'shipped').length,
    delivered:  orders.filter(o => o.status === 'delivered').length,
    cancelled:  orders.filter(o => o.status === 'cancelled').length,
    paid:       orders.filter(o => o.paid === true || o.paymentStatus === 'paid').length,
    revenue:    +orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + (o.total || 0), 0)
      .toFixed(2),
    revenueByMethod,
    countByMethod,
  };
};

module.exports = {
  createOrder,
  listOrders,
  getUserOrders,
  getOrder,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats,
  PAYMENT_LABELS,
};
