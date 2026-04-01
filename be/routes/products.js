/**
 * routes/products.js
 *
 * PUBLIC:
 *   GET /api/products               list active products (filter: category, search, featured)
 *   GET /api/products/:id           single product
 *
 * ADMIN:
 *   GET    /api/admin/products
 *   GET    /api/admin/products/:id
 *   POST   /api/admin/products       multipart: thumbnail (single) + images (up to 8)
 *   PUT    /api/admin/products/:id
 *   PATCH  /api/admin/products/:id/status
 *   DELETE /api/admin/products/:id
 *   DELETE /api/admin/products/:id/image   remove one image (body: { imageUrl })
 */
const { Router }     = require('express');
const productService = require('../services/productService');
const asyncHandler   = require('../utils/asyncHandler');
const { success, created, paginated, noContent } = require('../utils/response');
const { authenticate, requireEditor }            = require('../middleware/auth');
const { upload, uploadToFirebase }               = require('../utils/upload');
const { productSchema, updateProductSchema, paginationSchema, validate } = require('../validations/schemas');

// ── Public ────────────────────────────────────────────────────────────────────
const publicRouter = Router();

publicRouter.get('/', asyncHandler(async (req, res) => {
  const { category, limit = 50, search = '', featured } = req.query;
  const products = await productService.listActiveProducts({ category, limit, search, featured: featured === 'true' });
  success(res, products);
}));

publicRouter.get('/:id', asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  success(res, product);
}));

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

adminRouter.get('/', asyncHandler(async (req, res) => {
  const q      = validate(paginationSchema, req.query);
  const result = await productService.listProducts({ ...q, sortBy: q.sortBy || 'createdAt', sortDir: q.sortDir || 'desc' });
  paginated(res, result.products, { page: result.page, limit: result.limit, total: result.total });
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  success(res, product);
}));

// Create — accepts thumbnail + up to 8 images
adminRouter.post(
  '/',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images',    maxCount: 8 },
  ]),
  asyncHandler(async (req, res) => {
    const data = validate(productSchema, req.body);

    let thumbnailUrl = '';
    let imageUrls    = [];

    if (req.files?.thumbnail?.[0]) {
      const f = req.files.thumbnail[0];
      thumbnailUrl = await uploadToFirebase(f.buffer, f.originalname, f.mimetype, 'products');
    }
    if (req.files?.images) {
      imageUrls = await Promise.all(
        req.files.images.map(f => uploadToFirebase(f.buffer, f.originalname, f.mimetype, 'products'))
      );
    }

    const product = await productService.createProduct(data, thumbnailUrl, imageUrls);
    created(res, product, 'Product created');
  })
);

// Update — same multipart fields
adminRouter.put(
  '/:id',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images',    maxCount: 8 },
  ]),
  asyncHandler(async (req, res) => {
    const data = validate(updateProductSchema, req.body);

    let newThumbnailUrl = null;
    let newImageUrls    = [];

    if (req.files?.thumbnail?.[0]) {
      const f = req.files.thumbnail[0];
      newThumbnailUrl = await uploadToFirebase(f.buffer, f.originalname, f.mimetype, 'products');
    }
    if (req.files?.images) {
      newImageUrls = await Promise.all(
        req.files.images.map(f => uploadToFirebase(f.buffer, f.originalname, f.mimetype, 'products'))
      );
    }

    const product = await productService.updateProduct(req.params.id, data, newThumbnailUrl, newImageUrls);
    success(res, product, 'Product updated');
  })
);

// Change status only
adminRouter.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'draft'].includes(status))
    return res.status(422).json({ success: false, message: 'Invalid status value.' });
  const product = await productService.updateProduct(req.params.id, { status });
  success(res, product, 'Status updated');
}));

// Remove single image
adminRouter.delete('/:id/image', asyncHandler(async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) return res.status(422).json({ success: false, message: 'imageUrl required.' });
  const product = await productService.removeProductImage(req.params.id, imageUrl);
  success(res, product, 'Image removed');
}));

// Delete product
adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  noContent(res, 'Product deleted');
}));

// ── Bulk operations ───────────────────────────────────────────────────────────

// PATCH /api/admin/products/bulk/status  { ids: string[], status: 'active'|'inactive' }
adminRouter.patch('/bulk/status', asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length)
    return res.status(422).json({ success: false, message: 'ids array is required.' });
  if (!['active', 'inactive'].includes(status))
    return res.status(422).json({ success: false, message: 'status must be active or inactive.' });
  const result = await productService.bulkUpdateStatus(ids, status);
  success(res, result, `${result.updated} product(s) set to ${status}`);
}));

// DELETE /api/admin/products/bulk  { ids: string[] }  — soft delete (sets deleted=1)
adminRouter.delete('/bulk', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length)
    return res.status(422).json({ success: false, message: 'ids array is required.' });
  const result = await productService.softDeleteProducts(ids);
  success(res, result, `${result.deleted} product(s) soft-deleted`);
}));


// ── Import products from Excel/CSV ───────────────────────────────────────────
// Uses memory storage so no file hits disk
const memUpload = require('multer')({ storage: require('multer').memoryStorage() });

adminRouter.post('/import', memUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(422).json({ success: false, message: 'No file uploaded. Please attach an Excel or CSV file.' });
  }

  const ext = req.file.originalname.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    return res.status(422).json({ success: false, message: 'Unsupported file type. Please upload .xlsx, .xls, or .csv' });
  }

  const XLSX = require('xlsx');
  const wb   = XLSX.read(req.file.buffer, { type: 'buffer' });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (!rows.length) {
    return res.status(422).json({ success: false, message: 'File has no data rows. Make sure row 1 is a header.' });
  }

  const results = { created: 0, skipped: 0, errors: [] };

  for (const [i, row] of rows.entries()) {
    try {
      // Normalise column keys — lowercase + underscores
      const r = {};
      for (const [k, v] of Object.entries(row)) {
        r[k.trim().toLowerCase().replace(/[\s\-/]+/g, '_')] = v;
      }

      const name = String(r.name || r.product_name || r.product || '').trim();
      if (!name) { results.skipped++; continue; }

      const price = parseFloat(r.price || r.selling_price || r.sale_price || 0);
      if (isNaN(price) || price < 0) {
        results.errors.push(`Row ${i + 2} "${name}": invalid price "${r.price}"`);
        continue;
      }

      const imgUrl = String(r.image_url || r.image || r.thumbnail || r.photo || '').trim();

      await productService.createProduct(
        {
          name,
          price,
          originalPrice:  r.original_price || r.compare_price || r.mrp || null,
          sku:            String(r.sku || r.sku_code || '').trim() || null,
          category:       String(r.category || r.category_name || '').trim(),
          description:    String(r.description || r.desc || '').trim(),
          stock:          parseInt(r.stock || r.quantity || r.qty || 0) || 0,
          status:         ['active','inactive','draft'].includes(String(r.status || '').toLowerCase())
                            ? String(r.status).toLowerCase() : 'active',
          badge:          String(r.badge || r.brand || r.label || '').trim(),
          tags:           String(r.tags || r.tag || '').trim(),
          isFeatured:     String(r.featured || r.is_featured || '').toLowerCase() === 'true',
          isNew:          String(r.is_new || r.new || '').toLowerCase() === 'true',
          unit:           String(r.unit || 'pcs').trim(),
          rating:         parseFloat(r.rating || 0) || 0,
          reviews:        parseInt(r.reviews || r.review_count || 0) || 0,
        },
        imgUrl,
        imgUrl ? [imgUrl] : []
      );
      results.created++;
    } catch (err) {
      results.errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  const msg = `Import done — ${results.created} created, ${results.skipped} skipped, ${results.errors.length} error(s).`;
  success(res, results, msg);
}));

module.exports = { publicRouter, adminRouter };
