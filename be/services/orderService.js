/**
 * services/orderService.js — All sorts in memory, no composite indexes needed.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL = 'orders';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const generateOrderNumber = () =>
  'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

const createOrder = async (data, userId = null) => {
  const id = uuidv4();
  const orderNumber = generateOrderNumber();
  const subtotal = data.items.reduce((s, i) => s + i.price * (i.qty || i.quantity || 1), 0);
  const shipping  = subtotal > 100 ? 0 : 9.99;
  const tax       = subtotal * 0.08;
  const total     = subtotal + shipping + tax;

  const doc = {
    id, orderNumber, userId: userId || null,
    sessionId: data.sessionId || '',
    items: data.items.map(i => ({
      productId: i.productId || i.id || '',
      name: i.name || i.productName || '',
      price: Number(i.price),
      quantity: Number(i.qty || i.quantity || 1),
      image: i.image || i.thumbnail || '',
    })),
    address: data.billing || data.address || {},
    userName: data.billing?.firstName ? `${data.billing.firstName} ${data.billing.lastName || ''}`.trim() : (data.userName || ''),
    userEmail: data.billing?.email || data.userEmail || '',
    paymentMethod: data.payment?.method || 'card',
    paymentStatus: data.payment?.status || 'pending',
    paid: data.payment?.status === 'paid',
    status: 'pending',
    subtotal: +subtotal.toFixed(2), shipping: +shipping.toFixed(2),
    tax: +tax.toFixed(2), total: +total.toFixed(2),
    notes: data.notes || '', trackingCode: '', adminNote: '',
    statusHistory: [{ status: 'pending', note: 'Order placed', timestamp: new Date().toISOString() }],
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

const listOrders = async ({ page = 1, limit = 20, status = '', search = '', sortDir = 'desc' } = {}) => {
  const snap = await db.collection(COL).get();
  let orders = snap.docs.map(d => d.data());
  if (status) orders = orders.filter(o => o.status === status);
  if (search) {
    const s = search.toLowerCase();
    orders = orders.filter(o =>
      o.orderNumber?.toLowerCase().includes(s) ||
      o.userEmail?.toLowerCase().includes(s) ||
      o.userName?.toLowerCase().includes(s) ||
      o.address?.email?.toLowerCase().includes(s)
    );
  }
  orders.sort((a, b) => sortDir === 'desc' ? toMs(b.createdAt) - toMs(a.createdAt) : toMs(a.createdAt) - toMs(b.createdAt));
  const total = orders.length;
  const start = (page - 1) * Number(limit);
  return { orders: orders.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const getUserOrders = async (userId) => {
  const snap = await db.collection(COL).where('userId', '==', userId).get();
  const orders = snap.docs.map(d => d.data());
  orders.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return orders;
};

const getOrder = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);
  return snap.data();
};

const updateOrderStatus = async (id, data) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);
  const old = snap.data();
  const history = [...(old.statusHistory || []), {
    status: data.status, note: data.note || '', timestamp: new Date().toISOString()
  }];
  const update = { status: data.status, statusHistory: history, updatedAt: FieldValue.serverTimestamp() };
  if (data.trackingCode !== undefined) update.trackingCode = data.trackingCode;
  if (data.adminNote    !== undefined) update.adminNote    = data.adminNote;
  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

const deleteOrder = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Order not found.', 404);
  await db.collection(COL).doc(id).delete();
};

const getOrderStats = async () => {
  const snap   = await db.collection(COL).get();
  const orders = snap.docs.map(d => d.data());
  return {
    total:      orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped:    orders.filter(o => o.status === 'shipped').length,
    delivered:  orders.filter(o => o.status === 'delivered').length,
    cancelled:  orders.filter(o => o.status === 'cancelled').length,
    paid:       orders.filter(o => o.paid === true || o.paymentStatus === 'paid').length,
    revenue:    +orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0).toFixed(2),
  };
};

module.exports = { createOrder, listOrders, getUserOrders, getOrder, updateOrderStatus, deleteOrder, getOrderStats };
