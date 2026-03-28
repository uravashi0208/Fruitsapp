const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, AUTH_RATE_LIMIT_MAX } = require('../config/env');

const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max:      RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max:      AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many auth attempts. Please wait before trying again.' },
});

module.exports = { globalRateLimiter, authRateLimiter };
