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

const COL  = 'orders';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const generateOrderNumber = () =>
  'ORD-' + Date.now().toString(36).toUpperCase() + '-' +
  Math.random().toString(36).slice(2, 6).toUpperCase();

// ─── Payment detail extractor ─────────────────────────────────────────────────
/**
 * Normalises the raw payment block from the request into a clean,
 * DB-safe paymentDetails object (no raw PANs, no full IBANs).
 */
const extractPaymentDetails = (payment = {}) => {
  const method = payment.method || 'cod';
  const base   = { method, status: payment.status || 'pending' };

  switch (method) {
    // ── Card ──────────────────────────────────────────────────────────────────
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

    // ── Apple Pay / Google Pay (tokenised — same structure as card) ───────────
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

    // ── PayPal ────────────────────────────────────────────────────────────────
    case 'paypal':
      return {
        ...base,
        paypalEmail:    payment.paypalEmail    || '',
        paypalOrderId:  payment.paypalOrderId  || '',
        transactionId:  payment.transactionId  || '',
      };

    // ── Klarna ────────────────────────────────────────────────────────────────
    case 'klarna':
      return {
        ...base,
        klarnaOrderId:  payment.klarnaOrderId  || '',
        transactionId:  payment.transactionId  || '',
        instalments:    payment.instalments    || 3,
      };

    // ── Revolut Pay ───────────────────────────────────────────────────────────
    case 'revolut':
      return {
        ...base,
        revolutOrderId: payment.revolutOrderId || '',
        transactionId:  payment.transactionId  || '',
      };

    // ── SEPA Direct Debit ─────────────────────────────────────────────────────
    case 'sepa_debit':
      return {
        ...base,
        ibanLast4:     payment.ibanLast4     || '',
        accountHolder: payment.accountHolder || '',
        mandateRef:    payment.mandateRef    || '',
        transactionId: payment.transactionId || '',
      };

    // ── iDEAL (Netherlands) ───────────────────────────────────────────────────
    case 'ideal':
      return {
        ...base,
        idealBank:     payment.idealBank     || '',
        transactionId: payment.transactionId || '',
      };

    // ── Bancontact (Belgium) ──────────────────────────────────────────────────
    case 'bancontact':
      return {
        ...base,
        last4:         payment.last4         || '',
        transactionId: payment.transactionId || '',
      };

    // ── SOFORT / Klarna Pay Now ───────────────────────────────────────────────
    case 'sofort':
      return {
        ...base,
        sofortBank:    payment.sofortBank    || '',
        sofortRef:     payment.sofortRef     || '',
        transactionId: payment.transactionId || '',
      };

    // ── Giropay (Germany) ─────────────────────────────────────────────────────
    case 'giropay':
      return {
        ...base,
        bic:           payment.bic           || '',
        transactionId: payment.transactionId || '',
      };

    // ── EPS Transfer (Austria) ────────────────────────────────────────────────
    case 'eps':
      return {
        ...base,
        epsBank:       payment.epsBank       || '',
        transactionId: payment.transactionId || '',
      };

    // ── Przelewy24 (Poland) ───────────────────────────────────────────────────
    case 'przelewy24':
      return {
        ...base,
        p24TransactionId: payment.p24TransactionId || '',
        transactionId:    payment.transactionId    || '',
      };

    // ── BLIK (Poland) ─────────────────────────────────────────────────────────
    case 'blik':
      // Never store the BLIK code itself — only the confirmation ref
      return {
        ...base,
        blikRef:       payment.blikRef       || '',
        transactionId: payment.transactionId || '',
      };

    // ── Cash on Delivery ──────────────────────────────────────────────────────
    case 'cod':
      return {
        ...base,
        codNote: payment.codNote || '',
      };

    // ── Unknown fallback ──────────────────────────────────────────────────────
    default:
      return { ...base, transactionId: payment.transactionId || '' };
  }
};

// ─── Human-readable label for payment method ─────────────────────────────────
const PAYMENT_LABELS = {
  card:       'Credit / Debit Card',
  apple_pay:  'Apple Pay',
  google_pay: 'Google Pay',
  paypal:     'PayPal',
  klarna:     'Klarna — Pay in 3',
  revolut:    'Revolut Pay',
  sepa_debit: 'SEPA Direct Debit',
  ideal:      'iDEAL',
  bancontact: 'Bancontact',
  sofort:     'SOFORT / Klarna Pay Now',
  giropay:    'Giropay',
  eps:        'EPS Transfer',
  przelewy24: 'Przelewy24',
  blik:       'BLIK',
  cod:        'Cash on Delivery',
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
      productId: i.productId || i.id || '',
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

    // Payment
    paymentMethod:      paymentDetails.method,
    paymentMethodLabel: PAYMENT_LABELS[paymentDetails.method] || paymentDetails.method,
    paymentStatus:      paymentDetails.status,
    paid:               paymentDetails.status === 'paid',
    paymentDetails,

    // Financials
    status:   'pending',
    subtotal: +subtotal.toFixed(2),
    shipping: +shipping.toFixed(2),
    tax:      +tax.toFixed(2),
    total:    +total.toFixed(2),

    // Meta
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

  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
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
  if (transactionId) {
    update['paymentDetails.transactionId'] = transactionId;
  }
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

  // Revenue by payment method
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