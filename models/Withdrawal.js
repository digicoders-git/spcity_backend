const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['Bank Transfer', 'UPI', 'Cheque'],
    required: true
  },
  accountDetails: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
    default: 'Pending'
  },
  reference: {
    type: String,
    unique: true
  },
  notes: {
    type: String
  },
  processedDate: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate unique reference before saving
withdrawalSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = `WD${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
