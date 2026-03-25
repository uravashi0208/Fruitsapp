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
const { categorySchema, validate }    = require('../validations/schemas');

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
  const data     = validate(categorySchema, req.body);
  let   imageUrl = null;
  if (req.file) imageUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'categories');
  const cat = await categoryService.updateCategory(req.params.id, data, imageUrl);
  success(res, cat, 'Category updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id);
  noContent(res, 'Category deleted');
}));

module.exports = { publicRouter, adminRouter };
