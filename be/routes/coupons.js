/**
 * routes/coupons.js
 *
 * PUBLIC:
 *   POST /api/coupons/apply   { code, orderTotal }  → discount info
 *
 * ADMIN:
 *   GET    /api/admin/coupons
 *   POST   /api/admin/coupons
 *   PUT    /api/admin/coupons/:id
 *   DELETE /api/admin/coupons/:id
 */
const { Router }      = require('express');
const couponService   = require('../services/couponService');
const asyncHandler    = require('../utils/asyncHandler');
const { success, created, paginated, noContent } = require('../utils/response');
const { authenticate, requireAdmin }             = require('../middleware/auth');

// ── Public ────────────────────────────────────────────────────────────────────
const publicRouter = Router();

publicRouter.post('/apply', asyncHandler(async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(422).json({ success: false, message: 'code is required.' });
  const result = await couponService.applyCoupon(code, Number(orderTotal) || 0);
  success(res, result, 'Coupon applied successfully.');
}));

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', status = '' } = req.query;
  const result = await couponService.listCoupons({ page, limit, search, status });
  paginated(res, result.coupons, { page: result.page, limit: result.limit, total: result.total });
}));

adminRouter.post('/', asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);
  created(res, coupon, 'Coupon created.');
}));

adminRouter.put('/:id', asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  success(res, coupon, 'Coupon updated.');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.params.id);
  noContent(res, 'Coupon deleted.');
}));

module.exports = { publicRouter, adminRouter };
