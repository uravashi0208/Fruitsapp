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

// Lazily initialised so the app still boots without a key (CI/test env)
let _stripe = null;
const stripe = () => {
  if (!_stripe) {
    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.startsWith('sk_test_YOUR')) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured. ' +
        'Add it to your .env file (get it from https://dashboard.stripe.com/test/apikeys).'
      );
    }
    _stripe = Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
  }
  return _stripe;
};

// ─── Stripe payment_method_types per our PayMethod ───────────────────────────
const STRIPE_PM_MAP = {
  card:        ['card'],
  apple_pay:   ['card'],   // Apple Pay comes through Stripe's card object
  google_pay:  ['card'],   // Same — tokenised card
  paypal:      ['paypal'],
  klarna:      ['klarna'],
  revolut:     ['revolut_pay'],
  sepa_debit:  ['sepa_debit'],
  ideal:       ['ideal'],
  bancontact:  ['bancontact'],
  sofort:      ['sofort'],
  giropay:     ['giropay'],
  eps:         ['eps'],
  przelewy24:  ['p24'],
  blik:        ['blik'],
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
const createPaymentIntent = async ({ amount, payMethod, customerEmail, orderId, billing }) => {
  const pmTypes = STRIPE_PM_MAP[payMethod] || ['card'];
  const amountCents = Math.round(amount * 100);

  const intentParams = {
    amount:                 amountCents,
    currency:               CURRENCY,
    payment_method_types:   pmTypes,
    metadata: {
      payMethod,
      orderId: orderId || '',
    },
    description: `Order — ${payMethod}`,
  };

  if (customerEmail) {
    intentParams.receipt_email = customerEmail;
  }

  // Attach billing address for card payments (helps with fraud detection)
  if (billing && pmTypes.includes('card')) {
    intentParams.payment_method_options = {
      card: {
        request_three_d_secure: 'automatic',
      },
    };
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
  STRIPE_PM_MAP,
  CURRENCY,
};