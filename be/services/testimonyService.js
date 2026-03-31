/**
 * services/testimonyService.js
 * Testimonials CRUD — collection: "testimonials"
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { deleteFromFirebase } = require('../utils/upload');

const COL = 'testimonials';

const listTestimonials = async (activeOnly = false) => {
  const snap = await db.collection(COL).orderBy('createdAt', 'desc').get();
  let items  = snap.docs.map(d => d.data());
  if (activeOnly) items = items.filter(t => t.status === 'active');
  return items;
};

const getTestimony = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Testimony not found.', 404);
  return snap.data();
};

const createTestimony = async (data, avatarUrl = '') => {
  const id  = uuidv4();
  const doc = {
    id,
    name:     data.name,
    position: data.position || '',
    message:  data.message,
    rating:   Number(data.rating) || 5,
    avatar:   avatarUrl,
    status:   data.status || 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

const updateTestimony = async (id, data, newAvatarUrl = null) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Testimony not found.', 404);
  const old    = snap.data();
  const update = { ...data, updatedAt: FieldValue.serverTimestamp() };
  if (newAvatarUrl) {
    if (old.avatar) await deleteFromFirebase(old.avatar);
    update.avatar = newAvatarUrl;
  }
  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

const deleteTestimony = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Testimony not found.', 404);
  const t = snap.data();
  if (t.avatar) await deleteFromFirebase(t.avatar);
  await db.collection(COL).doc(id).delete();
};

const setStatus = async (id, status) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Testimony not found.', 404);
  await db.collection(COL).doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() });
  return { ...snap.data(), status };
};

module.exports = { listTestimonials, getTestimony, createTestimony, updateTestimony, deleteTestimony, setStatus };
