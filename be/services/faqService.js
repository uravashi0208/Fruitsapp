/**
 * services/faqService.js
 * FAQ CRUD — collection: "faqs"
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL = 'faqs';

const listFaqs = async (activeOnly = false) => {
  const snap = await db.collection(COL).get();
  let items  = snap.docs.map(d => d.data());
  if (activeOnly) items = items.filter(f => f.status === 'active');
  items.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return items;
};

const getFaq = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('FAQ not found.', 404);
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

const createFaq = async (data) => {
  const id        = uuidv4();
  const sortOrder = await resolveSortOrder(data.sortOrder);
  const doc = {
    id,
    question:  data.question,
    answer:    data.answer,
    category:  data.category || 'General',
    sortOrder,
    status:    data.status || 'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

const updateFaq = async (id, data) => {
  const ref  = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new AppError('FAQ not found.', 404);

  const update = { updatedAt: FieldValue.serverTimestamp() };
  if (data.question  !== undefined) update.question  = data.question;
  if (data.answer    !== undefined) update.answer    = data.answer;
  if (data.category  !== undefined) update.category  = data.category;
  if (data.sortOrder !== undefined) update.sortOrder = Number(data.sortOrder);
  if (data.status    !== undefined) update.status    = data.status;

  await ref.update(update);
  const updated = await ref.get();
  return updated.data();
};

const deleteFaq = async (id) => {
  const ref  = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new AppError('FAQ not found.', 404);
  await ref.delete();
};

module.exports = { listFaqs, getFaq, createFaq, updateFaq, deleteFaq };