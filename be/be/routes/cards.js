/**
 * routes/cards.js
 * ADMIN:
 *   GET    /api/admin/cards
 *   GET    /api/admin/cards/:id
 *   POST   /api/admin/cards
 *   PATCH  /api/admin/cards/:id/default
 *   DELETE /api/admin/cards/:id
 */
const { Router }    = require('express');
const cardService   = require('../services/cardService');
const asyncHandler  = require('../utils/asyncHandler');
const { success, created, paginated, noContent } = require('../utils/response');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', userId = '' } = req.query;
  const result = await cardService.listCards({ page: Number(page), limit: Number(limit), search, userId });
  paginated(res, result.cards, { page: result.page, limit: result.limit, total: result.total });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  success(res, await cardService.getCard(req.params.id));
}));

router.post('/', asyncHandler(async (req, res) => {
  created(res, await cardService.addCard(req.body), 'Card added');
}));

router.patch('/:id/default', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(422).json({ success: false, message: 'userId required.' });
  success(res, await cardService.setDefaultCard(req.params.id, userId), 'Default card updated');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await cardService.deleteCard(req.params.id);
  noContent(res, 'Card deleted');
}));

module.exports = router;
