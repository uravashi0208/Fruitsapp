/**
 * services/notificationService.js
 * Admin notification centre — new orders, low stock, new contacts.
 * Collection: 'adminNotifications'
 *
 * Doc shape: { id, type, title, message, read, link, createdAt }
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');

const COL = 'adminNotifications';

const serialize = (doc) => ({
  ...doc,
  createdAt: doc.createdAt?.toMillis ? new Date(doc.createdAt.toMillis()).toISOString() : doc.createdAt,
});

// ─── Create a notification ────────────────────────────────────────────────────
const createNotification = async ({ type, title, message, link = '' }) => {
  const id  = uuidv4();
  const doc = {
    id, type, title, message, link,
    read:      false,
    createdAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return doc;
};

// ─── List (unread first, max 50) ──────────────────────────────────────────────
const listNotifications = async () => {
  const snap = await db.collection(COL).orderBy('createdAt', 'desc').limit(50).get();
  return snap.docs.map(d => serialize(d.data()));
};

// ─── Unread count ─────────────────────────────────────────────────────────────
const unreadCount = async () => {
  const snap = await db.collection(COL).where('read', '==', false).get();
  return snap.size;
};

// ─── Mark one as read ─────────────────────────────────────────────────────────
const markRead = async (id) => {
  await db.collection(COL).doc(id).update({ read: true });
};

// ─── Mark all as read ─────────────────────────────────────────────────────────
const markAllRead = async () => {
  const snap = await db.collection(COL).where('read', '==', false).get();
  const batch = db.batch();
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
};

// ─── Delete one ───────────────────────────────────────────────────────────────
const deleteNotification = async (id) => {
  await db.collection(COL).doc(id).delete();
};

// ─── Convenience: new order notification ─────────────────────────────────────
const notifyNewOrder = async (order) =>
  createNotification({
    type:    'order',
    title:   'New Order',
    message: `Order ${order.orderNumber} placed — $${(order.total || 0).toFixed(2)}`,
    link:    `/admin/orders/${order.id}`,
  });

// ─── Convenience: low-stock notification ─────────────────────────────────────
const notifyLowStock = async (product) =>
  createNotification({
    type:    'stock',
    title:   'Low Stock Alert',
    message: `"${product.name}" has only ${product.stock} unit(s) left.`,
    link:    `/admin/products/${product.id}`,
  });

// ─── Convenience: new contact notification ───────────────────────────────────
const notifyNewContact = async (contact) =>
  createNotification({
    type:    'contact',
    title:   'New Contact Message',
    message: `${contact.name || 'Someone'} sent a message: "${(contact.message || '').slice(0, 60)}..."`,
    link:    '/admin/contacts',
  });

module.exports = {
  createNotification,
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
  deleteNotification,
  notifyNewOrder,
  notifyLowStock,
  notifyNewContact,
};
