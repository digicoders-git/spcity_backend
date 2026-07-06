const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Residential', 'Commercial', 'Industrial', 'Mixed Use'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Upcoming', 'Completed', 'On Hold', 'Pending Approval'],
    default: 'Active'
  },
  startDate: {
    type: Date,
    // required: true
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  totalUnits: {
    type: Number,
    required: true,
    min: 1
  },
  availableUnits: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  image: {
    type: String,
    trim: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commissionRate: {
    type: Number,
    default: 2, // 2% default commission
    min: 0,
    max: 10
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);