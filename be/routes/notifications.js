/**
 * routes/notifications.js
 *
 * ADMIN:
 *   GET    /api/admin/notifications          list (max 50)
 *   GET    /api/admin/notifications/unread   unread count
 *   PATCH  /api/admin/notifications/:id/read mark one read
 *   PATCH  /api/admin/notifications/read-all mark all read
 *   DELETE /api/admin/notifications/:id      delete one
 */
const { Router }            = require('express');
const notificationService   = require('../services/notificationService');
const asyncHandler          = require('../utils/asyncHandler');
const { success, noContent } = require('../utils/response');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  success(res, await notificationService.listNotifications());
}));

router.get('/unread', asyncHandler(async (req, res) => {
  success(res, { count: await notificationService.unreadCount() });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await notificationService.markAllRead();
  success(res, null, 'All notifications marked as read.');
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id);
  success(res, null, 'Notification marked as read.');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id);
  noContent(res);
}));

module.exports = router;
