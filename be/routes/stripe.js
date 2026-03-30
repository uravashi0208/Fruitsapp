/**
 * routes/stripe.js
 *
 * POST /api/stripe/payment-intent          → create PaymentIntent, return clientSecret
 * GET  /api/stripe/verify/:id              → verify PaymentIntent status
 * GET  /api/stripe/payment-method/:pmId   → retrieve card details from a PM id ← NEW
 * POST /api/stripe/webhook                 → Stripe webhook handler (raw body)
 */

const { Router }      = require('express');
const asyncHandler    = require('../utils/asyncHandler');
const { success }     = require('../utils/response');
const { AppError }    = require('../middleware/errorHandler');
const { optionalAuth }    = require('../middleware/auth');
const stripeService   = require('../services/stripeService');
const orderService    = require('../services/orderService');
const cardService     = require('../services/cardService');

const router = Router();

// ── Raw body collector for webhook ────────────────────────────────────────────
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
    // Expand payment_method so we can return card details in one call
    const intent = await stripeService.retrievePaymentIntent(
      req.params.paymentIntentId,
      { expand: true }
    );

    const pm          = typeof intent.payment_method === 'object' ? intent.payment_method : null;
    const cardDetails = pm ? stripeService.extractCardDetails(pm, pm?.billing_details?.name) : null;

    success(res, {
      status:          intent.status,
      paymentIntentId: intent.id,
      paymentMethodId: pm?.id || (typeof intent.payment_method === 'string' ? intent.payment_method : ''),
      amount:          intent.amount / 100,
      currency:        intent.currency,
      paymentMethod:   (intent.payment_method_types || [])[0] || 'card',
      cardDetails,
    });
  })
);

// ─── GET /api/stripe/payment-method/:pmId ────────────────────────────────────
// Called by frontend right after confirmPayment() to get card details
router.get(
  '/payment-method/:pmId',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { pmId } = req.params;

    // Safety: only allow pm_xxx IDs
    if (!pmId.startsWith('pm_')) {
      throw new AppError('Invalid payment method ID.', 400);
    }

    const pm = await stripeService.retrievePaymentMethod(pmId);
    const cardholderName = req.query.name || pm.billing_details?.name || '';
    const cardDetails    = stripeService.extractCardDetails(pm, cardholderName);

    success(res, {
      paymentMethodId: pm.id,
      type:            pm.type,
      cardDetails,
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
        const orderId = intent.metadata?.orderId;

        if (orderId) {
          try {
            // 1. Update payment status
            await orderService.updatePaymentStatus(orderId, {
              paymentStatus: 'paid',
              transactionId: intent.id,
              note: 'Stripe payment confirmed via webhook',
            });

            // 2. Enrich order with card details from the PM
            const pmId = typeof intent.payment_method === 'string'
              ? intent.payment_method
              : intent.payment_method?.id;

            if (pmId && pmId.startsWith('pm_')) {
              try {
                const pm = await stripeService.retrievePaymentMethod(pmId);
                const cardDetails = stripeService.extractCardDetails(
                  pm,
                  pm.billing_details?.name || ''
                );

                if (cardDetails?.last4) {
                  await orderService.enrichPaymentDetails(orderId, cardDetails);
                }
              } catch (pmErr) {
                console.error('[stripe webhook] PM retrieval failed:', pmErr.message);
              }
            }
          } catch (e) {
            console.error('Webhook: order update failed', orderId, e.message);
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent  = event.data.object;
        const orderId = intent.metadata?.orderId;
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
