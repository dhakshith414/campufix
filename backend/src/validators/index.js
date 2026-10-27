const { body, param, query } = require('express-validator');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../models/Issue');

const authValidators = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and a number'),
  ],
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
};

const issueValidators = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 150 }).withMessage('Title must be 5–150 characters'),
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters'),
    body('category')
      .notEmpty().withMessage('Category is required')
      .isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('location.building')
      .trim()
      .notEmpty().withMessage('Building/Location is required')
      .isLength({ max: 100 }).withMessage('Building name too long'),
    body('location.room')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Room identifier too long'),
    body('location.additionalDetail')
      .optional()
      .trim()
      .isLength({ max: 200 }).withMessage('Additional detail too long'),
    body('priority')
      .optional()
      .isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  ],
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 150 }).withMessage('Title must be 5–150 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters'),
    body('location.building')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Building name too long'),
    body('priority')
      .optional()
      .isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),
  ],
  statusUpdate: [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Note must be at most 500 characters'),
    body('resolutionNote')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Resolution note must be at most 1000 characters'),
  ],
  assignmentUpdate: [
    body('assigneeId')
      .optional({ nullable: true })
      .isMongoId().withMessage('Invalid assignee ID'),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Note must be at most 500 characters'),
  ],
  listQuery: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
    query('status').optional().isIn([...STATUSES, '']).withMessage('Invalid status filter'),
    query('priority').optional().isIn([...PRIORITIES, '']).withMessage('Invalid priority filter'),
    query('category').optional().isIn([...CATEGORIES, '']).withMessage('Invalid category filter'),
  ],
  objectId: [
    param('id').isMongoId().withMessage('Invalid issue ID'),
  ],
};

const userValidators = {
  createStaff: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
    body('email').trim().notEmpty().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password too weak'),
    body('role').optional().isIn(['staff', 'admin']).withMessage('Role must be staff or admin'),
    body('department').optional().trim().isLength({ max: 100 }),
  ],
};

module.exports = { authValidators, issueValidators, userValidators };
