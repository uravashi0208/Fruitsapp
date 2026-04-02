/**
 * routes/categories.js
 *
 * PUBLIC:
 *   GET /api/categories               list active categories
 *   GET /api/categories/:id           get single category
 *
 * ADMIN:
 *   GET    /api/admin/categories
 *   GET    /api/admin/categories/:id
 *   POST   /api/admin/categories       (multipart: image)
 *   PUT    /api/admin/categories/:id   (multipart: image)
 *   DELETE /api/admin/categories/:id
 */
const { Router }      = require('express');
const categoryService = require('../services/categoryService');
const asyncHandler    = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/response');
const { authenticate, requireEditor } = require('../middleware/auth');
const { upload, uploadToFirebase }    = require('../utils/upload');
const { categorySchema, updateCategorySchema, validate }    = require('../validations/schemas');

// ── Public ────────────────────────────────────────────────────────────────────
const publicRouter = Router();

publicRouter.get('/', asyncHandler(async (req, res) => {
  const cats = await categoryService.listCategories({ includeInactive: false });
  success(res, cats);
}));

publicRouter.get('/:id', asyncHandler(async (req, res) => {
  const cat = await categoryService.getCategory(req.params.id);
  success(res, cat);
}));

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

adminRouter.get('/', asyncHandler(async (req, res) => {
  const cats = await categoryService.listCategories({ includeInactive: true });
  success(res, cats);
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  const cat = await categoryService.getCategory(req.params.id);
  success(res, cat);
}));

adminRouter.post('/', upload.single('image'), asyncHandler(async (req, res) => {
  const data     = validate(categorySchema, req.body);
  let   imageUrl = '';
  if (req.file) imageUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'categories');
  const cat = await categoryService.createCategory(data, imageUrl);
  created(res, cat, 'Category created');
}));

adminRouter.put('/:id', upload.single('image'), asyncHandler(async (req, res) => {
  const data     = validate(updateCategorySchema, req.body);
  let   imageUrl = null;
  if (req.file) imageUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'categories');
  const cat = await categoryService.updateCategory(req.params.id, data, imageUrl);
  success(res, cat, 'Category updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  noContent(res, 'Category deleted');
}));

// ── Bulk routes ───────────────────────────────────────────────────────────────
adminRouter.patch('/bulk/status', asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
  const { db, FieldValue } = require('../config/firebase');
  const batch = db.batch();
  ids.forEach(id => batch.update(db.collection('categories').doc(id), { status, updatedAt: FieldValue.serverTimestamp() }));
  await batch.commit();
  success(res, { updated: ids.length }, `${ids.length} categories updated`);
}));

adminRouter.delete('/bulk', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
  const { db } = require('../config/firebase');
  const batch = db.batch();
  ids.forEach(id => batch.delete(db.collection('categories').doc(id)));
  await batch.commit();
  success(res, { deleted: ids.length }, `${ids.length} categories deleted`);
}));

module.exports = { publicRouter, adminRouter };