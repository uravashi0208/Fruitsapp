/**
 * routes/auth.js
 *
 * PUBLIC USER:
 *   POST /api/auth/register
 *   POST /api/auth/login
 *   POST /api/auth/refresh
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 *   PATCH /api/auth/me/password
 *
 * ADMIN:
 *   POST /api/admin/auth/register
 *   POST /api/admin/auth/login
 *   POST /api/admin/auth/refresh
 *   POST /api/admin/auth/logout
 *   GET  /api/admin/auth/me
 *   PATCH /api/admin/auth/me/password
 */
const { Router }      = require('express');
const authService     = require('../services/authService');
const asyncHandler    = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const { authenticate }     = require('../middleware/auth');
const { authRateLimiter }  = require('../middleware/rateLimiter');
const {
  loginSchema, registerSchema,
  changePasswordSchema, refreshTokenSchema,
  validate,
} = require('../validations/schemas');

const makeAuthRouter = (collection) => {
  const router = Router();

  router.post('/register', authRateLimiter, asyncHandler(async (req, res) => {
    const data   = validate(registerSchema, req.body);
    const result = await authService.register(data, collection);
    created(res, result, 'Registration successful');
  }));

  router.post('/login', authRateLimiter, asyncHandler(async (req, res) => {
    const data   = validate(loginSchema, req.body);
    const result = await authService.login(data, collection);
    success(res, result, 'Login successful');
  }));

  router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = validate(refreshTokenSchema, req.body);
    const result           = await authService.refreshAccessToken(refreshToken);
    success(res, result);
  }));

  router.post('/logout', authenticate, (req, res) => {
    success(res, null, 'Logged out successfully');
  });

  router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const profile = await authService.getProfile(req.user.uid, collection);
    success(res, profile);
  }));

  // Update own profile
  router.patch('/me', authenticate, asyncHandler(async (req, res) => {
    const { updateUserSchema } = require('../validations/schemas');
    const allowed = (({ name, phone, bio, firstName, lastName, country, city, postalCode, taxId, facebook, twitter, linkedin, instagram }) =>
      ({ name, phone, bio, firstName, lastName, country, city, postalCode, taxId, facebook, twitter, linkedin, instagram })
    )(req.body);
    // strip undefined keys
    Object.keys(allowed).forEach(k => allowed[k] === undefined && delete allowed[k]);
    const updated = await authService.updateProfile(req.user.uid, allowed, collection);
    success(res, updated, 'Profile updated');
  }));

  router.patch('/me/password', authenticate, asyncHandler(async (req, res) => {
    const data = validate(changePasswordSchema, req.body);
    await authService.changePassword(req.user.uid, data, collection);
    success(res, null, 'Password changed successfully');
  }));

  return router;
};

module.exports = { userAuthRouter: makeAuthRouter('users'), adminAuthRouter: makeAuthRouter('admins') };
