/**
 * routes/wishlist.js
 */
const { Router }       = require('express');
const wishlistService  = require('../services/wishlistService');
const asyncHandler     = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/response');
const { authenticate, requireAdmin }  = require('../middleware/auth');
const { wishlistSchema, paginationSchema, validate } = require('../validations/schemas');

// ── User wishlist ─────────────────────────────────────────────────────────────
const userRouter = Router();
userRouter.use(authenticate);

userRouter.get('/', asyncHandler(async (req, res) => {
  success(res, await wishlistService.getWishlist(req.user.uid));
}));

userRouter.post('/', asyncHandler(async (req, res) => {
  const { productId } = validate(wishlistSchema, req.body);
  created(res, await wishlistService.addToWishlist(req.user.uid, productId), 'Added to wishlist');
}));

userRouter.get('/check/:productId', asyncHandler(async (req, res) => {
  success(res, { inWishlist: await wishlistService.checkWishlist(req.user.uid, req.params.productId) });
}));

userRouter.delete('/clear', asyncHandler(async (req, res) => {
  await wishlistService.clearWishlist(req.user.uid);
  noContent(res, 'Wishlist cleared');
}));

userRouter.delete('/:productId', asyncHandler(async (req, res) => {
  success(res, await wishlistService.removeFromWishlist(req.user.uid, req.params.productId), 'Removed from wishlist');
}));

// ── Admin wishlist ────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/', asyncHandler(async (req, res) => {
  const { search = '', userId = '' } = req.query;
  const result = await wishlistService.listAllWishlists({ search, userId });
  success(res, result);
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await wishlistService.removeWishlistEntry(req.params.id);
  noContent(res, 'Entry removed');
}));

module.exports = { userRouter, adminRouter };
