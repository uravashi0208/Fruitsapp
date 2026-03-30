/**
 * routes/tracking.js
 *
 * PUBLIC:
 *   GET  /api/tracking/:code          — public lookup by tracking/order number
 *
 * ADMIN (JWT + admin):
 *   GET  /api/admin/tracking/:orderId          — full timeline for admin
 *   POST /api/admin/tracking/:orderId/assign   — assign / update tracking code
 *   POST /api/admin/tracking/:orderId/event    — add a custom tracking event
 *   DELETE /api/admin/tracking/:orderId/events — clear all custom events
 *
 * WEBHOOK (carrier callbacks, secured by secret header):
 *   POST /api/tracking/webhook/:carrier
 */

const { Router }          = require('express');
const trackingService     = require('../services/trackingService');
const asyncHandler        = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ── Public router ─────────────────────────────────────────────────────────────
const publicRouter = Router();

/** GET /api/tracking/:code */
publicRouter.get('/:code', asyncHandler(async (req, res) => {
  const result = await trackingService.lookupTracking(req.params.code);
  success(res, result);
}));

/** POST /api/tracking/webhook/:carrier — carrier webhook */
publicRouter.post('/webhook/:carrier', asyncHandler(async (req, res) => {
  // Validate shared secret (set CARRIER_WEBHOOK_SECRET in .env)
  const secret = process.env.CARRIER_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers['x-webhook-secret'] || req.headers['x-carrier-secret'];
    if (incoming !== secret) {
      return res.status(401).json({ success: false, message: 'Invalid webhook secret.' });
    }
  }

  const result = await trackingService.ingestWebhook(req.params.carrier, req.body);
  success(res, result, 'Webhook received');
}));

// ── Admin router ──────────────────────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

/** GET /api/admin/tracking/:orderId — full tracking timeline */
adminRouter.get('/:orderId', asyncHandler(async (req, res) => {
  const result = await trackingService.getTrackingTimeline(req.params.orderId);
  success(res, result);
}));

/** POST /api/admin/tracking/:orderId/assign — assign tracking code */
adminRouter.post('/:orderId/assign', asyncHandler(async (req, res) => {
  const { trackingCode, carrierCode, estimatedDelivery, note } = req.body;
  const result = await trackingService.assignTracking(req.params.orderId, {
    trackingCode,
    carrierCode,
    estimatedDelivery,
    note,
  });
  success(res, result, 'Tracking assigned');
}));

/** POST /api/admin/tracking/:orderId/event — add custom event */
adminRouter.post('/:orderId/event', asyncHandler(async (req, res) => {
  const { status, location, note, timestamp } = req.body;
  const event = await trackingService.addTrackingEvent(req.params.orderId, {
    status,
    location,
    note,
    actor: 'admin',
    timestamp,
  });
  created(res, event, 'Tracking event added');
}));

/** DELETE /api/admin/tracking/:orderId/events — clear custom events */
adminRouter.delete('/:orderId/events', asyncHandler(async (req, res) => {
  await trackingService.clearTrackingEvents(req.params.orderId);
  success(res, null, 'Tracking events cleared');
}));

module.exports = { publicRouter, adminRouter };
