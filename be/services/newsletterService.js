/**
 * services/newsletterService.js — In-memory filter/sort.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL = 'newsletter';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const subscribe = async ({ email, name = '' }) => {
  const existing = await db.collection(COL).where('email', '==', email).limit(1).get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    if (doc.data().status === 'active') throw new AppError('Email already subscribed.', 409);
    await db.collection(COL).doc(doc.id).update({ status: 'active', updatedAt: FieldValue.serverTimestamp() });
    return { ...doc.data(), status: 'active' };
  }
  const id  = uuidv4();
  const doc = { id, email, name, status: 'active', createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString() };
};

const unsubscribe = async (email) => {
  const snap = await db.collection(COL).where('email', '==', email).limit(1).get();
  if (snap.empty) throw new AppError('Email not found.', 404);
  await db.collection(COL).doc(snap.docs[0].id).update({ status: 'unsubscribed', updatedAt: FieldValue.serverTimestamp() });
};

const listSubscribers = async ({ page = 1, limit = 50, status = '' } = {}) => {
  const snap = await db.collection(COL).get();
  let all    = snap.docs.map(d => d.data());
  if (status) all = all.filter(s => s.status === status);
  all.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  const total = all.length;
  const start = (page - 1) * Number(limit);
  return { subscribers: all.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const deleteSubscriber = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Subscriber not found.', 404);
  await db.collection(COL).doc(id).delete();
};

const setStatus = async (id, status) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Subscriber not found.', 404);
  await db.collection(COL).doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() });
  return { ...snap.data(), status };
};

module.exports = { subscribe, unsubscribe, listSubscribers, deleteSubscriber, setStatus };
