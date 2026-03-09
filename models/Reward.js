const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  month: {
    type: String, // e.g., "January"
    required: true
  },
  year: {
    type: String, // e.g., "2026"
    required: true
  },
  rewardLevel: {
    type: Number, // Reference to the automated level (1, 2, 3...)
    default: 0 // 0 for manual rewards
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Paid'],
    default: 'Paid' // Rewards added by admin are usually considered processed/paid
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reward', rewardSchema);
