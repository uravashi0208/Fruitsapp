require('dotenv').config();
const app        = require('./app');
const { PORT }   = require('./config/env');

// Initialise Firebase on startup
require('./config/firebase');

// ── Start cron jobs ───────────────────────────────────────────
// Event reminder cron: every night at midnight
// Sends newsletter emails 2 days before each calendar event
const { startEventReminderCron }   = require('./cron/eventReminder');
const { startCartAbandonmentCron } = require('./cron/cartAbandonment');
startEventReminderCron();
startCartAbandonmentCron();

const server = app.listen(PORT, () => {
  console.log(`\n🚀 Vegefoods API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  server.close(() => process.exit(1));
});