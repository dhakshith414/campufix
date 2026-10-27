const mongoose = require('mongoose');

const CATEGORIES = [
  'Electrical',
  'Plumbing & Water',
  'Cleaning & Sanitation',
  'Classroom Equipment',
  'Internet & Wi-Fi',
  'Furniture & Infrastructure',
  'Safety',
  'Other',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Rejected', 'Cancelled'];

// Valid status transitions
const STATUS_TRANSITIONS = {
  Submitted: ['Acknowledged', 'Rejected', 'Cancelled'],
  Acknowledged: ['In Progress', 'Rejected'],
  'In Progress': ['Resolved', 'Acknowledged'],
  Resolved: [], // Terminal
  Rejected: [], // Terminal
  Cancelled: [], // Terminal
};

const issueSchema = new mongoose.Schema(
  {
    issueCode: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title must be at most 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description must be at most 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: 'Invalid category' },
    },
    location: {
      building: {
        type: String,
        required: [true, 'Building/Location is required'],
        trim: true,
        maxlength: [100, 'Building name too long'],
      },
      room: {
        type: String,
        trim: true,
        maxlength: [50, 'Room identifier too long'],
        default: '',
      },
      additionalDetail: {
        type: String,
        trim: true,
        maxlength: [200, 'Additional detail too long'],
        default: '',
      },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: { values: PRIORITIES, message: 'Invalid priority' },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid status' },
      default: 'Submitted',
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Resolution note too long'],
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
issueSchema.index({ reporter: 1, createdAt: -1 });
issueSchema.index({ status: 1, priority: 1, createdAt: -1 });
issueSchema.index({ category: 1, status: 1 });
issueSchema.index({ assignee: 1, status: 1 });

issueSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

// Auto-generate issueCode before save
issueSchema.pre('save', async function (next) {
  if (this.isNew && !this.issueCode) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    const padded = String(count + 1).padStart(4, '0');
    this.issueCode = `CF-${year}-${padded}`;
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.PRIORITIES = PRIORITIES;
module.exports.STATUSES = STATUSES;
module.exports.STATUS_TRANSITIONS = STATUS_TRANSITIONS;
