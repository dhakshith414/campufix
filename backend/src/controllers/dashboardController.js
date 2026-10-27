const Issue = require('../models/Issue');
const IssueActivity = require('../models/IssueActivity');

/**
 * GET /api/dashboard/summary
 * Staff/Admin only — aggregated real statistics from DB
 */
const getSummary = async (req, res, next) => {
  try {
    const [statusCounts, priorityCounts, categoryCounts, recentIssues, overdueCount] = await Promise.all([
      // Count by status
      Issue.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Count by priority
      Issue.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      // Count by category
      Issue.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Recent 5 unresolved issues
      Issue.find({ status: { $nin: ['Resolved', 'Cancelled', 'Rejected'] } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('reporter', 'name')
        .populate('assignee', 'name')
        .lean(),
      // Overdue: In Progress > 7 days
      Issue.countDocuments({
        status: { $in: ['Submitted', 'Acknowledged', 'In Progress'] },
        createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Normalize status counts to object
    const statusMap = {};
    statusCounts.forEach((s) => { statusMap[s._id] = s.count; });

    const priorityMap = {};
    priorityCounts.forEach((p) => { priorityMap[p._id] = p.count; });

    const total = await Issue.countDocuments();
    const unassigned = await Issue.countDocuments({
      assignee: null,
      status: { $nin: ['Resolved', 'Cancelled', 'Rejected'] },
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        unassigned,
        overdue: overdueCount,
        byStatus: {
          Submitted: statusMap['Submitted'] || 0,
          Acknowledged: statusMap['Acknowledged'] || 0,
          'In Progress': statusMap['In Progress'] || 0,
          Resolved: statusMap['Resolved'] || 0,
          Rejected: statusMap['Rejected'] || 0,
          Cancelled: statusMap['Cancelled'] || 0,
        },
        byPriority: {
          Critical: priorityMap['Critical'] || 0,
          High: priorityMap['High'] || 0,
          Medium: priorityMap['Medium'] || 0,
          Low: priorityMap['Low'] || 0,
        },
        byCategory: categoryCounts.map((c) => ({ category: c._id, count: c.count })),
        recentIssues,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary };
