/**
 * services/stripeService.js
 *
 * Centralises all Stripe interactions:
 *   • createPaymentIntent     — POST /api/stripe/payment-intent
 *   • retrievePaymentIntent   — GET  /api/stripe/verify/:id
 *   • retrievePaymentMethod   — GET  /api/stripe/payment-method/:pmId  ← NEW
 *   • extractCardDetails      — parse Stripe PM → our CardDetails shape ← NEW
 *   • constructWebhookEvent   — POST /api/stripe/webhook
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

const CURRENCY = 'usd';

// ─── Brand normalisation ──────────────────────────────────────────────────────
// Stripe brands: visa, mastercard, amex, discover, diners, jcb, unionpay, unknown
const normaliseBrand = (brand = '') => {
  const b = brand.toLowerCase();
  const MAP = {
    visa: 'visa', mastercard: 'mastercard', amex: 'amex',
    american_express: 'amex', discover: 'discover',
    diners: 'diners', jcb: 'jcb', unionpay: 'unionpay',
  };
  return MAP[b] || b || 'visa';
};

// ─── Extract card details from a Stripe PaymentMethod object ──────────────────
/**
 * Returns our internal CardDetails shape from any Stripe PM object.
 * Works for card, apple_pay (card_present), google_pay, etc.
 *
 * @param {import('stripe').Stripe.PaymentMethod} pm
 * @param {string} [cardholderName]  — billing name from billing_details
 * @returns {{ cardholderName, last4, expiryMonth, expiryYear, cardType, brand } | null}
 */
const extractCardDetails = (pm, cardholderName = '') => {
  if (!pm) return null;

  const card = pm.card || pm.card_present;
  if (!card) return null;

  return {
    cardholderName: cardholderName || pm.billing_details?.name || '',
    last4:          card.last4          || '',
    expiryMonth:    card.exp_month ? String(card.exp_month).padStart(2, '0') : '',
    expiryYear:     card.exp_year  ? String(card.exp_year)                    : '',
    cardType:       normaliseBrand(card.brand),
    brand:          card.brand || '',
    fingerprint:    card.fingerprint || '',  // for dedup in cards collection
    funding:        card.funding || '',      // credit | debit | prepaid
    network:        card.networks?.preferred || card.brand || '',
  };
};

// ─── Create PaymentIntent ─────────────────────────────────────────────────────
const createPaymentIntent = async ({ amount, payMethod, customerEmail, orderId }) => {
  const amountCents = Math.round(amount * 100);

  const intentParams = {
    amount:   amountCents,
    currency: CURRENCY,
    automatic_payment_methods: { enabled: true },
    metadata: {
      payMethod: payMethod || 'card',
      orderId:   orderId   || '',
    },
    description: `Order — ${payMethod || 'card'}`,
  };

  if (customerEmail) intentParams.receipt_email = customerEmail;

  const intent = await stripe().paymentIntents.create(intentParams);
  return {
    clientSecret:    intent.client_secret,
    paymentIntentId: intent.id,
  };
};

// ─── Retrieve PaymentIntent (optionally expand payment_method) ────────────────
const retrievePaymentIntent = async (paymentIntentId, { expand = false } = {}) => {
  const params = expand ? { expand: ['payment_method'] } : {};
  return stripe().paymentIntents.retrieve(paymentIntentId, params);
};

// ─── Retrieve PaymentMethod with full card details ────────────────────────────
/**
 * Retrieve a Stripe PaymentMethod by ID.
 * This is what gives us last4, exp_month, exp_year, brand.
 *
 * @param {string} paymentMethodId  — pm_xxx string from confirmPayment result
 * @returns {Promise<import('stripe').Stripe.PaymentMethod>}
 */
const retrievePaymentMethod = async (paymentMethodId) => {
  return stripe().paymentMethods.retrieve(paymentMethodId);
};

// ─── Construct webhook event ──────────────────────────────────────────────────
const constructWebhookEvent = (rawBody, signature) => {
  if (!STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET.startsWith('whsec_YOUR')) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  return stripe().webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
};

module.exports = {
  createPaymentIntent,
  retrievePaymentIntent,
  retrievePaymentMethod,
  extractCardDetails,
  normaliseBrand,
  constructWebhookEvent,
  CURRENCY,
};
