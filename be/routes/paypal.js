/**
 * routes/paypal.js
 *
 * Native PayPal REST API integration — completely independent of Stripe.
 *
 * POST /api/paypal/create-order   → create a PayPal order, return { id }
 * POST /api/paypal/capture-order  → capture an approved order, return details
 * POST /api/paypal/webhook        → PayPal webhook (optional, for server-side confirm)
 *
 * Env vars required:
 *   PAYPAL_CLIENT_ID      – from developer.paypal.com
 *   PAYPAL_CLIENT_SECRET  – from developer.paypal.com
 *   PAYPAL_MODE           – "sandbox" | "live"  (default: "sandbox")
 */

const { Router } = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { AppError } = require("../middleware/errorHandler");
const { optionalAuth } = require("../middleware/auth");
const orderService = require("../services/orderService");

const router = Router();

// ─── PayPal base URL ──────────────────────────────────────────────────────────
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const BASE_URL =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

// ─── Get access token from PayPal ─────────────────────────────────────────────
async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new AppError("PayPal credentials are not configured.", 500);
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new AppError(`PayPal auth failed: ${err}`, 502);
  }

  const data = await res.json();
  return data.access_token;
}

// ─── POST /api/paypal/create-order ───────────────────────────────────────────
/**
 * Body: { amount: number, currency?: string, orderId?: string }
 * Returns: { id: string }  ← PayPal order ID to pass to the SDK
 */
router.post(
  "/create-order",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { amount, currency = "USD", orderId } = req.body;

    if (!amount || Number(amount) <= 0) {
      throw new AppError("Invalid amount.", 400);
    }

    const token = await getAccessToken();

    // NOTE: Do NOT include payment_source here — that's for server-side redirect
    // flows only. When using @paypal/react-paypal-js SDK (client-side buttons),
    // the SDK manages the UX/redirect flow itself. Including payment_source causes
    // PayPal to return UNPROCESSABLE_ENTITY for SDK-based integrations.
    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency.toUpperCase(),
            value: Number(amount).toFixed(2),
          },
          ...(orderId && { custom_id: String(orderId) }),
        },
      ],
    };

    const ppRes = await fetch(`${BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `vegefoods-${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!ppRes.ok) {
      const err = await ppRes.json().catch(() => ({}));
      throw new AppError(
        err?.message || "Failed to create PayPal order.",
        ppRes.status,
      );
    }

    const order = await ppRes.json();
    success(res, { id: order.id });
  }),
);

// ─── POST /api/paypal/capture-order ──────────────────────────────────────────
/**
 * Body: { paypalOrderId: string, appOrderId?: string }
 * Returns: { paypalOrderId, payerEmail, payerName, status, amount, currency }
 */
router.post(
  "/capture-order",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { paypalOrderId, appOrderId } = req.body;

    if (!paypalOrderId) throw new AppError("paypalOrderId is required.", 400);

    const token = await getAccessToken();

    const ppRes = await fetch(
      `${BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!ppRes.ok) {
      const err = await ppRes.json().catch(() => ({}));
      throw new AppError(
        err?.message || "Failed to capture PayPal order.",
        ppRes.status,
      );
    }

    const captured = await ppRes.json();
    const payer = captured.payer || {};
    const unit = (captured.purchase_units || [])[0] || {};
    const capture = (unit.payments?.captures || [])[0] || {};

    // Update the app order to paid (if appOrderId provided)
    if (appOrderId) {
      try {
        await orderService.updatePaymentStatus(appOrderId, {
          paymentStatus: "paid",
          transactionId: capture.id || paypalOrderId,
          note: "PayPal payment captured",
        });
      } catch (e) {
        console.error("[paypal] updatePaymentStatus failed:", e.message);
      }
    }

    success(res, {
      paypalOrderId: captured.id,
      captureId: capture.id,
      status: captured.status,
      payerEmail: payer.email_address || "",
      payerName:
        `${payer.name?.given_name || ""} ${payer.name?.surname || ""}`.trim(),
      amount: capture.amount?.value || "",
      currency: capture.amount?.currency_code || "USD",
    });
  }),
);

// ─── POST /api/paypal/webhook ─────────────────────────────────────────────────
// Optional: receives PAYMENT.CAPTURE.COMPLETED events from PayPal webhooks.
// To enable: set up webhook at developer.paypal.com pointing here.
router.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const event = req.body;
    const eventType = event?.event_type;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event.resource || {};
      const customId = event.resource?.purchase_units?.[0]?.custom_id || "";

      if (customId) {
        try {
          await orderService.updatePaymentStatus(customId, {
            paymentStatus: "paid",
            transactionId: resource.id,
            note: "PayPal webhook: PAYMENT.CAPTURE.COMPLETED",
          });
        } catch (e) {
          console.error(
            "[paypal webhook] order update failed:",
            customId,
            e.message,
          );
        }
      }
    }

    res.json({ received: true });
  }),
);

module.exports = router;
