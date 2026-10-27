const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, getStaffList } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { userValidators } = require('../validators');
const { validate } = require('../middleware/validate');

router.use(authenticate);

// Staff/admin can see the staff list (for assignment dropdowns)
router.get('/staff', authorize('staff', 'admin'), getStaffList);

// Admin-only user management
router.get('/', authorize('admin'), getUsers);
router.post('/', authorize('admin'), userValidators.createStaff, validate, createUser);
router.patch('/:id', authorize('admin'), updateUser);

module.exports = router;
