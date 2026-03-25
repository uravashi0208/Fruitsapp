/**
 * services/cardService.js
 * Payment cards stored per user — collection: "cards"
 * Each card is a separate document with userId reference.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL = 'cards';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const listCards = async ({ page = 1, limit = 20, search = '', userId = '' } = {}) => {
  const snap = await db.collection(COL).get();
  let cards  = snap.docs.map(d => d.data());

  if (userId) cards = cards.filter(c => c.userId === userId);
  if (search) {
    const s = search.toLowerCase();
    cards = cards.filter(c =>
      c.cardholderName?.toLowerCase().includes(s) ||
      c.userEmail?.toLowerCase().includes(s) ||
      c.userName?.toLowerCase().includes(s) ||
      c.last4?.includes(s)
    );
  }
  cards.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  const total = cards.length;
  const start = (page - 1) * Number(limit);
  return { cards: cards.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const getCard = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Card not found.', 404);
  return snap.data();
};

const addCard = async (data) => {
  const id  = uuidv4();
  const doc = {
    id,
    userId:         data.userId,
    userName:       data.userName       || '',
    userEmail:      data.userEmail      || '',
    cardType:       data.cardType       || 'visa',
    last4:          data.last4          || '0000',
    expiryMonth:    data.expiryMonth    || '12',
    expiryYear:     data.expiryYear     || '2099',
    cardholderName: data.cardholderName || '',
    isDefault:      data.isDefault      === true,
    createdAt:      FieldValue.serverTimestamp(),
  };

  // If setting as default, unset others for this user
  if (doc.isDefault) {
    const existing = await db.collection(COL).where('userId', '==', data.userId).get();
    const batch    = db.batch();
    existing.docs.forEach(d => batch.update(d.ref, { isDefault: false }));
    await batch.commit();
  }

  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString() };
};

const setDefaultCard = async (id, userId) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Card not found.', 404);

  const existing = await db.collection(COL).where('userId', '==', userId).get();
  const batch    = db.batch();
  existing.docs.forEach(d => batch.update(d.ref, { isDefault: d.id === id }));
  await batch.commit();

  return { id, isDefault: true };
};

const deleteCard = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Card not found.', 404);
  await db.collection(COL).doc(id).delete();
};

module.exports = { listCards, getCard, addCard, setDefaultCard, deleteCard };
