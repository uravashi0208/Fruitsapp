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

  return router;
};

module.exports = {
  usersRouter:  makeUserRouter('users'),
  adminsRouter: makeUserRouter('admins'),
};
