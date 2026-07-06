const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  site: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['Booking', 'Installment', 'Final', 'Token'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Cheque', 'Bank Transfer', 'Online', 'Card'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Received', 'Bounced', 'Cancelled'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  receivedDate: {
    type: Date
  },
  transactionId: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);