/**
 * routes/newsletter.js
 *
 * PUBLIC:
 *   POST   /api/newsletter              subscribe (+ sends welcome email)
 *   POST   /api/newsletter/unsubscribe  unsubscribe by email
 *
 * ADMIN:
 *   GET    /api/admin/newsletter        list subscribers (paginated)
 *   DELETE /api/admin/newsletter/:id    delete subscriber
 *   POST   /api/admin/newsletter/send   send email campaign to all active subscribers
 */
const { Router }          = require('express');
const newsletterService   = require('../services/newsletterService');
const asyncHandler        = require('../utils/asyncHandler');
const { success, created, paginated, noContent } = require('../utils/response');
const { authenticate, requireEditor }            = require('../middleware/auth');
const { newsletterSchema, paginationSchema, validate } = require('../validations/schemas');
const { sendMail, buildEmailTemplate }           = require('../utils/mailer');

const publicRouter = Router();

// ── Subscribe (public) ────────────────────────────────────────
publicRouter.post('/', asyncHandler(async (req, res) => {
  const data   = validate(newsletterSchema, req.body);
  const result = await newsletterService.subscribe(data);

  // Send welcome email (non-blocking — don't fail the subscription if mail fails)
  try {
    const html = buildEmailTemplate({
      subject: '🌿 Welcome to Vegefoods Newsletter!',
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;font-weight:700;">
          Welcome to the Vegefoods Family! 🥦
        </h2>
        <p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 16px;">
          Hi <strong>${data.name || data.email.split('@')[0]}</strong>,
        </p>
        <p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 16px;">
          Thank you for subscribing to our newsletter! You're now part of our fresh &amp; organic community.
        </p>
        <p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 24px;">
          Here's what you can expect from us:
        </p>
        <ul style="font-size:15px;color:#444;line-height:2;padding-left:20px;margin:0 0 32px;">
          <li>🥕 Weekly fresh arrivals &amp; seasonal specials</li>
          <li>💰 Exclusive subscriber discounts &amp; offers</li>
          <li>📖 Healthy recipes &amp; nutrition tips</li>
          <li>🚚 Early access to new products</li>
        </ul>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop"
           style="display:inline-block;background:#4caf50;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Start Shopping Fresh →
        </a>
      `,
      unsubscribeEmail: data.email,
    });

    await sendMail({
      to:      data.email,
      subject: '🌿 Welcome to Vegefoods Newsletter!',
      html,
    });
  } catch (mailErr) {
    console.error('Welcome email failed (non-fatal):', mailErr.message);
  }

  created(res, result, 'Subscribed successfully');
}));

// ── Unsubscribe (public) ──────────────────────────────────────
publicRouter.post('/unsubscribe', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(422).json({ success: false, message: 'Email required.' });
  await newsletterService.unsubscribe(email);
  success(res, null, 'Unsubscribed successfully');
}));

// ── Admin routes ──────────────────────────────────────────────
const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);

// List subscribers
adminRouter.get('/', asyncHandler(async (req, res) => {
  const q      = validate(paginationSchema, req.query);
  const result = await newsletterService.listSubscribers({ page: q.page, limit: q.limit, status: q.status });
  paginated(res, result.subscribers, { page: result.page, limit: result.limit, total: result.total });
}));

// Update subscriber status
adminRouter.put('/:id', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const VALID = ['active', 'unsubscribed'];
  if (!status || !VALID.includes(status)) {
    return res.status(422).json({ success: false, message: `status must be one of: ${VALID.join(', ')}.` });
  }
  const result = await newsletterService.setStatus(req.params.id, status);
  success(res, result, 'Subscriber status updated');
}));

// Delete subscriber
adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await newsletterService.deleteSubscriber(req.params.id);
  noContent(res, 'Subscriber deleted');
}));

// Send email campaign to all active subscribers
adminRouter.post('/send', asyncHandler(async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !subject.trim()) {
    return res.status(422).json({ success: false, message: 'Subject is required.' });
  }
  if (!message || !message.trim()) {
    return res.status(422).json({ success: false, message: 'Message is required.' });
  }

  // Fetch all active subscribers
  const result = await newsletterService.listSubscribers({ page: 1, limit: 10000, status: 'active' });
  const emails = result.subscribers.map(s => s.email).filter(Boolean);

  if (emails.length === 0) {
    return res.status(400).json({ success: false, message: 'No active subscribers to send to.' });
  }

  const html = buildEmailTemplate({
    subject,
    body: `
      <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;font-weight:700;">${subject}</h2>
      <div style="font-size:15px;color:#444;line-height:1.8;white-space:pre-line;">${message}</div>
      <div style="margin-top:32px;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop"
           style="display:inline-block;background:#4caf50;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Shop Now
        </a>
      </div>
    `,
  });

  // Send in batches of 50 to avoid rate limits
  const BATCH = 50;
  let sent = 0, failed = 0;

  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    try {
      await sendMail({ to: batch, subject, html });
      sent += batch.length;
    } catch (err) {
      failed += batch.length;
      console.error('Mail batch error:', err.message);
    }
  }

  success(res, { sent, failed, total: emails.length }, `Email sent to ${sent} subscriber(s)`);
}));

module.exports = { publicRouter, adminRouter };
