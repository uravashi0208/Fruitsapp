/**
 * routes/addresses.js
 * User delivery address CRUD.
 *
 *  GET    /api/addresses          — list user's addresses
 *  POST   /api/addresses          — add address
 *  PUT    /api/addresses/:id      — update address
 *  DELETE /api/addresses/:id      — delete address
 */

const { Router }         = require('express');
const addressService     = require('../services/addressService');
const asyncHandler       = require('../utils/asyncHandler');
const { success, created, noContent } = require('../utils/response');
const { authenticate }   = require('../middleware/auth');

const router = Router();
router.use(authenticate);

/** GET /api/addresses */
router.get('/', asyncHandler(async (req, res) => {
  const items = await addressService.getAddresses(req.user.uid);
  success(res, items);
}));

/** POST /api/addresses */
router.post('/', asyncHandler(async (req, res) => {
  const entry = await addressService.addAddress(req.user.uid, req.body);
  created(res, entry, 'Address saved.');
}));

/** PUT /api/addresses/:id */
router.put('/:id', asyncHandler(async (req, res) => {
  const entry = await addressService.updateAddress(req.user.uid, req.params.id, req.body);
  success(res, entry, 'Address updated.');
}));

/** DELETE /api/addresses/:id */
router.delete('/:id', asyncHandler(async (req, res) => {
  const remaining = await addressService.deleteAddress(req.user.uid, req.params.id);
  success(res, remaining, 'Address deleted.');
}));

module.exports = router;