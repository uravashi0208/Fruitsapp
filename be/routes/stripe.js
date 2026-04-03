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

// ─── GET /api/stripe/google-pay/test-status ──────────────────────────────────
// Google Pay test-mode info. No Google/merchant account required.
// Stripe test mode auto-provides a test payment instrument in Chrome/Edge.
router.get(
  '/google-pay/test-status',
  asyncHandler(async (req, res) => {
    const isTestMode = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_');
    success(res, {
      testMode: isTestMode,
      note: isTestMode
        ? 'Google Pay is in Stripe test mode. Open in Chrome/Edge — Stripe auto-injects a ' +
          'test instrument. No real Google Pay account or card needed.'
        : 'Live mode — enable Google Pay at dashboard.stripe.com/settings/payment_methods',
      requirements: [
        'Chrome, Edge, Brave, or any Chromium-based browser',
        'window.PaymentRequest API must be available (all modern Chromium browsers)',
        'Stripe PaymentElement rendered with wallets: { googlePay: "auto" }',
        'HTTPS or localhost (test mode allows localhost)',
        'In test mode: Stripe auto-provides test instrument — no real Google account needed',
      ],
      testMode_steps: [
        '1. Open checkout in Chrome (any OS — Windows, macOS, Linux, Android)',
        '2. Select "Google Pay" as payment method',
        '3. A Google Pay button appears inside the Stripe PaymentElement',
        '4. Click it — Stripe shows a test overlay (no real Google account popup in test mode)',
        '5. Confirm — order is placed, no real charge made',
      ],
      testCards: {
        note:       'In Stripe test mode, GPay uses Stripe test instruments — no real card needed',
        manualFallback: 'If GPay button does not appear, use card 4242 4242 4242 4242',
        expiry:     'Any future date (e.g. 12/34)',
        cvc:        'Any 3 digits',
      },
    });
  })
);

// ─── GET /api/stripe/apple-pay/test-status ────────────────────────────────────
// Returns Apple Pay availability info for test mode debugging.
// In test mode, Apple Pay shows on Safari/iOS automatically via Stripe.js.
// Requirements: HTTPS, Safari or iOS WebKit, Stripe.js loaded.
router.get(
  '/apple-pay/test-status',
  asyncHandler(async (req, res) => {
    const isTestMode = (process.env.STRIPE_SECRET_KEY || '').startsWith('sk_test_');
    success(res, {
      testMode: isTestMode,
      note: isTestMode
        ? 'Apple Pay is in Stripe test mode. Use Safari on macOS/iOS with a Stripe test card. ' +
          'The Apple Pay button appears automatically in the Stripe PaymentElement when conditions are met.'
        : 'Live mode — Apple Pay requires domain verification at dashboard.stripe.com/settings/payment_method_domains',
      stripePublishableKeyPrefix: (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '').slice(0, 14) + '...',
      requirements: [
        'HTTPS connection (or localhost for testing)',
        'Safari browser on macOS or any browser on iOS',
        'Device with Apple Pay configured (test cards work in Stripe test mode)',
        'Stripe PaymentElement rendered with wallets: { applePay: "auto" }',
      ],
      testCards: {
        visa:       '4242 4242 4242 4242',
        mastercard: '5555 5555 5555 4444',
        amex:       '3782 822463 10005',
        expiry:     'Any future date (e.g. 12/34)',
        cvc:        'Any 3 digits (4 for Amex)',
      },
    });
  })
);

module.exports = router;
