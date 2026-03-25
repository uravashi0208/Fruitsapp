/**
 * routes/dashboard.js
 * GET /api/admin/dashboard — aggregate stats for admin panel.
 */
const { Router }        = require('express');
const dashboardService  = require('../services/dashboardService');
const asyncHandler      = require('../utils/asyncHandler');
const { success }       = require('../utils/response');
const { authenticate, requireEditor } = require('../middleware/auth');

const router = Router();
router.use(authenticate, requireEditor);

router.get('/', asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  success(res, stats);
}));

module.exports = router;
