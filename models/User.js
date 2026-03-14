const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  plainPassword: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'associate'],
    default: 'associate'
  },
  department: {
    type: String,
    default: 'Sales'
  },
  permissions: [{
    type: String,
    enum: ['leads', 'projects', 'reports']
  }],
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sponsor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  level: {
    type: Number,
    default: 1
  },
  rank: {
    type: String,
    enum: ['STAR', 'GOLD', 'PLATINUM', 'RUBY', 'EMERALD', 'DIAMOND', 'DOUBLE DIAMOND', 'CROWN', 'EX CROWN', 'SUPER CROWN', 'ROYAL CROWN'],
    default: 'STAR'
  },
  totalSales: {
    type: Number,
    default: 0
  },
  address: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  bankDetails: {
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    ifscCode: { type: String, trim: true },
    branchName: { type: String, trim: true }
  },
  panNumber: { type: String, trim: true },
  aadhaarNumber: { type: String, trim: true },
  documents: {
    panCard: { type: String },
    aadhaarCard: { type: String }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);