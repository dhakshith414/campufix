const mongoose = require('mongoose');

const ACTION_TYPES = [
  'created',
  'status_changed',
  'assigned',
  'unassigned',
  'reassigned',
  'updated',
  'resolved',
  'rejected',
  'cancelled',
  'note_added',
];

const issueActivitySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: { values: ACTION_TYPES, message: 'Invalid action type' },
    },
    previousValue: {
      type: String,
      default: null,
    },
    newValue: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Activity note too long'],
      default: '',
    },
  },
  {
    timestamps: true,
    // Disable updatedAt — activity records are immutable
    timestamps: { createdAt: true, updatedAt: false },
  }
);

issueActivitySchema.index({ issue: 1, createdAt: 1 });

issueActivitySchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('IssueActivity', issueActivitySchema);
module.exports.ACTION_TYPES = ACTION_TYPES;
