const { Router }     = require('express');
const contactService = require('../services/contactService');
const asyncHandler   = require('../utils/asyncHandler');
const { success, created, paginated, noContent } = require('../utils/response');
const { authenticate, requireEditor }            = require('../middleware/auth');
const { contactSchema, paginationSchema, validate } = require('../validations/schemas');
const { sendMail, buildEmailTemplate }           = require('../utils/mailer');

const publicRouter = Router();

publicRouter.post('/', asyncHandler(async (req, res) => {
  const data   = validate(contactSchema, req.body);
  const result = await contactService.createContact(data);

  // ── 1. Confirmation email to the user ────────────────────────
  try {
    const userHtml = buildEmailTemplate({
      subject: '✅ We received your message — Vegefoods',
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#1a1a1a;font-weight:700;">
          Thanks for reaching out, ${data.name}! 🌿
        </h2>
        <p style="font-size:15px;color:#444;line-height:1.8;margin:0 0 16px;">
          We've received your message and our team will get back to you within <strong>24 hours</strong>.
        </p>
        <div style="background:#f9fdf3;border:1px solid #d4edbb;border-radius:10px;padding:20px 24px;margin:0 0 28px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Your message</p>
          <p style="margin:0;font-size:15px;color:#333;line-height:1.7;font-style:italic;">"${data.message}"</p>
        </div>
        <p style="font-size:14px;color:#666;margin:0 0 28px;">
          In the meantime, feel free to explore our fresh produce and organic products.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/shop"
           style="display:inline-block;background:#82ae46;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
          Shop Fresh Produce
        </a>
      `,
    });
    await sendMail({
      to:      data.email,
      subject: '✅ We received your message — Vegefoods',
      html:    userHtml,
    });
  } catch (mailErr) {
    console.warn('User confirmation email failed (non-fatal):', mailErr.message);
  }

  // ── 2. Notification email to admin ───────────────────────────
  try {
    const adminEmail = process.env.MAIL_USER;
    if (adminEmail) {
      const adminHtml = buildEmailTemplate({
        subject: `📩 New Contact Message from ${data.name}`,
        body: `
          <h2 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;font-weight:700;">
            New Contact Form Submission
          </h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#444;">
            <tr><td style="padding:8px 0;font-weight:600;color:#555;width:100px;">Name:</td><td style="padding:8px 0;">${data.name}</td></tr>
            <tr><td style="padding:8px 0;font-weight:600;color:#555;">Email:</td><td style="padding:8px 0;"><a href="mailto:${data.email}" style="color:#82ae46;">${data.email}</a></td></tr>
            ${data.phone ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;">Phone:</td><td style="padding:8px 0;">${data.phone}</td></tr>` : ''}
            ${data.subject ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;">Subject:</td><td style="padding:8px 0;">${data.subject}</td></tr>` : ''}
          </table>
          <div style="background:#f9fdf3;border-left:4px solid #82ae46;padding:16px 20px;margin:20px 0;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
            <p style="margin:0;font-size:15px;color:#333;line-height:1.7;">${data.message}</p>
          </div>
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/contacts"
             style="display:inline-block;background:#82ae46;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">
            View in Admin Panel
          </a>
        `,
      });
      await sendMail({
        to:      adminEmail,
        subject: `📩 New Contact: ${data.name} — ${data.subject || data.message.slice(0, 40)}`,
        html:    adminHtml,
      });
    }
  } catch (mailErr) {
    console.warn('Admin notification email failed (non-fatal):', mailErr.message);
  }

  created(res, result, 'Message sent successfully');
}));

const adminRouter = Router();
adminRouter.use(authenticate, requireEditor);   // changed from requireAdmin → requireEditor

adminRouter.get('/stats', asyncHandler(async (req, res) => {
  success(res, await contactService.getContactStats());
}));

adminRouter.get('/', asyncHandler(async (req, res) => {
  const q      = validate(paginationSchema, req.query);
  const result = await contactService.listContacts({ page: q.page, limit: q.limit, status: q.status, search: q.search });
  paginated(res, result.contacts, { page: result.page, limit: result.limit, total: result.total });
}));

adminRouter.get('/:id', asyncHandler(async (req, res) => {
  success(res, await contactService.getContact(req.params.id));
}));

adminRouter.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['new', 'unread', 'read', 'replied', 'archived'].includes(status))
    return res.status(422).json({ success: false, message: 'Invalid status.' });
  success(res, await contactService.updateContactStatus(req.params.id, status), 'Status updated');
}));

adminRouter.delete('/:id', asyncHandler(async (req, res) => {
  await contactService.deleteContact(req.params.id);
  noContent(res, 'Contact deleted');
}));

module.exports = { publicRouter, adminRouter };
