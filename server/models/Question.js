const mongoose = require('mongoose');

const companyQuestionSchema = new mongoose.Schema({
  company: {
    type: String,
    required: true
  },
  lastAskedDate: {
    type: Date,
    default: null
  },
  askedWithin: {
    type: String,
    enum: ['30days', '2months', '6months', 'older', null],
    default: null
  },
  frequency: {
    type: Number,
    default: 0
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Question title is required'],
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['Easy', 'Medium', 'Hard']
  },
  topics: [{
    type: String,
    trim: true
  }],
  link: {
    type: String,
    required: [true, 'Question link is required'],
    trim: true
  },
  acceptanceRate: {
    type: Number,
    default: 0
  },
  companies: [companyQuestionSchema],
  isActive: {
    type: Boolean,
    default: true
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

// Compound index for uniqueness
questionSchema.index({ title: 1, link: 1 }, { unique: true });

// Update timestamp on save
questionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to categorize time
questionSchema.statics.categorizeTime = function(date) {
  if (!date) return null;
  
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) return '30days';
  if (diffDays <= 60) return '2months';
  if (diffDays <= 180) return '6months';
  return 'older';
};

module.exports = mongoose.model('Question', questionSchema);
