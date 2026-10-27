/**
 * Centralized error handling middleware.
 * Transforms errors into consistent JSON responses without leaking internals.
 */
const errorHandler = (err, req, res, next) => {
  // Log error without leaking sensitive info
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const humanField = field === 'email' ? 'Email address' : field;
    return res.status(409).json({
      success: false,
      message: `${humanField} already exists`,
    });
  }

  // Mongoose cast error (invalid ObjectId etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier format',
    });
  }

  // JWT errors (should be caught in middleware, but just in case)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  // Application-level errors with explicit status
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      message: err.message || 'An error occurred',
    });
  }

  // Fallback: generic server error (never leak stack in production)
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

/**
 * 404 handler for unmatched routes
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

module.exports = { errorHandler, notFound };
