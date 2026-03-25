/**
 * routes/orders.js
 *
 * USER (auth required):
 *   POST /api/orders                  place order
 *   GET  /api/orders/my               user's own orders
 *   GET  /api/orders/my/:id           single order
 *
 * ADMIN:
 *   GET    /api/admin/orders
 *   GET    /api/admin/orders/:id
 *   PATCH  /api/admin/orders/:id/status
 *   DELETE /api/admin/orders/:id
 */
const { Router }    = require('express');
const orderService  = require('../services/orderService');
const asyncHandler  = require('../utils/asyncHandler');
const { success, created, paginated, noContent }     = require('../utils/response');
const { authenticate, requireAdmin, optionalAuth }   = require('../middleware/auth');
const { orderSchema, updateOrderStatusSchema, paginationSchema, validate } = require('../validations/schemas');

// ── Storefront ────────────────────────────────────────────────────────────────
const userRouter = Router();

userRouter.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const data   = validate(orderSchema, req.body);
  const userId = req.user?.uid || null;
  const order  = await orderService.createOrder(data, userId);
  created(res, order, 'Order placed successfully');
}));

userRouter.get('/my', authenticate, asyncHandler(async (req, res) => {
  const orders = await orderService.getUserOrders(req.user.uid);
  success(res, orders);
}));

userRouter.get('/my/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  // Users can only see their own orders
  if (order.userId && order.userId !== req.user.uid)
    return res.status(403).json({ success: false, message: 'Access denied.' });
  success(res, order);
}));

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/', asyncHandler(async (req, res) => {
  const q      = validate(paginationSchema, req.query);
  const result = await orderService.listOrders({ page: q.page, limit: q.limit, status: q.status, search: q.search });
  paginated(res, result.orders, { page: result.page, limit: result.limit, total: result.total });
}));

adminRouter.get('/stats', asyncHandler(async (req, res) => {
  success(res, await orderService.getOrderStats());
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  success(res, await orderService.getOrder(req.params.id));
}));

adminRouter.patch('/:id/status', asyncHandler(async (req, res) => {
  const data  = validate(updateOrderStatusSchema, req.body);
  const order = await orderService.updateOrderStatus(req.params.id, data);
  success(res, order, 'Order status updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await orderService.deleteOrder(req.params.id);
  noContent(res, 'Order deleted');
}));

module.exports = { userRouter, adminRouter };
