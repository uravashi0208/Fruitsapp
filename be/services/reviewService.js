/**
 * services/reviewService.js
 * Review CRUD stored in Firestore under 'reviews' collection.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');

const COL = 'reviews';

const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

/** Create a new review */
const createReview = async ({ productId, userId, userName, rating, comment, isGuest = false }) => {
  const id  = uuidv4();
  const doc = {
    id,
    productId,
    userId:   userId   || null,
    userName: userName || 'Guest',
    isGuest,
    rating:   Number(rating),
    comment:  comment || '',
    status:   'active',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);

  // Update product rating / reviewCount aggregate
  await updateProductAggregate(productId);

  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

/** List reviews for a product (public) */
const listProductReviews = async (productId, { page = 1, limit = 10 } = {}) => {
  const snap = await db.collection(COL)
    .where('productId', '==', productId)
    .where('status', '==', 'active')
    .get();

  let reviews = snap.docs.map(d => d.data());
  reviews.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  const total = reviews.length;
  const start = (Number(page) - 1) * Number(limit);
  return {
    reviews: reviews.slice(start, start + Number(limit)),
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

/** Admin: list all reviews for a product (any status) */
const adminListProductReviews = async (productId, { page = 1, limit = 10 } = {}) => {
  const snap = await db.collection(COL)
    .where('productId', '==', productId)
    .get();

  let reviews = snap.docs.map(d => d.data());
  reviews.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));

  const total = reviews.length;
  const start = (Number(page) - 1) * Number(limit);
  return {
    reviews: reviews.slice(start, start + Number(limit)),
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

/** Admin: delete a review */
const deleteReview = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Review not found.', 404);
  const { productId } = snap.data();
  await db.collection(COL).doc(id).delete();
  await updateProductAggregate(productId);
};

/** Recalculate and update product rating + reviewCount */
const updateProductAggregate = async (productId) => {
  try {
    const snap = await db.collection(COL)
      .where('productId', '==', productId)
      .where('status', '==', 'active')
      .get();

    const reviews = snap.docs.map(d => d.data());
    const count   = reviews.length;
    const avg     = count > 0
      ? Math.round((reviews.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10
      : 0;

    await db.collection('products').doc(productId).update({
      rating:      avg,
      reviews:     count,
      reviewCount: count,
      updatedAt:   FieldValue.serverTimestamp(),
    });
  } catch (_) {
    // silently fail — product might not exist
  }
};

module.exports = { createReview, listProductReviews, adminListProductReviews, deleteReview };