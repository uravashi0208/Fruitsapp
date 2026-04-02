/**
 * routes/sliders.js
 *
 * PUBLIC:  GET /api/sliders          (active only)
 * ADMIN:   CRUD /api/admin/sliders
 */
const { Router }     = require('express');
const sliderService  = require('../services/sliderService');
const asyncHandler   = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/response');
const { authenticate, requireEditor } = require('../middleware/auth');
const { upload, uploadToFirebase }    = require('../utils/upload');
const { sliderSchema, validate }      = require('../validations/schemas');

const publicRouter = Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  const sliders = await sliderService.listSliders(true);
  success(res, sliders);
}));

const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

adminRouter.get('/', asyncHandler(async (req, res) => {
  success(res, await sliderService.listSliders(false));
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  success(res, await sliderService.getSlider(req.params.id));
}));

adminRouter.post('/', upload.single('image'), asyncHandler(async (req, res) => {
  const data  = validate(sliderSchema, req.body);
  let imgUrl  = '';
  if (req.file) imgUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'sliders');
  created(res, await sliderService.createSlider(data, imgUrl), 'Slider created');
}));

adminRouter.put('/:id', upload.single('image'), asyncHandler(async (req, res) => {
  const data  = validate(sliderSchema, req.body);
  let imgUrl  = null;
  if (req.file) imgUrl = await uploadToFirebase(req.file.buffer, req.file.originalname, req.file.mimetype, 'sliders');
  success(res, await sliderService.updateSlider(req.params.id, data, imgUrl), 'Slider updated');
}));

adminRouter.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status))
    return res.status(422).json({ success: false, message: 'Invalid status.' });
  success(res, await sliderService.updateSlider(req.params.id, { status }), 'Status updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await sliderService.deleteSlider(req.params.id);
  noContent(res, 'Slider deleted');
}));

adminRouter.patch('/bulk/status', asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
  const { db, FieldValue } = require('../config/firebase');
  const batch = db.batch();
  ids.forEach(id => batch.update(db.collection('sliders').doc(id), { status, updatedAt: FieldValue.serverTimestamp() }));
  await batch.commit();
  success(res, { updated: ids.length }, `${ids.length} sliders updated`);
}));

adminRouter.delete('/bulk', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
  const { db } = require('../config/firebase');
  const batch = db.batch();
  ids.forEach(id => batch.delete(db.collection('sliders').doc(id)));
  await batch.commit();
  success(res, { deleted: ids.length }, `${ids.length} sliders deleted`);
}));

module.exports = { publicRouter, adminRouter };