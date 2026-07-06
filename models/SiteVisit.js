const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientPhone: {
    type: String,
    required: true,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Planned', 'Completed', 'Cancelled'],
    default: 'Planned'
  },
  notes: {
    type: String,
    trim: true
  },
  feedback: {
    type: String,
    trim: true
  },
  outcome: {
    type: String,
    enum: ['Very Interested', 'Interested', 'Neutral', 'Not Interested', 'Booking Initiated', ''],
    default: ''
  },
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SiteVisit', siteVisitSchema);
