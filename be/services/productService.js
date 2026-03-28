/**
 * services/productService.js
 * All filtering/sorting done in memory — avoids Firestore composite index requirements.
 *
 * Out-of-stock logic:
 *  - When stock reaches 0, status is automatically set to 'out_of_stock'
 *  - Admin receives an email alert immediately
 *  - Stock can go negative (back-order) via adjustStock with allowNegative=true
 *  - When stock is replenished (> 0), status reverts to 'active'
 */
const { v4: uuidv4 }     = require('uuid');
const { db, FieldValue } = require('../config/firebase');
const { AppError }       = require('../middleware/errorHandler');
const { deleteFromFirebase } = require('../utils/upload');
const { sendMail, buildEmailTemplate } = require('../utils/mailer');

const COL = 'products';
const makeSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ─── Out-of-stock email to admin ──────────────────────────────────────────────
const notifyAdminOutOfStock = async (product) => {
  try {
    const adminEmail = process.env.MAIL_USER;
    if (!adminEmail) return;

    const body = `
      <h2 style="color:#c0392b;margin:0 0 16px;">⚠️ Out of Stock Alert</h2>
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        The following product has reached <strong>zero stock</strong> and is now marked as
        <strong style="color:#c0392b;">Out of Stock</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;width:140px;">Product</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${product.name}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">SKU</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${product.sku || '—'}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Category</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${product.categoryName || product.category || '—'}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Current Stock</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#c0392b;font-weight:700;">${product.stock}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Product ID</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:13px;color:#888;">${product.id}</td>
        </tr>
      </table>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/products/${product.id}"
         style="display:inline-block;background:#82ae46;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;">
        Update Stock in Admin
      </a>
      <p style="margin-top:20px;font-size:12px;color:#aaa;">
        This is an automated alert from Vegefoods inventory management.
      </p>`;

    const html = buildEmailTemplate({ subject: `Out of Stock: ${product.name}`, body });
    await sendMail({
      to:      adminEmail,
      subject: `🚨 Out of Stock: ${product.name} (SKU: ${product.sku || product.id.slice(0, 8)})`,
      html,
      text:    `ALERT: "${product.name}" is now out of stock. Stock: ${product.stock}. Log in to admin to replenish.`,
    });
  } catch (err) {
    // Never let a mail failure crash the order flow
    console.error('[productService] Admin out-of-stock mail failed:', err.message);
  }
};

// ─── Low-stock threshold (configurable via env) ───────────────────────────────
const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '5', 10);

const notifyAdminLowStock = async (product) => {
  try {
    const adminEmail = process.env.MAIL_USER;
    if (!adminEmail) return;

    const body = `
      <h2 style="color:#e67e22;margin:0 0 16px;">⚡ Low Stock Warning</h2>
      <p style="font-size:15px;color:#333;margin:0 0 20px;">
        The following product is running low on stock (threshold: <strong>${LOW_STOCK_THRESHOLD} units</strong>).
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;width:140px;">Product</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${product.name}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">SKU</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#222;">${product.sku || '—'}</td>
        </tr>
        <tr>
          <td style="padding:10px 14px;background:#f8f9fa;font-weight:600;font-size:13px;color:#555;border:1px solid #e9ecef;">Remaining Stock</td>
          <td style="padding:10px 14px;border:1px solid #e9ecef;font-size:14px;color:#e67e22;font-weight:700;">${product.stock} units</td>
        </tr>
      </table>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/products/${product.id}"
         style="display:inline-block;background:#82ae46;color:#fff;text-decoration:none;
                padding:12px 28px;border-radius:6px;font-weight:600;font-size:14px;">
        Restock in Admin
      </a>`;

    const html = buildEmailTemplate({ subject: `Low Stock: ${product.name}`, body });
    await sendMail({
      to:      adminEmail,
      subject: `⚡ Low Stock Warning: ${product.name} — only ${product.stock} left`,
      html,
      text:    `WARNING: "${product.name}" is low on stock. Only ${product.stock} units remaining.`,
    });
  } catch (err) {
    console.error('[productService] Admin low-stock mail failed:', err.message);
  }
};


const toMs = (v) => v?.toMillis ? v.toMillis() : new Date(v || 0).getTime();

// ─── Derive status from stock ─────────────────────────────────────────────────
const deriveStatus = (stock, currentStatus) => {
  // Never override admin-set inactive/draft
  if (currentStatus === 'inactive' || currentStatus === 'draft') return currentStatus;
  if (Number(stock) <= 0) return 'out_of_stock';
  return 'active';
};

// ─── Atomic stock adjustment (used by orderService) ───────────────────────────
/**
 * Decrements / increments product stock inside a Firestore transaction.
 * Automatically flags out_of_stock and fires admin email.
 * @param {string} productId
 * @param {number} delta  negative = deduct, positive = restock
 * @param {{ allowNegative?: boolean }} opts
 */
const adjustStock = async (productId, delta, { allowNegative = false } = {}) => {
  const productRef = db.collection(COL).doc(productId);
  let resultData   = null;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(productRef);
    if (!snap.exists) throw new AppError(`Product ${productId} not found.`, 404);

    const product  = snap.data();
    const prev     = Number(product.stock) || 0;
    const computed = prev + delta;
    const newStock = allowNegative ? computed : Math.max(0, computed);
    const newStatus = deriveStatus(newStock, product.status);

    tx.update(productRef, {
      stock:     newStock,
      status:    newStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    resultData = {
      ...product,
      stock:         newStock,
      status:        newStatus,
      wasOutOfStock: prev > 0 && newStock <= 0,
      wasLowStock:   prev > LOW_STOCK_THRESHOLD && newStock > 0 && newStock <= LOW_STOCK_THRESHOLD,
    };
  });

  // Fire emails outside transaction so Firestore is already committed
  if (resultData.wasOutOfStock) {
    notifyAdminOutOfStock(resultData).catch(() => {});
  } else if (resultData.wasLowStock) {
    notifyAdminLowStock(resultData).catch(() => {});
  }

  return { newStock: resultData.stock, wasOutOfStock: resultData.wasOutOfStock };
};

// ─── List (storefront — active only) ─────────────────────────────────────────
const listActiveProducts = async ({ category = '', limit = 50, search = '', featured = false } = {}) => {
  const snap = await db.collection(COL).get();
  let products = snap.docs.map(d => d.data());
  // Storefront shows only active products (not out_of_stock, not draft/inactive)
  products = products.filter(p => p.status === 'active' || p.status === 'out_of_stock');
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

// ─── List (admin — all) ───────────────────────────────────────────────────────
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

// ─── Create ───────────────────────────────────────────────────────────────────
const createProduct = async (data, thumbnailUrl = '', imageUrls = []) => {
  const id   = uuidv4();
  const slug = data.slug || makeSlug(data.name);
  const stock = Number(data.stock) || 0;
  // Auto-derive status from stock if not explicitly set
  const explicitStatus = data.status && ['active','inactive','draft','out_of_stock'].includes(data.status)
    ? data.status : null;
  const status = explicitStatus || deriveStatus(stock, 'active');

  const doc = {
    id, name: data.name, slug,
    description: data.description || '', shortDescription: data.shortDescription || '',
    categoryId: data.categoryId || data.category || '',
    categoryName: data.categoryName || data.category || '',
    category: data.category || data.categoryId || '',
    price: Number(data.price), originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
    discount: data.discount ? Number(data.discount) : null,
    sku: data.sku || `SKU-${id.slice(0, 8).toUpperCase()}`,
    stock, unit: data.unit || 'pcs',
    thumbnail: thumbnailUrl, image: thumbnailUrl, images: imageUrls,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map(t => t.trim()) : []),
    isFeatured: data.isFeatured === true || data.isFeatured === 'true',
    isNew: data.isNew === true || data.isNew === 'true',
    badge: data.badge || '', status,
    rating: Number(data.rating) || 0, reviews: Number(data.reviews || data.reviewCount) || 0,
    reviewCount: Number(data.reviewCount || data.reviews) || 0,
    createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(COL).doc(id).set(doc);
  return { ...doc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

// ─── Update ───────────────────────────────────────────────────────────────────
const updateProduct = async (id, data, newThumbnailUrl = null, newImageUrls = []) => {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) throw new AppError('Product not found.', 404);
  const old = snap.data();
  const update = { ...data, updatedAt: FieldValue.serverTimestamp() };
  if (data.name && !data.slug) update.slug = makeSlug(data.name);
  if (data.price !== undefined)  update.price = Number(data.price);
  if (data.originalPrice)        update.originalPrice = Number(data.originalPrice);
  if (data.tags && !Array.isArray(data.tags)) update.tags = data.tags.split(',').map(t => t.trim());
  if (data.isFeatured !== undefined) update.isFeatured = data.isFeatured === true || data.isFeatured === 'true';
  if (data.isNew !== undefined) update.isNew = data.isNew === true || data.isNew === 'true';
  if (data.badge !== undefined) update.badge = data.badge ?? '';
  if (data.category) { update.categoryId = data.category; update.categoryName = data.category; }
  if (newThumbnailUrl) { if (old.thumbnail) await deleteFromFirebase(old.thumbnail).catch(()=>{}); update.thumbnail = newThumbnailUrl; update.image = newThumbnailUrl; }
  if (newImageUrls.length > 0)   update.images = [...(old.images || []), ...newImageUrls];

  // ── Stock change: auto-derive status and send emails ──────────────────────
  if (data.stock !== undefined) {
    const newStock  = Number(data.stock);
    const prevStock = Number(old.stock) || 0;
    update.stock  = newStock;

    // Only auto-manage status if admin hasn't locked it as inactive/draft
    const explicitStatus = data.status && ['active','inactive','draft','out_of_stock'].includes(data.status)
      ? data.status : null;
    if (!explicitStatus) {
      update.status = deriveStatus(newStock, old.status);
    }

    // Fire emails post-save (non-blocking)
    const wasOutOfStock = prevStock > 0 && newStock <= 0;
    const wasLowStock   = prevStock > LOW_STOCK_THRESHOLD && newStock > 0 && newStock <= LOW_STOCK_THRESHOLD;
    const productForMail = { ...old, ...update };

    if (wasOutOfStock) {
      setImmediate(() => notifyAdminOutOfStock(productForMail).catch(() => {}));
    } else if (wasLowStock) {
      setImmediate(() => notifyAdminLowStock(productForMail).catch(() => {}));
    }
  }

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
  if (!['active','inactive','draft','out_of_stock'].includes(status)) {
    throw new AppError('Invalid status.', 422);
  }
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

module.exports = {
  listActiveProducts, listProducts, getProduct,
  createProduct, updateProduct, removeProductImage,
  updateProductStatus, deleteProduct,
  adjustStock,                    // exported for orderService
  LOW_STOCK_THRESHOLD,
};
