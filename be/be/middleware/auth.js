const { verifyToken } = require('../utils/jwt');
const { AppError }    = require('./errorHandler');

/** Verify JWT and attach req.user */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return next(new AppError('No token provided.', 401));

  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch (err) {
    next(err);
  }
};

/** Optionally attach req.user (no error if missing) */
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try { req.user = verifyToken(header.slice(7)); } catch (_) {}
  }
  next();
};

/** Require role: admin */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin')
    return next(new AppError('Admin access required.', 403));
  next();
};

/** Require role: admin or editor */
const requireEditor = (req, res, next) => {
  if (!req.user || !['admin', 'editor'].includes(req.user.role))
    return next(new AppError('Editor or Admin access required.', 403));
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin, requireEditor };
