/**
 * utils/mailer.js
 *
 * Reads SMTP credentials from the settings DB at runtime.
 * Falls back to .env variables if DB settings are not configured.
 *
 * DB fields used (saved via admin Settings → Email tab):
 *   smtpHost, smtpPort, smtpUser, smtpPass, mailFromName, mailFromEmail
 *
 * .env fallback (optional — only used if DB settings are empty):
 *   MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, MAIL_FROM
 */

const nodemailer       = require('nodemailer');
const settingsService  = require('../services/settingsService');

/**
 * Build a transporter using DB settings, falling back to .env.
 * Called fresh on every sendMail() so config changes take effect immediately.
 */
const createTransporter = async () => {
  // Load live settings from DB
  let dbSettings = {};
  try {
    dbSettings = await settingsService.getSettings();
  } catch (_) {
    // If DB unavailable, fall through to .env
  }

  const host = dbSettings.smtpHost     || process.env.MAIL_HOST || '';
  const port = dbSettings.smtpPort     || parseInt(process.env.MAIL_PORT || '587');
  const user = dbSettings.smtpUser     || process.env.MAIL_USER || '';
  const pass = dbSettings.smtpPass     || process.env.MAIL_PASS || '';

  if (!host || !user || !pass) {
    throw new Error(
      'Mail not configured. Please set SMTP credentials in Admin → Settings → Email.'
    );
  }

  return nodemailer.createTransport({
    host,
    port:   Number(port),
    secure: Number(port) === 465,
    auth:   { user, pass },
  });
};

/**
 * Resolve the "From" address using DB settings, falling back to .env.
 */
const getFromAddress = async () => {
  let dbSettings = {};
  try {
    dbSettings = await settingsService.getSettings();
  } catch (_) {}

  const name  = dbSettings.mailFromName  || process.env.MAIL_FROM_NAME || 'Vegefoods';
  const email = dbSettings.mailFromEmail || dbSettings.smtpUser || process.env.MAIL_USER || '';
  return email ? `${name} <${email}>` : name;
};

/**
 * Send an email.
 * @param {{ to: string|string[], subject: string, html: string, text?: string }} opts
 */
const sendMail = async ({ to, subject, html, text }) => {
  const transporter = await createTransporter();
  const from        = await getFromAddress();

  const info = await transporter.sendMail({
    from,
    to:      Array.isArray(to) ? to.join(', ') : to,
    subject,
    html,
    text:    text || html.replace(/<[^>]*>/g, ''),
  });

  return info;
};

/**
 * Build a branded HTML email template.
 * @param {{ subject: string, body: string, unsubscribeEmail?: string }} opts
 */
const buildEmailTemplate = ({ subject, body, unsubscribeEmail = '' }) => `
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
                You are receiving this email because you subscribed to Vegefoods newsletters.<br/>
                ${unsubscribeEmail
                  ? `<a href="mailto:unsubscribe@vegefoods.com?subject=Unsubscribe&body=${unsubscribeEmail}"
                       style="color:#4caf50;text-decoration:none;">Unsubscribe</a>`
                  : ''}
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

module.exports = { sendMail, buildEmailTemplate };
