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