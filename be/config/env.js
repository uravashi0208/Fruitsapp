require('dotenv').config();

const required = (key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  return process.env[key];
};

module.exports = {
  PORT:                    process.env.PORT || 4000,
  NODE_ENV:                process.env.NODE_ENV || 'development',
  CLIENT_URL:              process.env.CLIENT_URL || 'http://localhost:3000',
  JWT_SECRET:              required('JWT_SECRET'),
  JWT_EXPIRES_IN:          process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN:  process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  FIREBASE_PROJECT_ID:     required('FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL:   required('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY:    required('FIREBASE_PRIVATE_KEY'),
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',
  RATE_LIMIT_WINDOW_MS:    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX:          parseInt(process.env.RATE_LIMIT_MAX) || 200,
  AUTH_RATE_LIMIT_MAX:     parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  // Mail (nodemailer)
  MAIL_HOST:  process.env.MAIL_HOST  || 'smtp.gmail.com',
  MAIL_PORT:  process.env.MAIL_PORT  || '587',
  MAIL_USER:  process.env.MAIL_USER  || '',
  MAIL_PASS:  process.env.MAIL_PASS  || '',
  MAIL_FROM:  process.env.MAIL_FROM  || '',
  // Stripe
  STRIPE_SECRET_KEY:      process.env.STRIPE_SECRET_KEY      || '',
  STRIPE_WEBHOOK_SECRET:  process.env.STRIPE_WEBHOOK_SECRET  || '',
  // Google Pay (direct — no Stripe)
  GPAY_MERCHANT_ID:            process.env.GPAY_MERCHANT_ID            || 'TEST',
  GPAY_MERCHANT_NAME:          process.env.GPAY_MERCHANT_NAME          || 'My Shop',
  GPAY_GATEWAY:                process.env.GPAY_GATEWAY                || '',
  GPAY_GATEWAY_MERCHANT_ID:    process.env.GPAY_GATEWAY_MERCHANT_ID    || '',
};
