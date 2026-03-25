/**
 * routes/settings.js
 *
 * PUBLIC:  GET /api/settings           (read-only for frontend)
 * ADMIN:
 *   GET    /api/admin/settings
 *   PATCH  /api/admin/settings         (multipart: logo, favicon)
 */
const { Router }      = require('express');
const settingsService = require('../services/settingsService');
const asyncHandler    = require('../utils/asyncHandler');
const { success }     = require('../utils/response');
const { authenticate, requireAdmin }  = require('../middleware/auth');
const { upload, uploadToFirebase }    = require('../utils/upload');
const { settingsSchema, validate }    = require('../validations/schemas');

const publicRouter = Router();
publicRouter.get('/', asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  // Strip internal fields before sending to public
  const { updatedAt, ...pub } = settings;
  success(res, pub);
}));

const adminRouter = Router();
adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/', asyncHandler(async (req, res) => {
  success(res, await settingsService.getSettings());
}));

adminRouter.patch(
  '/',
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'favicon', maxCount: 1 }]),
  asyncHandler(async (req, res) => {
    const data         = validate(settingsSchema, req.body);
    let newLogoUrl     = null;
    let newFaviconUrl  = null;

    if (req.files?.logo?.[0]) {
      const f = req.files.logo[0];
      newLogoUrl = await uploadToFirebase(f.buffer, f.originalname, f.mimetype, 'settings');
    }
    if (req.files?.favicon?.[0]) {
      const f = req.files.favicon[0];
      newFaviconUrl = await uploadToFirebase(f.buffer, f.originalname, f.mimetype, 'settings');
    }

    const settings = await settingsService.updateSettings(data, newLogoUrl, newFaviconUrl);
    success(res, settings, 'Settings updated');
  })
);

// Test email connection with current settings
adminRouter.post('/test-email', asyncHandler(async (req, res) => {
  const { sendMail, buildEmailTemplate } = require('../utils/mailer');
  const settings = await settingsService.getSettings();
  const to = settings.email || req.body.to;
  if (!to) return res.status(422).json({ success: false, message: 'No recipient email configured. Set Support Email in Store Info first.' });

  const html = buildEmailTemplate({
    subject: 'Test Email — Vegefoods Settings',
    body: `
      <h2 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;">✅ SMTP Configuration Works!</h2>
      <p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 16px;">
        Your email settings are configured correctly. Emails sent from Vegefoods will use these SMTP credentials.
      </p>
      <div style="background:#f9fdf3;border:1px solid #d4edbb;border-radius:8px;padding:16px 20px;margin:0 0 16px;">
        <p style="margin:0;font-size:13px;color:#555;">Sent via: <strong>${settings.smtpHost || 'env config'}:${settings.smtpPort || 587}</strong></p>
        <p style="margin:4px 0 0;font-size:13px;color:#555;">From: <strong>${settings.mailFromName || 'Vegefoods'}</strong></p>
      </div>
    `,
  });

  await sendMail({ to, subject: 'Test Email — Vegefoods Settings', html });
  success(res, null, `Test email sent to ${to}`);
}));

module.exports = { publicRouter, adminRouter };
