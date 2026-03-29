/**
 * cron/eventReminder.js
 *
 * Cron job: runs every night at midnight (00:00)
 *
 * What it does:
 *   1. Finds calendar events whose startDate == today + 2 days
 *      AND notificationSent == false
 *   2. Fetches all active newsletter subscribers
 *   3. Sends a branded reminder email to every subscriber (batched)
 *   4. Marks the event notificationSent = true so it never fires twice
 *
 * Schedule: '0 0 * * *'   → midnight every day (server local time)
 *
 * Start this cron by calling startEventReminderCron() from server.js
 *
 * Dependencies (already in package.json):
 *   node-cron          npm install node-cron
 */

const cron               = require('node-cron');
const calendarService    = require('../services/calendarService');
const newsletterService  = require('../services/newsletterService');
const { sendMail, buildEmailTemplate } = require('../utils/mailer');

const BATCH_SIZE = 50; // send in batches to avoid SMTP rate limits

/**
 * Build the reminder email HTML for one event.
 */
const buildEventReminderBody = (event) => {
  const dateLabel = event.startDate
    ? new Date(event.startDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : event.startDate;

  const timeLabel = event.startTime
    ? `<p style="font-size:14px;color:#666;margin:4px 0 0;">
         🕐 <strong>${event.startTime}${event.endTime ? ' – ' + event.endTime : ''}</strong>
       </p>`
    : '';

  const typeColors = {
    event:      '#4caf50',
    meeting:    '#2196f3',
    seminar:    '#9c27b0',
    submission: '#ff9800',
    other:      '#607d8b',
  };
  const badgeColor = typeColors[event.type] || typeColors.other;

  return `
    <div style="text-align:center;margin-bottom:24px;">
      <span style="display:inline-block;background:${badgeColor};color:#fff;font-size:11px;font-weight:700;
                   letter-spacing:1px;text-transform:uppercase;padding:4px 14px;border-radius:20px;">
        ${event.type || 'Event'}
      </span>
    </div>

    <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a;font-weight:700;text-align:center;">
      📅 Event Reminder — 2 Days Away!
    </h2>

    <p style="text-align:center;font-size:15px;color:#555;margin:0 0 28px;">
      Don't miss this upcoming event from <strong>Vegefoods</strong>
    </p>

    <div style="background:#f8fdf8;border:1px solid #e0f2e0;border-radius:12px;padding:28px 32px;margin-bottom:28px;">
      <h3 style="margin:0 0 12px;font-size:20px;color:#1a1a1a;font-weight:700;">
        ${event.title}
      </h3>
      <p style="font-size:15px;color:#4caf50;font-weight:600;margin:0 0 4px;">
        📆 ${dateLabel}
      </p>
      ${timeLabel}
      ${event.description ? `
        <hr style="border:none;border-top:1px solid #e0f2e0;margin:16px 0;"/>
        <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">
          ${event.description}
        </p>
      ` : ''}
    </div>

    <p style="font-size:14px;color:#777;text-align:center;line-height:1.6;">
      Mark your calendar! This event is happening in just <strong>2 days</strong>.
    </p>

    <div style="text-align:center;margin-top:28px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}"
         style="display:inline-block;background:#4caf50;color:#ffffff;padding:14px 36px;
                border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
        Visit Vegefoods →
      </a>
    </div>
  `;
};

/**
 * Core reminder task — runs once per cron tick.
 */
const runEventReminders = async () => {
  const now = new Date().toISOString();
  console.log(`[cron:eventReminder] ▶ Starting at ${now}`);

  try {
    // 1. Find events 2 days away that haven't been notified yet
    const upcomingEvents = await calendarService.getUpcomingEvents();

    if (upcomingEvents.length === 0) {
      console.log('[cron:eventReminder] ✅ No upcoming events to notify about. Done.');
      return;
    }

    console.log(`[cron:eventReminder] Found ${upcomingEvents.length} event(s) to notify`);

    // 2. Fetch all active newsletter subscribers
    const { subscribers } = await newsletterService.listSubscribers({ page: 1, limit: 10000, status: 'active' });
    const emails = subscribers.map(s => s.email).filter(Boolean);

    if (emails.length === 0) {
      console.log('[cron:eventReminder] ⚠️  No active subscribers — skipping mail send.');
      // Still mark events so they don't retry forever
      for (const event of upcomingEvents) {
        await calendarService.markNotificationSent(event.id);
      }
      return;
    }

    console.log(`[cron:eventReminder] Sending to ${emails.length} subscriber(s)`);

    // 3. For each upcoming event — send to all subscribers in batches
    for (const event of upcomingEvents) {
      const subject = `📅 Reminder: "${event.title}" is in 2 days!`;
      const html = buildEmailTemplate({
        subject,
        body: buildEventReminderBody(event),
      });

      let sent = 0, failed = 0;

      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        try {
          await sendMail({ to: batch, subject, html });
          sent += batch.length;
        } catch (err) {
          failed += batch.length;
          console.error(`[cron:eventReminder] Batch mail error for event "${event.title}":`, err.message);
        }
      }

      console.log(`[cron:eventReminder] Event "${event.title}": sent=${sent}, failed=${failed}`);

      // 4. Mark notification as sent
      await calendarService.markNotificationSent(event.id);
    }

    console.log('[cron:eventReminder] ✅ All reminders processed.');
  } catch (err) {
    console.error('[cron:eventReminder] ❌ Fatal error:', err);
  }
};

/**
 * Start the cron job.
 *
 * Schedule: '0 0 * * *'  → every day at 00:00 (midnight, server timezone)
 *
 * To test immediately on startup, set RUN_CRON_ON_START=true in .env
 */
const startEventReminderCron = () => {
  // Schedule: midnight every day
  cron.schedule('0 0 * * *', async () => {
    await runEventReminders();
  }, {
    scheduled: true,
    timezone: 'UTC', // change to your server timezone e.g. 'Asia/Kolkata'
  });

  console.log('[cron:eventReminder] 🕛 Scheduled — fires every night at midnight (UTC)');

  // Optional: run once immediately on server start (useful for testing)
  if (process.env.RUN_CRON_ON_START === 'true') {
    console.log('[cron:eventReminder] RUN_CRON_ON_START=true — running now for test...');
    runEventReminders();
  }
};

module.exports = { startEventReminderCron, runEventReminders };