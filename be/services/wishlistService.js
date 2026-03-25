/**
 * services/wishlistService.js — Wishlist stored per-user doc + admin flat view.
 */
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const productService     = require('./productService');

const COL = 'wishlists';

const getWishlist = async (userId) => {
  const snap = await db.collection(COL).doc(userId).get();
  if (!snap.exists) return [];
  return snap.data().items || [];
};

const addToWishlist = async (userId, productId) => {
  const product = await productService.getProduct(productId);
  const snap    = await db.collection(COL).doc(userId).get();
  const items   = snap.exists ? (snap.data().items || []) : [];
  if (items.find(i => i.productId === productId)) throw new AppError('Product already in wishlist.', 409);

  const entry = {
    id:        `${userId}_${productId}`,
    productId,
    name:      product.name,
    price:     product.price,
    thumbnail: product.thumbnail || (product.images && product.images[0]) || '',
    addedAt:   new Date().toISOString(),
  };
  await db.collection(COL).doc(userId).set(
    { userId, items: FieldValue.arrayUnion(entry), updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  return [...items, entry];
};

const removeFromWishlist = async (userId, productId) => {
  const snap = await db.collection(COL).doc(userId).get();
  if (!snap.exists) throw new AppError('Wishlist not found.', 404);
  const items = snap.data().items || [];
  const entry = items.find(i => i.productId === productId);
  if (!entry) throw new AppError('Product not in wishlist.', 404);
  await db.collection(COL).doc(userId).update({
    items: FieldValue.arrayRemove(entry), updatedAt: FieldValue.serverTimestamp(),
  });
  return items.filter(i => i.productId !== productId);
};

const checkWishlist = async (userId, productId) => {
  const snap  = await db.collection(COL).doc(userId).get();
  const items = snap.exists ? (snap.data().items || []) : [];
  return items.some(i => i.productId === productId);
};

const clearWishlist = async (userId) => {
  await db.collection(COL).doc(userId).set({ userId, items: [], updatedAt: FieldValue.serverTimestamp() });
};

// Admin: list all wishlists flat — returns { entries, byUser, total }
const listAllWishlists = async ({ search = '', userId = '' } = {}) => {
  const snap = await db.collection(COL).get();
  const all  = snap.docs.map(d => d.data());

  // Build flat entries list
  let entries = [];
  all.forEach(doc => {
    (doc.items || []).forEach(item => {
      entries.push({
        id:              item.id || `${doc.userId}_${item.productId}`,
        userId:          doc.userId,
        userName:        doc.userName  || doc.userId,
        userEmail:       doc.userEmail || '',
        productId:       item.productId,
        productName:     item.name      || '',
        productImage:    item.thumbnail || '',
        productPrice:    item.price     || 0,
        productCategory: item.category || '',
        addedAt:         item.addedAt  || '',
      });
    });
  });

  if (userId) entries = entries.filter(e => e.userId === userId);
  if (search) {
    const s = search.toLowerCase();
    entries = entries.filter(e =>
      e.productName?.toLowerCase().includes(s) ||
      e.userName?.toLowerCase().includes(s) ||
      e.userEmail?.toLowerCase().includes(s)
    );
  }

  // Group by user
  const userMap = {};
  entries.forEach(e => {
    if (!userMap[e.userId]) userMap[e.userId] = { userId: e.userId, userName: e.userName, userEmail: e.userEmail, items: [] };
    userMap[e.userId].items.push(e);
  });

  return { entries, byUser: Object.values(userMap), total: entries.length };
};

// Admin: remove a specific wishlist entry by composite id (userId_productId)
const removeWishlistEntry = async (entryId) => {
  // entryId format: userId_productId
  const parts     = entryId.split('_');
  const productId = parts.slice(1).join('_');
  const userId    = parts[0];
  return removeFromWishlist(userId, productId);
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist, clearWishlist, listAllWishlists, removeWishlistEntry };
