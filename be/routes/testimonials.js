/**
 * routes/testimonials.js
 *
 * PUBLIC:  GET /api/testimonials
 * ADMIN:   CRUD /api/admin/testimonials
 */
const { Router }       = require('express');
const testimonyService = require('../services/testimonyService');
const asyncHandler     = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/response');
const { authenticate, requireEditor } = require('../middleware/auth');
const { upload, uploadToFirebase }    = require('../utils/upload');
const { testimonySchema, updateTestimonySchema, validate }   = require('../validations/schemas');

const publicRouter = Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  success(res, await testimonyService.listTestimonials(true));
}));

const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

adminRouter.get('/', asyncHandler(async (req, res) => {
  success(res, await testimonyService.listTestimonials(false));
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  success(res, await testimonyService.getTestimony(req.params.id));
}));

adminRouter.post('/', upload.single('avatar'), asyncHandler(async (req, res) => {
  const data    = validate(testimonySchema, req.body);
  let avatarUrl = '';
  if (req.file) avatarUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'testimonials');
  created(res, await testimonyService.createTestimony(data, avatarUrl), 'Testimony created');
}));

adminRouter.put('/:id', upload.single('avatar'), asyncHandler(async (req, res) => {
  const data    = validate(updateTestimonySchema, req.body);
  let avatarUrl = null;
  if (req.file) avatarUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'testimonials');
  success(res, await testimonyService.updateTestimony(req.params.id, data, avatarUrl), 'Testimony updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await testimonyService.deleteTestimony(req.params.id);
  noContent(res, 'Testimony deleted');
}));

module.exports = { publicRouter, adminRouter };
