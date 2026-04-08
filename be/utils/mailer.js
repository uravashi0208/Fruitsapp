/**
 * utils/mailer.js
 *
 * Reads SMTP credentials from the settings DB at runtime.
 * Falls back to .env variables if DB settings are not configured.
 *
 * DB fields used (saved via admin Settings → Email tab):
 *   smtpHost, smtpPort, smtpUser, smtpPass, mailFromName, mailFromEmail
 *
 * .env fallback:
 *   MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM_NAME
 *
 * Common SMTP settings:
 *   Gmail:     host=smtp.gmail.com   port=465  (SSL) or 587 (TLS/STARTTLS)
 *   Outlook:   host=smtp.office365.com  port=587
 *   SendGrid:  host=smtp.sendgrid.net   port=587
 *
 * Gmail note: You MUST use an App Password, not your account password.
 *   https://myaccount.google.com/apppasswords
 */

const nodemailer = require("nodemailer");
const settingsService = require("../services/settingsService");

/**
 * Load SMTP config from DB (live) with .env fallback.
 */
const loadSmtpConfig = async () => {
  let dbSettings = {};
  try {
    dbSettings = await settingsService.getSettings();
  } catch (_) {
    // DB unavailable — fall through to .env
  }

  return {
    host: dbSettings.smtpHost || process.env.MAIL_HOST || "",
    port: Number(dbSettings.smtpPort || process.env.MAIL_PORT || 587),
    user: dbSettings.smtpUser || process.env.MAIL_USER || "",
    pass: dbSettings.smtpPass || process.env.MAIL_PASS || "",
    fromName:
      dbSettings.mailFromName || process.env.MAIL_FROM_NAME || "Vegefoods",
    fromEmail:
      dbSettings.mailFromEmail ||
      dbSettings.smtpUser ||
      process.env.MAIL_USER ||
      "",
  };
};

/**
 * Build a nodemailer transporter with correct TLS settings.
 *
 * Port 465  → secure: true  (implicit SSL — connect encrypted)
 * Port 587  → secure: false + requireTLS: true  (STARTTLS upgrade)
 * Port 25   → secure: false (plain, avoid in production)
 */
const createTransporter = async () => {
  const cfg = await loadSmtpConfig();

  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error(
      "SMTP not configured. Set MAIL_HOST, MAIL_USER, MAIL_PASS in .env " +
        "or Admin → Settings → Email.",
    );
  }

  const use465 = cfg.port === 465;

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: use465, // true = implicit TLS (port 465)
    auth: { user: cfg.user, pass: cfg.pass },

    // STARTTLS for port 587 / 2525
    requireTLS: !use465,

    // Timeouts — prevent hanging forever on bad SMTP config
    connectionTimeout: 10_000, // 10 s to establish TCP connection
    greetingTimeout: 10_000, // 10 s for server greeting (220 banner)
    socketTimeout: 15_000, // 15 s of socket inactivity

    tls: {
      // Allow self-signed certs in dev; in prod set to true
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return { transporter, cfg };
};

/**
 * Send an email.
 * @param {{ to: string|string[], subject: string, html: string, text?: string }} opts
 */
const sendMail = async ({ to, subject, html, text }) => {
  const { transporter, cfg } = await createTransporter();

  const from = cfg.fromEmail
    ? `${cfg.fromName} <${cfg.fromEmail}>`
    : cfg.fromName;

  const info = await transporter.sendMail({
    from,
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    text: text || (html ? html.replace(/<[^>]*>/g, "") : ""),
  });

  return info;
};

/**
 * Test SMTP connection — call this from a health-check or admin panel.
 * Returns { ok: true } or { ok: false, error: string }
 */
const verifySmtp = async () => {
  try {
    const { transporter, cfg } = await createTransporter();
    await transporter.verify();
    return { ok: true, host: cfg.host, port: cfg.port, user: cfg.user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
};

/**
 * Branded HTML email template.
 * @param {{ subject: string, body: string, unsubscribeEmail?: string }} opts
 */
const buildEmailTemplate = ({ subject, body, unsubscribeEmail = "" }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4caf50,#82ae46);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">🥦 Vegefoods</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:1px;text-transform:uppercase;">Fresh &amp; Organic</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${body}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e8f5e9;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9e9e9e;line-height:1.6;">
                You are receiving this email because you are subscribed to Vegefoods.<br/>
                ${
                  unsubscribeEmail
                    ? `<a href="mailto:unsubscribe@vegefoods.com?subject=Unsubscribe&body=${unsubscribeEmail}"
                       style="color:#4caf50;text-decoration:none;">Unsubscribe</a>`
                    : ""
                }
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#bdbdbd;">
                © ${new Date().getFullYear()} Vegefoods. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = { sendMail, buildEmailTemplate, verifySmtp };
