/**
 * services/couponService.js
 * Coupon / promo code management.
 * Collection: 'coupons'
 *
 * Coupon doc shape:
 *   { id, code, type: 'percent'|'fixed', value, minOrder, maxUses, usedCount,
 *     expiresAt, status: 'active'|'inactive', createdAt, updatedAt }
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL  = 'coupons';
const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const serialize = (doc) => ({
  ...doc,
  createdAt: doc.createdAt?.toMillis ? new Date(doc.createdAt.toMillis()).toISOString() : doc.createdAt,
  updatedAt: doc.updatedAt?.toMillis ? new Date(doc.updatedAt.toMillis()).toISOString() : doc.updatedAt,
  expiresAt: doc.expiresAt?.toMillis ? new Date(doc.expiresAt.toMillis()).toISOString() : doc.expiresAt,
});

// ─── Public: apply a coupon ────────────────────────────────────────────────────
const applyCoupon = async (code, orderTotal) => {
  if (!code) throw new AppError('Coupon code is required.', 422);

  const snap = await db.collection(COL)
    .where('code', '==', code.toUpperCase().trim())
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (snap.empty) throw new AppError('Invalid or expired coupon code.', 404);

  const ref = snap.docs[0].ref;
  const coupon = snap.docs[0].data();

  // Expiry check
  if (coupon.expiresAt) {
    const exp = coupon.expiresAt?.toMillis ? coupon.expiresAt.toMillis() : new Date(coupon.expiresAt).getTime();
    if (Date.now() > exp) throw new AppError('This coupon has expired.', 410);
  }

  // Max uses check
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    throw new AppError('This coupon has reached its usage limit.', 410);

  // Minimum order check
  if (coupon.minOrder && orderTotal < coupon.minOrder)
    throw new AppError(`Minimum order of $${coupon.minOrder.toFixed(2)} required for this coupon.`, 422);

  // Calculate discount
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = (orderTotal * coupon.value) / 100;
  } else {
    discount = Math.min(coupon.value, orderTotal);
  }
  discount = Math.round(discount * 100) / 100;

  return {
    couponId:  coupon.id,
    code:      coupon.code,
    type:      coupon.type,
    value:     coupon.value,
    discount,
    finalTotal: Math.max(0, orderTotal - discount),
  };
};

// ─── Admin: list all coupons ──────────────────────────────────────────────────
const listCoupons = async ({ page = 1, limit = 20, search = '', status = '' } = {}) => {
  const snap = await db.collection(COL).get();
  let coupons = snap.docs.map(d => serialize(d.data()));

  if (status) coupons = coupons.filter(c => c.status === status);
  if (search) {
    const s = search.toLowerCase();
    coupons = coupons.filter(c => c.code?.toLowerCase().includes(s));
  }

  coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = coupons.length;
  const p = Math.max(1, Number(page));
  const l = Math.min(100, Math.max(1, Number(limit)));
  return { coupons: coupons.slice((p - 1) * l, p * l), page: p, limit: l, total };
};

// ─── Admin: create coupon ─────────────────────────────────────────────────────
const createCoupon = async ({ code, type, value, minOrder = 0, maxUses = null, expiresAt = null }) => {
  const existing = await db.collection(COL).where('code', '==', code.toUpperCase().trim()).limit(1).get();
  if (!existing.empty) throw new AppError('Coupon code already exists.', 409);

  const id  = uuidv4();
  const doc = {
    id,
    code:      code.toUpperCase().trim(),
    type:      type || 'percent',
    value:     Number(value),
    minOrder:  Number(minOrder) || 0,
    maxUses:   maxUses ? Number(maxUses) : null,
    usedCount: 0,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    status:    'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection(COL).doc(id).set(doc);
  return serialize({ ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), expiresAt });
};

// ─── Admin: update coupon ─────────────────────────────────────────────────────
const updateCoupon = async (id, updates) => {
  const ref  = db.collection(COL).doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new AppError('Coupon not found.', 404);

  const allowed = ['type', 'value', 'minOrder', 'maxUses', 'expiresAt', 'status'];
  const data    = { updatedAt: FieldValue.serverTimestamp() };
  allowed.forEach(k => { if (updates[k] !== undefined) data[k] = updates[k]; });
  if (updates.expiresAt) data.expiresAt = new Date(updates.expiresAt);

  await ref.update(data);
  const updated = await ref.get();
  return serialize(updated.data());
};

// ─── Admin: delete coupon ─────────────────────────────────────────────────────
const deleteCoupon = async (id) => {
  const ref = db.collection(COL).doc(id);
  if (!(await ref.get()).exists) throw new AppError('Coupon not found.', 404);
  await ref.delete();
};

// ─── Increment usage (called from orderService after order placed) ────────────
const incrementUsage = async (couponId) => {
  if (!couponId) return;
  const ref = db.collection(COL).doc(couponId);
  await ref.update({ usedCount: FieldValue.increment(1) });
};

module.exports = { applyCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon, incrementUsage };
