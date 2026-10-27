const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  updateStatus,
  updateAssignment,
  getActivity,
} = require('../controllers/issueController');
const { authenticate, authorize } = require('../middleware/auth');
const { issueValidators } = require('../validators');
const { validate } = require('../middleware/validate');

// All issue routes require authentication
router.use(authenticate);

router.post('/', issueValidators.create, validate, createIssue);
router.get('/', issueValidators.listQuery, validate, getIssues);
router.get('/:id', issueValidators.objectId, validate, getIssueById);
router.patch('/:id', issueValidators.objectId, issueValidators.update, validate, updateIssue);
router.patch(
  '/:id/status',
  issueValidators.objectId,
  issueValidators.statusUpdate,
  validate,
  updateStatus
);
router.patch(
  '/:id/assignment',
  issueValidators.objectId,
  issueValidators.assignmentUpdate,
  validate,
  authorize('staff', 'admin'),
  updateAssignment
);
router.get('/:id/activity', issueValidators.objectId, validate, getActivity);

module.exports = router;
