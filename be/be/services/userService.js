/**
 * services/userService.js — In-memory filter/sort, no composite indexes.
 */
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();
const strip = (u) => { const { passwordHash, ...r } = u; return r; };

const listUsers = async ({ page = 1, limit = 20, search = '', collection = 'users', status = '', role = '' } = {}) => {
  const snapshot = await db.collection(collection).get();
  let docs = snapshot.docs.map(d => strip(d.data()));

  if (status) docs = docs.filter(u => u.status === status);
  if (role)   docs = docs.filter(u => u.role === role);
  if (search) {
    const s = search.toLowerCase();
    docs = docs.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s));
  }
  docs.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  const total = docs.length;
  const start = (page - 1) * Number(limit);
  return { users: docs.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const getUser = async (uid, collection = 'users') => {
  const snap = await db.collection(collection).doc(uid).get();
  if (!snap.exists) throw new AppError('User not found.', 404);
  return strip(snap.data());
};

const updateUser = async (uid, data, collection = 'users') => {
  const snap = await db.collection(collection).doc(uid).get();
  if (!snap.exists) throw new AppError('User not found.', 404);
  await db.collection(collection).doc(uid).update({ ...data, updatedAt: FieldValue.serverTimestamp() });
  return strip({ ...snap.data(), ...data });
};

const deleteUser = async (uid, collection = 'users') => {
  const snap = await db.collection(collection).doc(uid).get();
  if (!snap.exists) throw new AppError('User not found.', 404);
  await db.collection(collection).doc(uid).delete();
};

module.exports = { listUsers, getUser, updateUser, deleteUser };
