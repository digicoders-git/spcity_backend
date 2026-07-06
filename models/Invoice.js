const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  unitPrice: Number
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: String,
  customerEmail: String,
  relation: {
    type: String,
    enum: ['S/O', 'D/O', 'W/O', 'C/O']
  },
  fatherName: String,
  customerAddress: String,
  referenceId: String,
  plotId: String,
  plotNo: String,
  bookingArea: String,
  plotFacing: String,
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
  discount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  totalPaid: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Other'],
    default: 'Cash'
  },
  instrumentNo: String,
  instrumentDate: Date,
  bankName: String,
  depositDate: Date,
  remark: String,
  bankAccountName: String,
  bankAccountNumber: String,
  bankIFSC: String,
  bankBranchAddress: String,
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  associate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reason: String,
  items: [invoiceItemSchema],
  dueDate: Date,
  notes: String,
  status: {
    type: String,
    enum: ['Draft', 'Pending', 'Paid', 'Overdue', 'Cancelled'],
    default: 'Draft'
  },
  taxRate: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate invoice number before saving
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Find highest invoice number for current month
    const pattern = new RegExp(`^INV${year}${month}`);
    const lastInvoice = await this.constructor.findOne(
      { invoiceNumber: pattern },
      {},
      { sort: { 'invoiceNumber': -1 } }
    );

    let seq = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastSeq = parseInt(lastInvoice.invoiceNumber.slice(-4));
      seq = lastSeq + 1;
    }

    this.invoiceNumber = `INV${year}${month}${seq.toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
