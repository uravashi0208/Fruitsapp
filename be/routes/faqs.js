/**
 * routes/faqs.js
 *
 * PUBLIC:
 *   GET /api/faqs            — active FAQs (optionally filtered by category)
 *   GET /api/faqs/categories — all unique FAQ categories
 *
 * ADMIN:
 *   GET    /api/admin/faqs
 *   GET    /api/admin/faqs/:id
 *   POST   /api/admin/faqs
 *   PUT    /api/admin/faqs/:id
 *   PATCH  /api/admin/faqs/:id  (status toggle)
 *   DELETE /api/admin/faqs/:id
 */
const { Router }   = require('express');
const faqService   = require('../services/faqService');
const asyncHandler = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/response');
const { authenticate, requireEditor }  = require('../middleware/auth');
const Joi = require('joi');

// ── Validation schema ─────────────────────────────────────────
const faqSchema = Joi.object({
  question:  Joi.string().min(3).max(500).required(),
  answer:    Joi.string().min(3).max(5000).required(),
  category:  Joi.string().max(100).allow('').optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
  status:    Joi.string().valid('active', 'inactive').optional(),
});

const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false, allowUnknown: true });
  if (error) {
    const msg = error.details.map(d => d.message).join(', ');
    const err = new Error(msg);
    err.statusCode = 422;
    throw err;
  }
  return value;
};

// ── Public routes ─────────────────────────────────────────────
const publicRouter = Router();

publicRouter.get('/categories', asyncHandler(async (req, res) => {
  const faqs = await faqService.listFaqs(true);
  const cats = [...new Set(faqs.map(f => f.category).filter(Boolean))].sort();
  success(res, cats);
}));

publicRouter.get('/', asyncHandler(async (req, res) => {
  const { category = '' } = req.query;
  let faqs = await faqService.listFaqs(true);
  if (category) faqs = faqs.filter(f => f.category === category);
  success(res, faqs);
}));

// ── Admin routes ──────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

adminRouter.get('/', asyncHandler(async (req, res) => {
  const { status = '', category = '' } = req.query;
  let faqs = await faqService.listFaqs(false);
  if (status)   faqs = faqs.filter(f => f.status === status);
  if (category) faqs = faqs.filter(f => f.category === category);
  success(res, faqs);
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  success(res, await faqService.getFaq(req.params.id));
}));

adminRouter.post('/', asyncHandler(async (req, res) => {
  const data = validate(faqSchema, req.body);
  created(res, await faqService.createFaq(data), 'FAQ created');
}));

adminRouter.put('/:id', asyncHandler(async (req, res) => {
  const data = validate(faqSchema, req.body);
  success(res, await faqService.updateFaq(req.params.id, data), 'FAQ updated');
}));

adminRouter.patch('/:id', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (status && !['active', 'inactive'].includes(status))
    return res.status(422).json({ success: false, message: 'Invalid status.' });
  success(res, await faqService.updateFaq(req.params.id, req.body), 'FAQ updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await faqService.deleteFaq(req.params.id);
  noContent(res, 'FAQ deleted');
}));

module.exports = { publicRouter, adminRouter };
