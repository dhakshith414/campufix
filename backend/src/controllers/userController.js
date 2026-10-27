const User = require('../models/User');

/**
 * GET /api/users
 * Admin only — list all users with pagination
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 * Admin only — create staff or admin account
 */
const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!['staff', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be staff or admin' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role, department: department || '' });

    res.status(201).json({ success: true, message: 'User created', data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 * Admin only — update user activation, role, department
 */
const updateUser = async (req, res, next) => {
  try {
    const { isActive, department, role } = req.body;
    const updates = {};

    if (isActive !== undefined) updates.isActive = isActive;
    if (department !== undefined) updates.department = department;
    // Admins can change roles of non-admin users
    if (role && ['student', 'staff', 'admin'].includes(role)) updates.role = role;

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, message: 'User updated', data: { user } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/staff
 * Staff/Admin — list all staff members (for assignment dropdowns)
 */
const getStaffList = async (req, res, next) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] }, isActive: true })
      .select('name email role department')
      .sort({ name: 1 })
      .lean();
    res.status(200).json({ success: true, data: { staff } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, createUser, updateUser, getStaffList };
