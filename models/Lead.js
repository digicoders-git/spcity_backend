const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  source: {
    type: String,
    enum: ['Website', 'Referral', 'Social Media', 'Walk-in', 'Advertisement', 'Other'],
    default: 'Website'
  },
  status: {
    type: String,
    enum: ['Pending', 'Show', 'Visit', 'Deal Done'],
    default: 'Pending'
  },
  budget: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  followUpDate: {
    type: Date
  },
  lastContactDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', leadSchema);