const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide expense title']
  },
  category: {
    type: String,
    enum: ['Travel', 'Office', 'Marketing', 'Advance', 'Site Visit', 'Other'],
    required: [true, 'Please provide expense category']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide expense amount']
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Online'],
    default: 'Cash'
  },
  associate: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  lead: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lead'
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  vehicleDetails: {
    vehicleType: String,
    vehicleNumber: String,
    driverName: String,
    fromLocation: String,
    toLocation: String,
    kmStart: Number,
    kmEnd: Number,
    fuelType: String,
    fuelAmount: Number
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
