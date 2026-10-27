const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Public — always creates student role
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, department } = req.body;

    // Check for existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'student', // ALWAYS student from public registration
      department: department || '',
    });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Select passwordHash explicitly (excluded by default)
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      // Generic message — don't reveal if account exists
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    const userObj = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userObj, token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Client-side logout — invalidates via client token deletion.
 * Server acknowledges request.
 */
const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
