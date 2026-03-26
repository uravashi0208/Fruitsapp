/**
 * routes/stripe.js
 *
 * POST /api/stripe/payment-intent   → create PaymentIntent, return clientSecret
 * POST /api/stripe/webhook          → Stripe webhook handler (raw body)
 * GET  /api/stripe/verify/:id       → verify PaymentIntent status
 */

const { Router }   = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { success }  = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const stripeService    = require('../services/stripeService');
const orderService     = require('../services/orderService');

const router = Router();

// ── Raw body collector needed for Stripe webhook signature verification ───────
function collectRawBody(req, res, next) {
  if (Buffer.isBuffer(req.body)) return next();
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end',  () => { req.body = Buffer.concat(chunks); next(); });
  req.on('error', next);
}

// ─── POST /api/stripe/payment-intent ─────────────────────────────────────────
router.post(
  '/payment-intent',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { amount, payMethod, customerEmail, orderId, billing } = req.body;

    if (!amount || Number(amount) <= 0) throw new AppError('Invalid amount.', 400);
    if (!payMethod)                     throw new AppError('payMethod is required.', 400);

    // COD has no Stripe step
    if (payMethod === 'cod') {
      return success(res, { clientSecret: null, paymentIntentId: null, isCod: true });
    }

    const result = await stripeService.createPaymentIntent({
      amount:        Number(amount),
      payMethod,
      customerEmail: customerEmail || (req.user && req.user.email) || '',
      orderId:       orderId || '',
      billing:       billing || {},
    });

    success(res, result);
  })
);

// ─── GET /api/stripe/verify/:paymentIntentId ──────────────────────────────────
router.get(
  '/verify/:paymentIntentId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const intent = await stripeService.retrievePaymentIntent(req.params.paymentIntentId);
    success(res, {
      status:          intent.status,
      paymentIntentId: intent.id,
      amount:          intent.amount / 100,
      currency:        intent.currency,
      paymentMethod:   (intent.payment_method_types || [])[0] || '',
    });
  })
);

// ─── POST /api/stripe/webhook ─────────────────────────────────────────────────
router.post(
  '/webhook',
  collectRawBody,
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripeService.constructWebhookEvent(req.body, sig);
    } catch (err) {
      console.error('Stripe webhook signature error:', err.message);
      return res.status(400).send('Webhook Error: ' + err.message);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent  = event.data.object;
        const orderId = intent.metadata && intent.metadata.orderId;
        if (orderId) {
          try {
            await orderService.updatePaymentStatus(orderId, {
              paymentStatus: 'paid',
              transactionId: intent.id,
              note: 'Stripe payment confirmed',
            });
          } catch (e) {
            console.error('Webhook: order update failed', orderId, e.message);
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent  = event.data.object;
        const orderId = intent.metadata && intent.metadata.orderId;
        if (orderId) {
          try {
            await orderService.updatePaymentStatus(orderId, {
              paymentStatus: 'failed',
              transactionId: intent.id,
              note: 'Stripe payment failed',
            });
          } catch (e) {
            console.error('Webhook: order update failed', orderId, e.message);
          }
        }
        break;
      }
      default:
        break;
    }

    res.json({ received: true });
  })
);

module.exports = router;
