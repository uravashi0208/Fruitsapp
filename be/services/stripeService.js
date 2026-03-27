/**
 * services/stripeService.js
 *
 * Centralises all Stripe interactions:
 *   • createPaymentIntent   — used by POST /api/stripe/payment-intent
 *   • confirmPaymentIntent  — (optional server-side confirm for redirect methods)
 *   • constructWebhookEvent — used by POST /api/stripe/webhook
 *   • PAYMENT_METHOD_TYPES  — list of Stripe payment method type strings
 *
 * Stripe payment method types supported:
 *   card | apple_pay | google_pay (via card/wallets)
 *   paypal | klarna | revolut_pay
 *   sepa_debit | ideal | bancontact | sofort | giropay | eps
 *   p24 (Przelewy24) | blik
 *
 * Cash on delivery (cod) is handled offline — no Stripe involvement.
 */

const Stripe = require('stripe');
const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } = require('../config/env');
 
let _stripe = null;
const stripe = () => {
  if (!_stripe) {
    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.startsWith('sk_test_YOUR')) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured. ' +
        'Add it to your .env file (https://dashboard.stripe.com/test/apikeys).'
      );
    }
    _stripe = Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
  }
  return _stripe;
};
 
// ─── Currency (your store uses USD display; Stripe amounts are in cents) ──────
const CURRENCY = 'usd';

/**
 * Create a PaymentIntent for the given order total.
 *
 * @param {object} opts
 * @param {number}   opts.amount        — in dollars, e.g. 49.99
 * @param {string}   opts.payMethod     — our internal PayMethod string
 * @param {string}   [opts.customerEmail]
 * @param {string}   [opts.orderId]     — used as metadata
 * @param {object}   [opts.billing]     — billing address from order
 * @returns {Promise<{clientSecret: string, paymentIntentId: string}>}
 */
const createPaymentIntent = async ({ amount, payMethod, customerEmail, orderId }) => {
  const amountCents = Math.round(amount * 100);
 
  const intentParams = {
    amount:   amountCents,
    currency: CURRENCY,
    // ✅ Must use automatic_payment_methods when frontend uses Elements deferred pattern
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      payMethod: payMethod || 'card',
      orderId:   orderId   || '',
    },
    description: `Order — ${payMethod || 'card'}`,
  };
 
  if (customerEmail) {
    intentParams.receipt_email = customerEmail;
  }
 
  const intent = await stripe().paymentIntents.create(intentParams);
  return {
    clientSecret:    intent.client_secret,
    paymentIntentId: intent.id,
  };
};

/**
 * Retrieve a PaymentIntent by ID (used to verify status after redirect flows).
 */
const retrievePaymentIntent = async (paymentIntentId) => {
  return stripe().paymentIntents.retrieve(paymentIntentId);
};

/**
 * Construct a Stripe webhook event from the raw request body + signature header.
 * Must be called BEFORE express.json() parses the body (use raw body middleware on this route).
 */
const constructWebhookEvent = (rawBody, signature) => {
  if (!STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET.startsWith('whsec_YOUR')) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return stripe().webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
};
module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  constructWebhookEvent,
  CURRENCY,
};