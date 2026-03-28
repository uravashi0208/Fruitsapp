/**
 * app.js
 * Express application — all middleware + route mounting.
 *
 * ══════════════════════════════════════════════════════════════════
 *  PUBLIC (no auth)
 * ══════════════════════════════════════════════════════════════════
 *  GET  /health
 *  GET  /api/settings
 *  GET  /api/sliders
 *  GET  /api/categories
 *  GET  /api/categories/:id
 *  GET  /api/products             ?category&search&featured&limit
 *  GET  /api/products/:id
 *  GET  /api/testimonials
 *  POST /api/newsletter
 *  POST /api/newsletter/unsubscribe
 *  GET  /api/blogs                ?tag&search&page&limit
 *  GET  /api/blogs/tags
 *  GET  /api/blogs/:idOrSlug
 *  POST /api/contact
 *  GET  /api/faqs                  ?category
 *  GET  /api/faqs/categories
 *
 * ══════════════════════════════════════════════════════════════════
 *  USER AUTH
 * ══════════════════════════════════════════════════════════════════
 *  POST   /api/auth/register
 *  POST   /api/auth/login
 *  POST   /api/auth/refresh
 *  POST   /api/auth/logout          JWT
 *  GET    /api/auth/me              JWT
 *  PATCH  /api/auth/me/password     JWT
 *
 * ══════════════════════════════════════════════════════════════════
 *  USER PROTECTED
 * ══════════════════════════════════════════════════════════════════
 *  GET    /api/wishlist             JWT
 *  POST   /api/wishlist             JWT
 *  GET    /api/wishlist/check/:pid  JWT
 *  DELETE /api/wishlist/clear       JWT
 *  DELETE /api/wishlist/:pid        JWT
 *  POST   /api/orders               (optionalAuth — guest or user)
 *  GET    /api/orders/my            JWT
 *  GET    /api/orders/my/:id        JWT
 *
 * ══════════════════════════════════════════════════════════════════
 *  ADMIN AUTH
 * ══════════════════════════════════════════════════════════════════
 *  POST   /api/admin/auth/register
 *  POST   /api/admin/auth/login
 *  POST   /api/admin/auth/refresh
 *  POST   /api/admin/auth/logout
 *  GET    /api/admin/auth/me
 *  PATCH  /api/admin/auth/me/password
 *
 * ══════════════════════════════════════════════════════════════════
 *  ADMIN PROTECTED  (JWT + role: admin | editor)
 * ══════════════════════════════════════════════════════════════════
 *  GET                /api/admin/dashboard
 *  GET/PATCH          /api/admin/settings          (logo, favicon upload)
 *  GET/POST/PUT/DEL   /api/admin/sliders           (image upload)
 *  GET/POST/PUT/DEL   /api/admin/categories        (image upload)
 *  GET/POST/PUT/DEL   /api/admin/products          (thumbnail + images upload)
 *    DELETE           /api/admin/products/:id/image
 *    PATCH            /api/admin/products/:id/status
 *  GET/POST/PUT/DEL   /api/admin/testimonials      (avatar upload)
 *  GET/DEL            /api/admin/newsletter
 *  GET/POST/PUT/DEL   /api/admin/blogs             (cover upload)
 *  GET/DEL + PATCH    /api/admin/contacts          (status update)
 *  GET/PATCH/DEL      /api/admin/orders
 *    GET              /api/admin/orders/stats
 *  GET/PATCH/DEL      /api/admin/users             (storefront users)
 *  GET/PATCH/DEL      /api/admin/admins            (admin accounts)
 *  GET                /api/admin/wishlist          (all user wishlists)
 *  GET/POST/PUT/DEL   /api/admin/faqs
 * ══════════════════════════════════════════════════════════════════
 */

const express    = require('express');
const bodyParser = require('body-parser');
const helmet     = require('helmet');
const cors       = require('cors');
const path       = require('path');

const { CLIENT_URL }    = require('./config/env');
const { globalRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// ── Route modules ─────────────────────────────────────────────────────────────
const { userAuthRouter, adminAuthRouter }          = require('./routes/auth');
const { usersRouter, adminsRouter }                = require('./routes/users');
const { publicRouter: catPublic, adminRouter: catAdmin }   = require('./routes/categories');
const { publicRouter: prodPublic, adminRouter: prodAdmin } = require('./routes/products');
const { publicRouter: sliderPublic, adminRouter: sliderAdmin } = require('./routes/sliders');
const { publicRouter: testPublic,  adminRouter: testAdmin  }   = require('./routes/testimonials');
const { publicRouter: newsPublic,  adminRouter: newsAdmin  }   = require('./routes/newsletter');
const { publicRouter: settPublic,  adminRouter: settAdmin  }   = require('./routes/settings');
const { publicRouter: blogPublic,  adminRouter: blogAdmin  }   = require('./routes/blogs');
const { publicRouter: contPublic,  adminRouter: contAdmin  }   = require('./routes/contacts');
const { userRouter: orderUser,     adminRouter: orderAdmin }   = require('./routes/orders');
const { userRouter: wishUser,      adminRouter: wishAdmin  }   = require('./routes/wishlist');
const cardsRouter     = require('./routes/cards');
const { publicRouter: faqPublic,   adminRouter: faqAdmin   }   = require('./routes/faqs');
const { publicRouter: reviewPublic, adminRouter: reviewAdmin } = require('./routes/reviews');
const dashboardRouter = require('./routes/dashboard');
const stripeRouter    = require('./routes/stripe');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    CLIENT_URL,
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/,
  ].filter(Boolean),
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', env: process.env.NODE_ENV, ts: Date.now() })
);

// ── Public API ────────────────────────────────────────────────────────────────
app.use('/api/settings',     settPublic);
app.use('/api/sliders',      sliderPublic);
app.use('/api/categories',   catPublic);
app.use('/api/products',     prodPublic);
app.use('/api/products/:productId/reviews', reviewPublic);
app.use('/api/testimonials', testPublic);
app.use('/api/newsletter',   newsPublic);
app.use('/api/blogs',        blogPublic);
app.use('/api/contact',      contPublic);
app.use('/api/faqs',         faqPublic);

// ── User Auth ─────────────────────────────────────────────────────────────────
app.use('/api/auth', userAuthRouter);

// ── Stripe ────────────────────────────────────────────────────────────────────
app.use('/api/stripe', stripeRouter);

// ── User Protected ────────────────────────────────────────────────────────────
app.use('/api/wishlist', wishUser);
app.use('/api/orders',   orderUser);

// ── Admin Auth ────────────────────────────────────────────────────────────────
app.use('/api/admin/auth', adminAuthRouter);

// ── Admin Protected ───────────────────────────────────────────────────────────
app.use('/api/admin/dashboard',    dashboardRouter);
app.use('/api/admin/settings',     settAdmin);
app.use('/api/admin/sliders',      sliderAdmin);
app.use('/api/admin/categories',   catAdmin);
app.use('/api/admin/products',     prodAdmin);
app.use('/api/admin/testimonials', testAdmin);
app.use('/api/admin/newsletter',   newsAdmin);
app.use('/api/admin/blogs',        blogAdmin);
app.use('/api/admin/contacts',     contAdmin);
app.use('/api/admin/orders',       orderAdmin);
app.use('/api/admin/users',        usersRouter);
app.use('/api/admin/admins',       adminsRouter);
app.use('/api/admin/cards',        cardsRouter);
app.use('/api/admin/faqs',         faqAdmin);
app.use('/api/admin/wishlist',     wishAdmin);
app.use('/api/admin',             reviewAdmin);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;