const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Require valid JWT bearer token.
 * Attaches req.user with id and role.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Session expired, please log in again' : 'Invalid token';
      return res.status(401).json({ success: false, message: msg });
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.id).select('+isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    }

    req.user = { id: user._id.toString(), role: user.role, name: user.name };
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware factory: Require one of the specified roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }
    next();
  };
};

/**
 * Generate signed JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { authenticate, authorize, generateToken };
