class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, _next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Joi validation errors
  if (err.name === 'ValidationError' && err.isJoi) {
    return res.status(422).json({ success: false, message: err.details[0].message.replace(/"/g, '') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  return res.status(401).json({ success: false, message: 'Invalid token.' });
  if (err.name === 'TokenExpiredError')  return res.status(401).json({ success: false, message: 'Token expired.' });

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE')    return res.status(413).json({ success: false, message: 'File too large. Max 5 MB.' });

  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
};

module.exports = { AppError, errorHandler, notFoundHandler };
