/**
 * routes/dashboard.js
 *
 * GET /api/admin/dashboard
 *   Query params (all optional):
 *     period    : 'monthly' | 'quarterly' | 'annually'  (default: 'monthly')
 *     startDate : ISO date string  e.g. '2024-01-01'
 *     endDate   : ISO date string  e.g. '2024-03-31'
 *
 * When startDate + endDate are provided they take precedence over period and
 * the chart returns daily (or weekly for ranges > 90 days) buckets.
 */
const { Router }       = require('express');
const dashboardService = require('../services/dashboardService');
const asyncHandler     = require('../utils/asyncHandler');
const { success }      = require('../utils/response');
const { authenticate, requireEditor } = require('../middleware/auth');

const VALID_PERIODS = new Set(['monthly', 'quarterly', 'annually']);

const router = Router();
router.use(authenticate, requireEditor);

router.get('/', asyncHandler(async (req, res) => {
  const { period = 'monthly', startDate, endDate } = req.query;

  // Validate period
  const safePeriod = VALID_PERIODS.has(period) ? period : 'monthly';

  // Validate dates if provided
  const safeStart = startDate && !isNaN(Date.parse(startDate)) ? startDate : undefined;
  const safeEnd   = endDate   && !isNaN(Date.parse(endDate))   ? endDate   : undefined;

  const stats = await dashboardService.getDashboardStats({
    period:    safePeriod,
    startDate: safeStart,
    endDate:   safeEnd,
  });

  success(res, stats);
}));

module.exports = router;
