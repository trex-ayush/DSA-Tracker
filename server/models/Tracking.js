const mongoose = require('mongoose');

const trackingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['solved', 'unsolved', 'revisiting'],
    default: 'unsolved'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  solvedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure one tracking record per user-question
trackingSchema.index({ user: 1, question: 1 }, { unique: true });

// Update timestamp on save
trackingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Set solvedAt when status becomes solved
  if (this.status === 'solved' && !this.solvedAt) {
    this.solvedAt = new Date();
  }
  next();
});

// Virtual for question details
trackingSchema.virtual('questionDetails', {
  ref: 'Question',
  localField: 'question',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in JSON output
trackingSchema.set('toJSON', { virtuals: true });
trackingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tracking', trackingSchema);
