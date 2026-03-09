const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Advance', 'Salary', 'Office', 'Marketing', 'Project', 'Travel', 'Other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Online', 'Cheque', 'Bank Transfer'],
    required: true
  },
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Approved'
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
