/**
 * cron/orderStatusAutomation.js
 *
 * Automated Order Status Pipeline — runs every 5 hours
 *
 * Flow:
 *   pending     → processing   (after 5 hours of being pending)
 *   processing  → shipped      (after 5 hours of being in processing)
 *   shipped     → delivered    (after 1 hour of being shipped)
 *   delivered   → complete     (after 1 hour of being delivered)
 *
 * How timing works:
 *   Each time a status changes, `statusUpdatedAt` is saved.
 *   On every cron run, we check how long the order has been in its current
 *   status and advance it if the required time has passed.
 */

const cron = require("node-cron");
const { db, FieldValue } = require("../config/firebase");
const { sendMail, buildEmailTemplate } = require("../utils/mailer");

const COL = "orders";

// ── Time thresholds (in milliseconds) ────────────────────────────────────────
const HOURS = (h) => h * 60 * 60 * 1000;

const TRANSITIONS = [
  {
    from: "pending",
    to: "processing",
    afterMs: HOURS(5),
    note: "Order moved to processing",
    emailSubject: (o) =>
      `🔄 Your order ${o.orderNumber} is now being processed`,
    emailBody: (o) =>
      buildStatusEmailBody(
        o,
        "processing",
        "We're now preparing your order for shipment.",
      ),
  },
  {
    from: "processing",
    to: "shipped",
    afterMs: HOURS(5),
    note: "Order shipped",
    emailSubject: (o) => `🚚 Your order ${o.orderNumber} has been shipped!`,
    emailBody: (o) =>
      buildStatusEmailBody(
        o,
        "shipped",
        "Great news! Your order is on its way to you.",
      ),
  },
  {
    from: "shipped",
    to: "delivered",
    afterMs: HOURS(1),
    note: "Order marked as delivered",
    emailSubject: (o) => `📦 Your order ${o.orderNumber} has been delivered!`,
    emailBody: (o) =>
      buildStatusEmailBody(
        o,
        "delivered",
        "Your order has been delivered. We hope you enjoy it!",
      ),
  },
  {
    from: "delivered",
    to: "complete",
    afterMs: HOURS(1),
    note: "Order completed",
    emailSubject: (o) => `✅ Your order ${o.orderNumber} is complete`,
    emailBody: (o) =>
      buildStatusEmailBody(
        o,
        "complete",
        "Thank you for shopping with us! Your order is now complete.",
      ),
  },
];

// ── Status badge colors for email ────────────────────────────────────────────
const STATUS_COLORS = {
  processing: "#f59e0b",
  shipped: "#3b82f6",
  delivered: "#10b981",
  complete: "#82ae46",
};

const STATUS_ICONS = {
  processing: "🔄",
  shipped: "🚚",
  delivered: "📦",
  complete: "✅",
};

// ── Build status update email body ───────────────────────────────────────────
const buildStatusEmailBody = (order, newStatus, message) => {
  const color = STATUS_COLORS[newStatus] || "#82ae46";
  const icon = STATUS_ICONS[newStatus] || "📋";
  const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

  const itemRows = (order.items || [])
    .slice(0, 4)
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
          <div style="display:flex;align-items:center;gap:12px;">
            ${
              item.image
                ? `<img src="${item.image.startsWith("http") ? item.image : clientUrl + item.image}"
                   width="52" height="52"
                   style="object-fit:cover;border-radius:6px;flex-shrink:0;" />`
                : ""
            }
            <div>
              <div style="font-weight:600;color:#1a1a1a;font-size:14px;">${item.name}</div>
              <div style="color:#666;font-size:13px;">Qty: ${item.quantity} · $${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");

  return `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${color};color:#fff;
                  padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;">
        ${icon} ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
      </div>
    </div>

    <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;font-weight:700;text-align:center;">
      Order Update — ${order.orderNumber}
    </h2>

    <p style="text-align:center;font-size:15px;color:#555;margin:0 0 28px;">
      ${message}
    </p>

    ${
      order.trackingCode
        ? `<div style="background:#f8fdf8;border:1px solid #e0f2e0;border-radius:10px;
                       padding:14px 20px;text-align:center;margin-bottom:24px;">
             <div style="font-size:12px;color:#666;margin-bottom:4px;">Tracking Code</div>
             <div style="font-size:18px;font-weight:700;color:#1a1a1a;letter-spacing:1px;">
               ${order.trackingCode}
             </div>
           </div>`
        : ""
    }

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${itemRows}
    </table>

    ${order.items?.length > 4 ? `<p style="text-align:center;font-size:13px;color:#888;margin-bottom:24px;">+ ${order.items.length - 4} more item(s)</p>` : ""}

    <div style="background:#f8f9fa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <table width="100%" cellpadding="4">
        <tr>
          <td style="font-size:13px;color:#666;">Order Total</td>
          <td style="font-size:14px;font-weight:700;color:#1a1a1a;text-align:right;">$${(order.total || 0).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#666;">Payment</td>
          <td style="font-size:13px;color:#555;text-align:right;">${order.paymentMethodLabel || order.paymentMethod || "—"}</td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;">
      <a href="${clientUrl}/orders/${order.id}"
         style="display:inline-block;background:#82ae46;color:#ffffff;padding:13px 36px;
                border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
        View Order Details →
      </a>
    </div>

    <p style="font-size:12px;color:#aaa;text-align:center;margin-top:24px;">
      This is an automated update from Vegefoods.<br/>
      Order placed on ${new Date(order.createdAt?.toMillis ? order.createdAt.toMillis() : order.createdAt).toLocaleDateString()}.
    </p>
  `;
};

// ── Send status email to customer ────────────────────────────────────────────
const sendStatusEmail = async (order, transition) => {
  try {
    const to = order.userEmail || order.address?.email || order.billing?.email;
    if (!to) {
      console.log(
        `[cron:orderStatus] No email found for order ${order.orderNumber} — skipping email`,
      );
      return;
    }

    const subject = transition.emailSubject(order);
    const body = transition.emailBody(order);
    const html = buildEmailTemplate({ subject, body });

    await sendMail({ to, subject, html });
    console.log(
      `[cron:orderStatus] 📧 Email sent to ${to} for order ${order.orderNumber} → ${transition.to}`,
    );
  } catch (err) {
    // Never let email crash the cron
    console.error(
      `[cron:orderStatus] Email failed for order ${order.orderNumber}:`,
      err.message,
    );
  }
};

// ── Advance a single order to next status ────────────────────────────────────
const advanceOrder = async (order, transition) => {
  const orderRef = db.collection(COL).doc(order.id);
  const now = new Date().toISOString();

  const history = [
    ...(order.statusHistory || []),
    {
      status: transition.to,
      note: transition.note,
      timestamp: now,
      automated: true,
    },
  ];

  await orderRef.update({
    status: transition.to,
    statusHistory: history,
    statusUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(
    `[cron:orderStatus] ✅ Order ${order.orderNumber}: ${transition.from} → ${transition.to}`,
  );

  // Send customer email (non-blocking)
  setImmediate(() => sendStatusEmail(order, transition));
};

// ── Main cron logic ───────────────────────────────────────────────────────────
const runOrderStatusAutomation = async () => {
  console.log("[cron:orderStatus] 🔄 Starting order status automation run...");
  const now = Date.now();
  let advanced = 0;

  try {
    // Fetch all active orders (not cancelled / complete)
    const activeStatuses = ["pending", "processing", "shipped", "delivered"];
    const snap = await db
      .collection(COL)
      .where("status", "in", activeStatuses)
      .get();

    if (snap.empty) {
      console.log("[cron:orderStatus] ✅ No active orders to process.");
      return;
    }

    console.log(`[cron:orderStatus] Found ${snap.size} active order(s)`);

    for (const doc of snap.docs) {
      const order = { id: doc.id, ...doc.data() };

      // Find the matching transition rule for this order's current status
      const transition = TRANSITIONS.find((t) => t.from === order.status);
      if (!transition) continue;

      // Determine when the order entered its current status.
      // We use statusUpdatedAt if set (set by this cron), otherwise createdAt
      // for the very first transition (pending → processing).
      let statusSince;

      if (order.statusUpdatedAt) {
        // Firestore Timestamp → ms
        statusSince = order.statusUpdatedAt.toMillis
          ? order.statusUpdatedAt.toMillis()
          : new Date(order.statusUpdatedAt).getTime();
      } else {
        // Fall back to createdAt for orders not yet touched by the cron
        statusSince = order.createdAt?.toMillis
          ? order.createdAt.toMillis()
          : new Date(order.createdAt || 0).getTime();
      }

      const elapsed = now - statusSince;

      if (elapsed >= transition.afterMs) {
        try {
          await advanceOrder(order, transition);
          advanced++;
        } catch (err) {
          console.error(
            `[cron:orderStatus] ❌ Failed to advance order ${order.orderNumber}:`,
            err.message,
          );
        }
      } else {
        const remainingMins = Math.ceil((transition.afterMs - elapsed) / 60000);
        console.log(
          `[cron:orderStatus] ⏳ Order ${order.orderNumber} (${order.status}) — ${remainingMins} min(s) remaining`,
        );
      }
    }

    console.log(
      `[cron:orderStatus] ✅ Done. Advanced ${advanced} order(s) this run.`,
    );
  } catch (err) {
    console.error("[cron:orderStatus] ❌ Fatal error:", err);
  }
};

// ── Register cron schedule ────────────────────────────────────────────────────
const startOrderStatusAutomationCron = () => {
  // Runs every 5 hours  →  0 */5 * * *
  cron.schedule(
    "0 */5 * * *",
    async () => {
      await runOrderStatusAutomation();
    },
    {
      scheduled: true,
      timezone: "UTC",
    },
  );

  console.log("[cron:orderStatus] 🕐 Scheduled — fires every 5 hours (UTC)");

  // Optional: run immediately on server start for testing
  if (process.env.RUN_CRON_ON_START === "true") {
    console.log(
      "[cron:orderStatus] RUN_CRON_ON_START=true — running immediately for test...",
    );
    runOrderStatusAutomation();
  }
};

module.exports = { startOrderStatusAutomationCron, runOrderStatusAutomation };
