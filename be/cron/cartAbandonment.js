/**
 * cron/cartAbandonment.js
 *
 * Cron job: runs every 2 hours.
 *
 * What it does:
 *   1. Finds users who have items in their cart (stored in 'carts' collection)
 *      AND haven't placed an order in the last 2 hours
 *      AND haven't been emailed about this cart yet (abandonment email sent flag)
 *   2. Sends a "You left something behind!" recovery email
 *   3. Marks the cart as notified so we don't spam
 *
 * Cart document shape (written by FE or on order creation):
 *   { userId, userEmail, userName, items: [...], updatedAt, emailSent: false }
 *
 * To integrate FE: call POST /api/carts/sync (added in routes/carts-sync.js)
 *   every time cart changes in Redux — stores cart in Firestore so cron can see it.
 *
 * Dependencies: node-cron (already in package.json)
 */

const cron = require("node-cron");
const { db, FieldValue } = require("../config/firebase");
const { sendMail, buildEmailTemplate } = require("../utils/mailer");

const BATCH_SIZE = 50;
const ABANDON_HOURS = 2; // hours after last cart update before email fires
const COL = "carts";

// ── Build the recovery email HTML ─────────────────────────────────────────────
const buildAbandonmentBody = (userName, items, cartTotal) => {
  const itemRows = (items || [])
    .slice(0, 5)
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${
            item.image
              ? `<img src="${item.image.startsWith("http") ? item.image : (process.env.CLIENT_URL || "http://localhost:3000") + item.image}"
            width="56" height="56" style="object-fit:cover;border-radius:6px;flex-shrink:0;" />`
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
    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;font-weight:700;text-align:center;">
      🛒 You left something behind, ${userName || "friend"}!
    </h2>

    <p style="text-align:center;font-size:15px;color:#555;margin:0 0 28px;">
      Your cart is waiting. Come back before your favourites sell out!
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${itemRows}
    </table>

    ${items.length > 5 ? `<p style="text-align:center;font-size:13px;color:#888;margin-bottom:24px;">+ ${items.length - 5} more item(s) in your cart</p>` : ""}

    <div style="background:#f8fdf8;border:1px solid #e0f2e0;border-radius:10px;padding:16px 24px;text-align:center;margin-bottom:28px;">
      <div style="font-size:13px;color:#666;margin-bottom:4px;">Your cart total</div>
      <div style="font-size:28px;font-weight:700;color:#4caf50;">$${cartTotal.toFixed(2)}</div>
    </div>

    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.CLIENT_URL || "http://localhost:3000"}/cart"
         style="display:inline-block;background:#4caf50;color:#ffffff;padding:14px 40px;
                border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
        Complete My Order →
      </a>
    </div>

    <p style="font-size:12px;color:#999;text-align:center;margin-top:24px;">
      If you no longer want these items, you can simply ignore this email.
    </p>
  `;
};

// ── Core task ─────────────────────────────────────────────────────────────────
const runCartAbandonment = async () => {
  const now = new Date();
  const threshold = new Date(now.getTime() - ABANDON_HOURS * 60 * 60 * 1000);

  try {
    // 1. Find abandoned carts — updated before threshold, emailSent == false, has items
    const snap = await db.collection(COL).where("emailSent", "==", false).get();

    const abandoned = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((cart) => {
        if (!cart.userEmail) return false;
        if (!cart.items || cart.items.length === 0) return false;
        const updatedAt = cart.updatedAt?.toMillis
          ? new Date(cart.updatedAt.toMillis())
          : new Date(cart.updatedAt || 0);
        return updatedAt < threshold;
      });

    if (abandoned.length === 0) {
      console.log("[cron:cartAbandonment] ✅ No abandoned carts. Done.");
      return;
    }

    console.log(
      `[cron:cartAbandonment] Found ${abandoned.length} abandoned cart(s)`,
    );

    // 2. Send recovery email to each user
    for (const cart of abandoned) {
      const cartTotal = (cart.items || []).reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const subject = `🛒 Your cart is waiting, ${cart.userName || "friend"}!`;
      const html = buildEmailTemplate({
        subject,
        body: buildAbandonmentBody(cart.userName, cart.items, cartTotal),
      });

      try {
        await sendMail({ to: cart.userEmail, subject, html });
        console.log(`[cron:cartAbandonment] Sent to ${cart.userEmail}`);

        // Mark as notified
        await db.collection(COL).doc(cart.id).update({
          emailSent: true,
          emailSentAt: FieldValue.serverTimestamp(),
        });
      } catch (err) {
        console.error(
          `[cron:cartAbandonment] Failed for ${cart.userEmail}:`,
          err.message,
        );
      }
    }

    console.log("[cron:cartAbandonment] ✅ Done.");
  } catch (err) {
    console.error("[cron:cartAbandonment] ❌ Fatal error:", err);
  }
};

// ── Start ─────────────────────────────────────────────────────────────────────
const startCartAbandonmentCron = () => {
  // Every 2 hours
  cron.schedule(
    "0 */2 * * *",
    async () => {
      await runCartAbandonment();
    },
    {
      scheduled: true,
      timezone: "UTC",
    },
  );

  console.log(
    "[cron:cartAbandonment] 🕐 Scheduled — fires every 2 hours (UTC)",
  );

  if (process.env.RUN_CRON_ON_START === "true") {
    console.log(
      "[cron:cartAbandonment] RUN_CRON_ON_START=true — running now for test...",
    );
    runCartAbandonment();
  }
};

module.exports = { startCartAbandonmentCron, runCartAbandonment };
