const Issue = require('../models/Issue');
const IssueActivity = require('../models/IssueActivity');
const { STATUS_TRANSITIONS } = require('../models/Issue');

/**
 * POST /api/issues
 * Student creates a new issue
 */
const createIssue = async (req, res, next) => {
  try {
    const { title, description, category, location, priority } = req.body;

    const issue = await Issue.create({
      title,
      description,
      category,
      location,
      priority: priority || 'Medium',
      reporter: req.user.id,
      status: 'Submitted',
    });

    // Create initial activity record
    await IssueActivity.create({
      issue: issue._id,
      actor: req.user.id,
      action: 'created',
      newValue: 'Submitted',
      note: 'Issue submitted',
    });

    const populated = await Issue.findById(issue._id)
      .populate('reporter', 'name email role')
      .populate('assignee', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Issue submitted successfully',
      data: { issue: populated },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/issues
 * Students: own issues only
 * Staff/Admin: all issues with filters
 */
const getIssues = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      category,
      assignee,
      search,
      sort = '-createdAt',
      myIssues,
    } = req.query;

    const filter = {};

    // Role-based scoping
    if (req.user.role === 'student') {
      filter.reporter = req.user.id;
    } else if (myIssues === 'true') {
      filter.assignee = req.user.id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignee && req.user.role !== 'student') filter.assignee = assignee;

    // Text search on title and description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { issueCode: { $regex: search, $options: 'i' } },
        { 'location.building': { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      Issue.find(filter)
        .populate('reporter', 'name email')
        .populate('assignee', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Issue.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/issues/:id
 */
const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email role department')
      .populate('assignee', 'name email role department');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Students can only view their own issues
    if (req.user.role === 'student' && issue.reporter._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: { issue } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/issues/:id
 * Student can edit title/description/location/priority only in Submitted state
 */
const updateIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Ownership check for students
    if (req.user.role === 'student') {
      if (issue.reporter.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (issue.status !== 'Submitted') {
        return res.status(400).json({
          success: false,
          message: 'Issue can only be edited while in Submitted status',
        });
      }
    }

    const allowedFields = ['title', 'description', 'location', 'priority', 'category'];
    const updates = {};
    allowedFields.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Staff/admin cannot alter reporter/status through this endpoint
    const updated = await Issue.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('reporter', 'name email')
      .populate('assignee', 'name email');

    await IssueActivity.create({
      issue: issue._id,
      actor: req.user.id,
      action: 'updated',
      note: 'Issue details updated',
    });

    res.status(200).json({ success: true, message: 'Issue updated', data: { issue: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/issues/:id/status
 * Staff/Admin only (students can only cancel their own Submitted issues)
 */
const updateStatus = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const { status, note, resolutionNote } = req.body;

    // Students can only cancel their own Submitted issues
    if (req.user.role === 'student') {
      if (issue.reporter.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      if (status !== 'Cancelled') {
        return res.status(403).json({ success: false, message: 'Students can only cancel their own issues' });
      }
      if (issue.status !== 'Submitted') {
        return res.status(400).json({ success: false, message: 'Can only cancel issues in Submitted status' });
      }
    }

    // Validate status transition
    const allowed = STATUS_TRANSITIONS[issue.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${issue.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}`,
      });
    }

    const previousStatus = issue.status;
    const updates = { status };

    if (status === 'Resolved') {
      updates.resolvedAt = new Date();
      if (resolutionNote) updates.resolutionNote = resolutionNote;
    }

    const updated = await Issue.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
      .populate('reporter', 'name email')
      .populate('assignee', 'name email');

    const actionMap = {
      Resolved: 'resolved',
      Rejected: 'rejected',
      Cancelled: 'cancelled',
    };
    const action = actionMap[status] || 'status_changed';

    await IssueActivity.create({
      issue: issue._id,
      actor: req.user.id,
      action,
      previousValue: previousStatus,
      newValue: status,
      note: note || (status === 'Resolved' ? resolutionNote : '') || '',
    });

    res.status(200).json({ success: true, message: `Issue status updated to ${status}`, data: { issue: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/issues/:id/assignment
 * Staff/Admin only
 */
const updateAssignment = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const { assigneeId, note } = req.body;

    const previousAssignee = issue.assignee ? issue.assignee.toString() : null;

    const updated = await Issue.findByIdAndUpdate(
      req.params.id,
      { $set: { assignee: assigneeId || null } },
      { new: true }
    )
      .populate('reporter', 'name email')
      .populate('assignee', 'name email');

    const action = assigneeId
      ? previousAssignee
        ? 'reassigned'
        : 'assigned'
      : 'unassigned';

    await IssueActivity.create({
      issue: issue._id,
      actor: req.user.id,
      action,
      previousValue: previousAssignee,
      newValue: assigneeId || null,
      note: note || '',
    });

    res.status(200).json({ success: true, message: 'Assignment updated', data: { issue: updated } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/issues/:id/activity
 */
const getActivity = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).lean();
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    // Students can only view activity for their own issues
    if (req.user.role === 'student' && issue.reporter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const activities = await IssueActivity.find({ issue: req.params.id })
      .populate('actor', 'name role')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({ success: true, data: { activities } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createIssue,
  getIssues,
  getIssueById,
  updateIssue,
  updateStatus,
  updateAssignment,
  getActivity,
};
