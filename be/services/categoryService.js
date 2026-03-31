/**
 * services/categoryService.js — In-memory sort, no composite index needed.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { deleteFromFirebase } = require('../utils/upload');

const COL = 'categories';
const makeSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const listCategories = async ({ includeInactive = false } = {}) => {
  const snap = await db.collection(COL).get();
  let cats = snap.docs.map(d => d.data());
  if (!includeInactive) cats = cats.filter(c => c.status === 'active');
  cats.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return cats;
};

const getCategory = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Category not found.', 404);
  return snap.data();
};

/**
 * Resolve sortOrder:
 * - If no records exist yet → use 0 (or user value)
 * - If records exist AND incoming is 0/empty/null/undefined → auto next
 * - If records exist AND user typed a non-zero value → honour it
 */
const resolveSortOrder = async (incoming) => {
  const snap = await db.collection(COL).get();
  if (snap.empty) {
    return (incoming !== undefined && incoming !== '' && incoming !== null)
      ? Number(incoming)
      : 0;
  }
  const orders = snap.docs.map(d => d.data().sortOrder ?? 0);
  const next   = Math.max(...orders) + 1;
  const val    = Number(incoming);
  if (incoming === undefined || incoming === '' || incoming === null || val === 0) return next;
  return val;
};

const createCategory = async (data, imageUrl = '') => {
  const id   = uuidv4();
  const slug = data.slug || makeSlug(data.name);
  const existing = await db.collection(COL).where('slug', '==', slug).limit(1).get();
  if (!existing.empty) throw new AppError('A category with this slug already exists.', 409);
  const sortOrder = await resolveSortOrder(data.sortOrder);
  const doc = {
    id, name: data.name, slug,
    description: data.description || '',
    image: imageUrl,
    status: data.status || 'active',
    sortOrder,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

const updateCategory = async (id, data, newImageUrl = null) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Category not found.', 404);
  const old    = snap.data();
  const update = { ...data, updatedAt: FieldValue.serverTimestamp() };
  if (newImageUrl) { if (old.image) await deleteFromFirebase(old.image).catch(()=>{}); update.image = newImageUrl; }
  if (data.name && !data.slug) update.slug = makeSlug(data.name);
  if (data.sortOrder !== undefined) update.sortOrder = Number(data.sortOrder);
  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

const deleteCategory = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Category not found.', 404);
  const cat = snap.data();
  if (cat.image) await deleteFromFirebase(cat.image).catch(()=>{});
  await db.collection(COL).doc(id).delete();
};

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };