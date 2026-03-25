/**
 * services/productService.js
 * All filtering/sorting done in memory — avoids Firestore composite index requirements.
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { deleteFromFirebase } = require('../utils/upload');

const COL = 'products';
const makeSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

const listActiveProducts = async ({ category = '', limit = 50, search = '', featured = false } = {}) => {
  const snap = await db.collection(COL).get();
  let products = snap.docs.map(d => d.data());
  products = products.filter(p => p.status === 'active');
  if (category) {
    const cat = category.toLowerCase();
    products = products.filter(p =>
      (p.categoryId || '').toLowerCase() === cat ||
      (p.category   || '').toLowerCase() === cat
    );
  }
  if (featured) products = products.filter(p => p.isFeatured === true);
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p =>
      p.name?.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s) ||
      p.tags?.some(t => t.toLowerCase().includes(s))
    );
  }
  products.sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  return products.slice(0, Number(limit));
};

const listProducts = async ({ page = 1, limit = 20, search = '', category = '', status = '', sortBy = 'createdAt', sortDir = 'desc' } = {}) => {
  const snap = await db.collection(COL).get();
  let products = snap.docs.map(d => d.data());
  if (status)   products = products.filter(p => p.status === status);
  if (category) {
    const cat = category.toLowerCase();
    products = products.filter(p =>
      (p.categoryId || '').toLowerCase() === cat ||
      (p.category   || '').toLowerCase() === cat
    );
  }
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(p =>
      p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s) ||
      p.categoryName?.toLowerCase().includes(s)
    );
  }
  products.sort((a, b) => {
    let va = a[sortBy], vb = b[sortBy];
    if (va?.toMillis) va = va.toMillis(); if (vb?.toMillis) vb = vb.toMillis();
    if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb||'').toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  const total = products.length;
  const start = (page - 1) * Number(limit);
  return { products: products.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
};

const getProduct = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Product not found.', 404);
  return snap.data();
};

const createProduct = async (data, thumbnailUrl = '', imageUrls = []) => {
  const id = uuidv4();
  const slug = data.slug || makeSlug(data.name);
  const doc = {
    id, name: data.name, slug,
    description: data.description || '', shortDescription: data.shortDescription || '',
    categoryId: data.categoryId || data.category || '',
    categoryName: data.categoryName || data.category || '',
    category: data.category || data.categoryId || '',
    price: Number(data.price), originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
    discount: data.discount ? Number(data.discount) : null,
    sku: data.sku || `SKU-${id.slice(0, 8).toUpperCase()}`,
    stock: Number(data.stock) || 0, unit: data.unit || 'pcs',
    thumbnail: thumbnailUrl, image: thumbnailUrl, images: imageUrls,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()) : []),
    isFeatured: data.isFeatured === true || data.isFeatured === 'true',
    isNew: data.isNew === true || data.isNew === 'true',
    badge: data.badge || '', status: data.status || 'active',
    rating: Number(data.rating) || 0, reviews: Number(data.reviews || data.reviewCount) || 0,
    reviewCount: Number(data.reviewCount || data.reviews) || 0,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

const updateProduct = async (id, data, newThumbnailUrl = null, newImageUrls = []) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Product not found.', 404);
  const old = snap.data();
  const update = { ...data, updatedAt: FieldValue.serverTimestamp() };
  if (data.name && !data.slug) update.slug = makeSlug(data.name);
  if (data.price !== undefined)  update.price = Number(data.price);
  if (data.stock !== undefined)  update.stock = Number(data.stock);
  if (data.originalPrice)        update.originalPrice = Number(data.originalPrice);
  if (data.tags && !Array.isArray(data.tags)) update.tags = data.tags.split(',').map(t => t.trim());
  if (data.isFeatured !== undefined) update.isFeatured = data.isFeatured === true || data.isFeatured === 'true';
  if (data.isNew !== undefined) update.isNew = data.isNew === true || data.isNew === 'true';
  if (data.badge !== undefined) update.badge = data.badge ?? '';
  if (data.category) { update.categoryId = data.category; update.categoryName = data.category; }
  if (newThumbnailUrl) { if (old.thumbnail) await deleteFromFirebase(old.thumbnail).catch(()=>{}); update.thumbnail = newThumbnailUrl; update.image = newThumbnailUrl; }
  if (newImageUrls.length > 0)   update.images = [...(old.images || []), ...newImageUrls];
  await db.collection(COL).doc(id).update(update);
  return { ...old, ...update };
};

const removeProductImage = async (id, imageUrl) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Product not found.', 404);
  const old = snap.data();
  await deleteFromFirebase(imageUrl).catch(()=>{});
  const images = (old.images || []).filter(img => img !== imageUrl);
  await db.collection(COL).doc(id).update({ images, updatedAt: FieldValue.serverTimestamp() });
  return { ...old, images };
};

const updateProductStatus = async (id, status) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Product not found.', 404);
  await db.collection(COL).doc(id).update({ status, updatedAt: FieldValue.serverTimestamp() });
  return { ...snap.data(), status };
};

const deleteProduct = async (id) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Product not found.', 404);
  const product = snap.data();
  if (product.thumbnail) await deleteFromFirebase(product.thumbnail).catch(()=>{});
  for (const img of product.images || []) await deleteFromFirebase(img).catch(()=>{});
  await db.collection(COL).doc(id).delete();
};

module.exports = { listActiveProducts, listProducts, getProduct, createProduct, updateProduct, removeProductImage, updateProductStatus, deleteProduct };