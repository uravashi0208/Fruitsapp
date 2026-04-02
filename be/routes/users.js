/**
 * routes/users.js — Admin management of users and admin accounts.
 */
const { Router }    = require('express');
const userService   = require('../services/userService');
const asyncHandler  = require('../utils/asyncHandler');
const { success, paginated, noContent } = require('../utils/response');
const { authenticate, requireAdmin }    = require('../middleware/auth');
const { updateUserSchema, paginationSchema, validate } = require('../validations/schemas');

const makeUserRouter = (collection) => {
  const router = Router();
  router.use(authenticate, requireAdmin);

  // Stats
  router.get('/stats', asyncHandler(async (req, res) => {
    const result = await userService.listUsers({ page: 1, limit: 10000, collection });
    const users  = result.users;
    success(res, {
      total:    users.length,
      active:   users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      banned:   users.filter(u => u.status === 'banned').length,
    });
  }));

  // List
  router.get('/', asyncHandler(async (req, res) => {
    const q      = validate(paginationSchema, req.query);
    const result = await userService.listUsers({ ...q, collection });
    paginated(res, result.users, { page: result.page, limit: result.limit, total: result.total });
  }));

  // Get single
  router.get('/:id', asyncHandler(async (req, res) => {
    success(res, await userService.getUser(req.params.id, collection));
  }));

  // Update
  router.patch('/:id', asyncHandler(async (req, res) => {
    const data = validate(updateUserSchema, req.body);
    success(res, await userService.updateUser(req.params.id, data, collection), 'User updated');
  }));

  // Update status
  router.patch('/:id/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['active', 'inactive', 'banned'].includes(status))
      return res.status(422).json({ success: false, message: 'Invalid status.' });
    success(res, await userService.updateUser(req.params.id, { status }, collection), 'Status updated');
  }));

  // Delete
  router.delete('/:id', asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id, collection);
    noContent(res, 'User deleted');
  }));

  // Bulk status
  router.patch('/bulk/status', asyncHandler(async (req, res) => {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
    const { db, FieldValue } = require('../config/firebase');
    const batch = db.batch();
    ids.forEach(id => batch.update(db.collection(collection).doc(id), { status, updatedAt: FieldValue.serverTimestamp() }));
    await batch.commit();
    success(res, { updated: ids.length }, `${ids.length} users updated`);
  }));

  // Bulk delete
  router.delete('/bulk', asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
    const { db } = require('../config/firebase');
    const batch = db.batch();
    ids.forEach(id => batch.delete(db.collection(collection).doc(id)));
    await batch.commit();
    success(res, { deleted: ids.length }, `${ids.length} users deleted`);
  }));

  return router;
};

module.exports = {
  usersRouter:  makeUserRouter('users'),
  adminsRouter: makeUserRouter('admins'),
};