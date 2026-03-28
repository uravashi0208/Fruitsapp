/**
 * routes/reviews.js
 *
 * PUBLIC:
 *   GET  /api/products/:productId/reviews      list active reviews (paginated)
 *   POST /api/products/:productId/reviews      submit review (auth optional — guest allowed)
 *
 * ADMIN:
 *   GET    /api/admin/products/:productId/reviews    all reviews with pagination
 *   DELETE /api/admin/reviews/:id                     delete a review
 */
const { Router }      = require('express');
const reviewService   = require('../services/reviewService');
const asyncHandler    = require('../utils/asyncHandler');
const { success, paginated, noContent } = require('../utils/response');
const { optionalAuth, authenticate, requireEditor } = require('../middleware/auth');

// ── Public / User ─────────────────────────────────────────────
const publicRouter = Router({ mergeParams: true });

publicRouter.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await reviewService.listProductReviews(req.params.productId, { page, limit });
  paginated(res, result.reviews, { page: result.page, limit: result.limit, total: result.total });
}));

publicRouter.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const { rating, comment, guestName } = req.body;

  if (!rating || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(422).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  const isGuest  = !req.user;
  const userId   = req.user?.id    || null;
  const userName = req.user?.name  || guestName || 'Guest';

  const review = await reviewService.createReview({
    productId: req.params.productId,
    userId,
    userName,
    rating: Number(rating),
    comment: comment || '',
    isGuest,
  });

  success(res, review, 'Review submitted successfully.');
}));

// ── Admin ─────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

adminRouter.get('/products/:productId/reviews', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await reviewService.adminListProductReviews(req.params.productId, { page, limit });
  paginated(res, result.reviews, { page: result.page, limit: result.limit, total: result.total });
}));

adminRouter.delete('/reviews/:id', asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id);
  noContent(res, 'Review deleted.');
}));

module.exports = { publicRouter, adminRouter };