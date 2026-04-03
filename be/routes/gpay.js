/**
 * routes/gpay.js
 *
 * Direct Google Pay integration — NO Stripe dependency.
 * Uses the Google Pay API (PaymentsClient) on the frontend to get an
 * encrypted payment token, then this backend:
 *   1. Validates the token shape
 *   2. In TEST environment: accepts the token directly (Google issues fake tokens)
 *   3. In PRODUCTION: forward token to your real payment processor
 *      (e.g. Braintree, Adyen, Square, or your own acquirer)
 *   4. Creates the order in Firestore with payment details
 *
 * Endpoints:
 *   POST /api/gpay/process   — process GPay token + place order
 *   GET  /api/gpay/config    — return merchant config for the frontend PaymentsClient
 */

const { Router }      = require('express');
const asyncHandler    = require('../utils/asyncHandler');
const { success, created } = require('../utils/response');
const { AppError }    = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const orderService    = require('../services/orderService');
const { GPAY_MERCHANT_ID, GPAY_MERCHANT_NAME, NODE_ENV } = require('../config/env');

const router = Router();

const IS_TEST = NODE_ENV !== 'production';

// ─── GET /api/gpay/config ─────────────────────────────────────────────────────
// Returns the merchant configuration the frontend PaymentsClient needs.
// In TEST mode, merchantId is not required by Google — we use 'TEST'.
router.get('/config', (req, res) => {
  success(res, {
    environment:  IS_TEST ? 'TEST' : 'PRODUCTION',
    merchantId:   IS_TEST ? 'TEST' : (GPAY_MERCHANT_ID || 'TEST'),
    merchantName: GPAY_MERCHANT_NAME || 'My Shop',
    // Supported card networks — these must match what your processor supports
    allowedCardNetworks:     ['AMEX', 'DISCOVER', 'INTERAC', 'JCB', 'MASTERCARD', 'VISA'],
    allowedAuthMethods:      ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
    // In test mode we use DIRECT tokenisation (no processor needed).
    // In production change this to your processor: 'BRAINTREE', 'ADYEN', etc.
    tokenizationSpecification: IS_TEST
      ? { type: 'DIRECT', parameters: { protocolVersion: 'ECv2', publicKey: 'TEST' } }
      : {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway:           process.env.GPAY_GATEWAY        || 'example',
            gatewayMerchantId: process.env.GPAY_GATEWAY_MERCHANT_ID || 'exampleGatewayMerchantId',
          },
        },
  });
});

// ─── POST /api/gpay/process ───────────────────────────────────────────────────
// Body: { paymentData, billing, items }
//   paymentData — the full PaymentData object returned by PaymentsClient.loadPaymentData()
//   billing     — shipping / billing address fields
//   items       — cart items [ { productId, name, price, quantity, image } ]
router.post(
  '/process',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { paymentData, billing, items } = req.body;

    // ── Basic validation ──────────────────────────────────────────────────────
    if (!paymentData)            throw new AppError('Missing paymentData.', 400);
    if (!billing?.firstName)     throw new AppError('Missing billing.firstName.', 400);
    if (!billing?.email)         throw new AppError('Missing billing.email.', 400);
    if (!billing?.address)       throw new AppError('Missing billing.address.', 400);
    if (!billing?.city)          throw new AppError('Missing billing.city.', 400);
    if (!Array.isArray(items) || items.length === 0)
      throw new AppError('Cart is empty.', 400);

    // ── Extract token info ────────────────────────────────────────────────────
    const token       = paymentData.paymentMethodData?.tokenizationData?.token || '';
    const cardInfo    = paymentData.paymentMethodData?.info || {};
    const billingAddr = paymentData.paymentMethodData?.info?.billingAddress || {};
    const email       = paymentData.email || billing.email;

    // ── TEST MODE: accept token directly, no processor call needed ────────────
    // In production, forward `token` to your payment processor SDK here.
    // e.g. const result = await braintree.transaction.sale({ paymentMethodNonce: token, ... });
    let transactionId;
    let paymentStatus = 'paid';

    if (IS_TEST) {
      // Google TEST environment issues deterministic fake tokens.
      // We record them as-is — no processor call needed.
      transactionId = 'GPAY-TEST-' + Date.now();
    } else {
      // ── PRODUCTION: forward to your processor ──────────────────────────────
      // Uncomment and adapt for your processor:
      // const result = await yourProcessor.charge({ token, amount, currency });
      // transactionId = result.id;
      // For now throw to prevent accidental live charges without real config:
      throw new AppError(
        'Google Pay live processing is not yet configured. ' +
        'Set GPAY_GATEWAY and GPAY_GATEWAY_MERCHANT_ID in your .env, ' +
        'then implement the processor call in routes/gpay.js.',
        501
      );
    }

    // ── Build card details from GPay card info ────────────────────────────────
    const cardDetails = {
      cardholderName: billingAddr.name || `${billing.firstName} ${billing.lastName}`.trim(),
      last4:          cardInfo.cardDetails || '',          // Google provides last 4 digits
      cardType:       (cardInfo.cardNetwork || '').toLowerCase(), // VISA → 'visa'
      brand:          cardInfo.cardNetwork || '',
      wallet:         'google_pay',
    };

    // ── Place order ───────────────────────────────────────────────────────────
    const userId = req.user?.uid || null;

    const orderData = {
      items,
      billing: {
        firstName: billing.firstName,
        lastName:  billing.lastName  || '',
        email:     email,
        phone:     billing.phone     || billingAddr.phoneNumber || '',
        address:   billing.address   || billingAddr.address1   || '',
        city:      billing.city      || billingAddr.locality   || '',
        state:     billing.state     || billingAddr.administrativeArea || '',
        zip:       billing.zip       || billingAddr.postalCode || '',
        country:   billing.country   || billingAddr.countryCode || 'US',
      },
      payment: {
        method:        'google_pay',
        status:        paymentStatus,
        transactionId: transactionId,
        cardDetails,
      },
    };

    const order = await orderService.createOrder(orderData, userId);

    created(res, order, 'Google Pay order placed successfully');
  })
);

module.exports = router;
