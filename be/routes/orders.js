/**
 * routes/orders.js
 *
 * USER (optionalAuth — guest or logged-in):
 *   POST /api/orders                   place order
 *   GET  /api/orders/my                user's own orders   [JWT]
 *   GET  /api/orders/my/:id            single order        [JWT]
 *
 * ADMIN (JWT + admin role):
 *   GET    /api/admin/orders
 *   GET    /api/admin/orders/stats
 *   GET    /api/admin/orders/:id
 *   PATCH  /api/admin/orders/:id/status
 *   PATCH  /api/admin/orders/:id/payment  ← update payment status (webhook/manual)
 *   DELETE /api/admin/orders/:id
 */
const { Router }   = require('express');
const orderService = require('../services/orderService');
const asyncHandler = require('../utils/asyncHandler');
const {
  success, created, paginated, noContent,
} = require('../utils/response');
const {
  authenticate, requireAdmin, optionalAuth,
} = require('../middleware/auth');
const {
  orderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  paginationSchema,
  validate,
} = require('../validations/schemas');

// ── Storefront ────────────────────────────────────────────────────────────────
const userRouter = Router();

/** POST /api/orders — place an order (guest or authenticated) */
userRouter.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const data   = validate(orderSchema, req.body);
  const userId = req.user?.uid || null;
  const order  = await orderService.createOrder(data, userId);
  created(res, order, 'Order placed successfully');
}));

/** GET /api/orders/my — list current user's orders */
userRouter.get('/my', authenticate, asyncHandler(async (req, res) => {
  const orders = await orderService.getUserOrders(req.user.uid);
  success(res, orders);
}));

/** GET /api/orders/my/:id — single order (ownership-checked) */
userRouter.get('/my/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  if (order.userId && order.userId !== req.user.uid)
    return res.status(403).json({ success: false, message: 'Access denied.' });
  success(res, order);
}));

/** POST /api/orders/my/:id/cancel — cancel own order */
userRouter.post('/my/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id, req.user.uid);
  success(res, order, 'Order cancelled successfully.');
}));

/** GET /api/orders/lookup?email= — guest order lookup */
userRouter.get('/lookup', asyncHandler(async (req, res) => {
  const { email } = req.query;
  const orders = await orderService.getOrdersByEmail(email);
  success(res, orders);
}));

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

/** GET /api/admin/orders?page&limit&status&search&paymentMethod */
adminRouter.get('/', asyncHandler(async (req, res) => {
  const q = validate(paginationSchema, req.query);
  const result = await orderService.listOrders({
    page:          q.page,
    limit:         q.limit,
    status:        q.status        || '',
    search:        q.search        || '',
    paymentMethod: q.paymentMethod || '',
    sortDir:       q.sortDir       || 'desc',
  });
  paginated(res, result.orders, {
    page: result.page, limit: result.limit, total: result.total,
  });
}));

/** GET /api/admin/orders/stats */
adminRouter.get('/stats', asyncHandler(async (req, res) => {
  success(res, await orderService.getOrderStats());
}));

/** GET /api/admin/orders/:id */
adminRouter.get('/:id', asyncHandler(async (req, res) => {
  success(res, await orderService.getOrder(req.params.id));
}));

/** PATCH /api/admin/orders/:id/status — update fulfilment status */
adminRouter.patch('/:id/status', asyncHandler(async (req, res) => {
  const data  = validate(updateOrderStatusSchema, req.body);
  const order = await orderService.updateOrderStatus(req.params.id, data);
  success(res, order, 'Order status updated');
}));

/** PATCH /api/admin/orders/:id/payment — update payment status manually */
adminRouter.patch('/:id/payment', asyncHandler(async (req, res) => {
  const data  = validate(updatePaymentStatusSchema, req.body);
  const order = await orderService.updatePaymentStatus(req.params.id, data);
  success(res, order, 'Payment status updated');
}));

/** DELETE /api/admin/orders/:id */
adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  noContent(res, 'Order deleted');
}));

module.exports = { userRouter, adminRouter };