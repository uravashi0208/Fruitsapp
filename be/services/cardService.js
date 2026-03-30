/**
 * services/cardService.js
 * Payment cards stored per user — collection: "cards"
 *
 * Each document keyed by fingerprint (Stripe's stable card identifier),
 * so the same physical card used across multiple orders is stored ONCE,
 * not duplicated per order.
 *
 * If the user is a guest (userId = null), the card is still stored and
 * linked via userEmail so the admin Cards page shows it.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL  = 'cards';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

// ─── List (admin paginated) ───────────────────────────────────────────────────
const listCards = async ({ page = 1, limit = 20, search = '', userId = '' } = {}) => {
  const snap = await db.collection(COL).get();
  let cards  = snap.docs.map(d => d.data());

  if (userId) cards = cards.filter(c => c.userId === userId);
  if (search) {
    const s = search.toLowerCase();
    cards = cards.filter(c =>
      c.cardholderName?.toLowerCase().includes(s) ||
      c.userEmail?.toLowerCase().includes(s)      ||
      c.userName?.toLowerCase().includes(s)       ||
      c.last4?.includes(s)
    );
  }
  cards.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  const total = cards.length;
  const start = (page - 1) * Number(limit);
  return {
    cards: cards.slice(start, start + Number(limit)),
    total,
    page:  Number(page),
    limit: Number(limit),
  };
};

// ─── Single card ──────────────────────────────────────────────────────────────
const getCard = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Card not found.', 404);
  return snap.data();
};

// ─── Add card manually (admin) ────────────────────────────────────────────────
const addCard = async (data) => {
  const id  = uuidv4();
  const doc = {
    id,
    userId:         data.userId         || null,
    userName:       data.userName       || '',
    userEmail:      data.userEmail      || '',
    cardType:       data.cardType       || 'visa',
    last4:          data.last4          || '0000',
    expiryMonth:    data.expiryMonth    || '12',
    expiryYear:     data.expiryYear     || '2099',
    cardholderName: data.cardholderName || '',
    fingerprint:    data.fingerprint    || '',
    isDefault:      data.isDefault      === true,
    source:         'manual',
    createdAt:      FieldValue.serverTimestamp(),
    updatedAt:      FieldValue.serverTimestamp(),
  };

  if (doc.isDefault && doc.userId) {
    const existing = await db.collection(COL).where('userId', '==', doc.userId).get();
    const batch    = db.batch();
    existing.docs.forEach(d => batch.update(d.ref, { isDefault: false }));
    await batch.commit();
  }

  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString() };
};

// ─── Upsert card from order (called automatically after Stripe payment) ───────
/**
 * Called by orderService after a successful Stripe payment.
 * Uses Stripe's `fingerprint` as the dedup key — the same physical card
 * (even across different customers) will only be stored once.
 * If fingerprint is absent, dedupes by (userEmail + last4 + expiryMonth + expiryYear).
 *
 * @param {object} data
 * @param {string|null} data.userId
 * @param {string} data.userName
 * @param {string} data.userEmail
 * @param {string} data.cardType        — normalised brand: visa | mastercard | amex …
 * @param {string} data.last4
 * @param {string} data.expiryMonth     — zero-padded, e.g. "03"
 * @param {string} data.expiryYear      — 4-digit, e.g. "2028"
 * @param {string} data.cardholderName
 * @param {string} [data.fingerprint]   — Stripe card fingerprint (preferred dedup key)
 * @param {string} [data.orderId]       — for audit trail
 * @returns {Promise<{id: string, created: boolean}>}
 */
const upsertCardFromOrder = async (data) => {
  if (!data.last4) return null; // No card data — nothing to save

  let existingSnap = null;

  // 1. Dedup by fingerprint (most reliable)
  if (data.fingerprint) {
    const fpSnap = await db.collection(COL)
      .where('fingerprint', '==', data.fingerprint)
      .limit(1)
      .get();
    if (!fpSnap.empty) existingSnap = fpSnap.docs[0];
  }

  // 2. Fallback dedup: same email + last4 + expiry
  if (!existingSnap) {
    const fallbackSnap = await db.collection(COL)
      .where('userEmail',   '==', data.userEmail || '')
      .where('last4',       '==', data.last4)
      .where('expiryMonth', '==', data.expiryMonth)
      .where('expiryYear',  '==', data.expiryYear)
      .limit(1)
      .get();
    if (!fallbackSnap.empty) existingSnap = fallbackSnap.docs[0];
  }

  // 3. If found, update name/type fields that may have changed
  if (existingSnap) {
    const updates = {
      updatedAt: FieldValue.serverTimestamp(),
    };
    // Update userId if it was null before (guest became registered)
    if (data.userId && !existingSnap.data().userId) {
      updates.userId = data.userId;
    }
    // Update cardholder name if blank
    if (data.cardholderName && !existingSnap.data().cardholderName) {
      updates.cardholderName = data.cardholderName;
    }
    // Always freshen userName/userEmail
    if (data.userName)  updates.userName  = data.userName;
    if (data.userEmail) updates.userEmail = data.userEmail;
    if (data.orderId)   updates.lastOrderId = data.orderId;

    await existingSnap.ref.update(updates);
    console.log(`[cardService] upsert: updated existing card ${existingSnap.id} (last4=${data.last4})`);
    return { id: existingSnap.id, created: false };
  }

  // 4. New card — create document
  const id  = uuidv4();
  const doc = {
    id,
    userId:         data.userId         || null,
    userName:       data.userName       || '',
    userEmail:      data.userEmail      || '',
    cardType:       data.cardType       || 'visa',
    last4:          data.last4,
    expiryMonth:    data.expiryMonth    || '',
    expiryYear:     data.expiryYear     || '',
    cardholderName: data.cardholderName || '',
    fingerprint:    data.fingerprint    || '',
    isDefault:      false,
    source:         'stripe_order',     // audit: auto-created from order
    lastOrderId:    data.orderId        || '',
    createdAt:      FieldValue.serverTimestamp(),
    updatedAt:      FieldValue.serverTimestamp(),
  };

  await db.collection(COL).doc(id).set(doc);
  console.log(`[cardService] upsert: created new card ${id} (last4=${data.last4})`);
  return { id, created: true };
};

// ─── Set default card ─────────────────────────────────────────────────────────
const setDefaultCard = async (id, userId) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Card not found.', 404);

  const existing = await db.collection(COL).where('userId', '==', userId).get();
  const batch    = db.batch();
  existing.docs.forEach(d => batch.update(d.ref, { isDefault: d.id === id }));
  await batch.commit();

  return { id, isDefault: true };
};

// ─── Delete card ──────────────────────────────────────────────────────────────
const deleteCard = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Card not found.', 404);
  await db.collection(COL).doc(id).delete();
};

module.exports = {
  listCards,
  getCard,
  addCard,
  upsertCardFromOrder,
  setDefaultCard,
  deleteCard,
};
