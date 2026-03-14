const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  customerName: {
    type: String,
    required: true,
    trim: true
  },

  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  relation: {
    type: String,
    enum: ['S/O', 'W/O', 'D/O'],
    default: 'S/O'
  },
  fatherName: {
    type: String,
    trim: true
  },
  customerAddress: {
    type: String,
    trim: true
  },
  referenceId: {
    type: String,
    trim: true
  },
  plotId: {
    type: String,
    trim: true
  },
  plotNo: {
    type: String,
    trim: true
  },
  bookingArea: {
    type: String,
    trim: true
  },
  plotFacing: {
    type: String,
    trim: true
  },
  rate: {
    type: Number,
    default: 0
  },
  plcAmount: {
    type: Number,
    default: 0
  },
  developmentCharge: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'RTGS', 'NEFT', 'Online', 'Card'],
    default: 'Cash'
  },
  instrumentNo: {
    type: String,
    trim: true
  },
  instrumentDate: {
    type: Date
  },
  bankName: {
    type: String,
    trim: true
  },
  depositDate: {
    type: Date
  },
  remark: {
    type: String,
    trim: true
  },
  bankAccountName: {
    type: String,
    default: 'State Bank Of India'
  },
  bankAccountNumber: {
    type: String,
    default: '44294171198'
  },
  bankIFSC: {
    type: String,
    default: 'SBIN0011643'
  },
  bankBranchAddress: {
    type: String,
    default: 'Gomti Nagar, Lucknow, UP'
  },

  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },

  items: [
    {
      description: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      unitPrice: { type: Number, required: true },
      amount: { type: Number } // 🔥 backend calculate karega
    }
  ],

  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },

  issueDate: {
    type: Date,
    default: Date.now
  },

  dueDate: {
    type: Date,
    required: true
  },

  notes: {
    type: String,
    trim: true
  },

  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reason: {
    type: String,
    trim: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
