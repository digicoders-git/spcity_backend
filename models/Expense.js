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
  vehicleDetails: {
    vehicleType: { type: String, trim: true },      // Car, Bike, Auto, Bus etc.
    vehicleNumber: { type: String, trim: true },     // e.g. UP32 AB 1234
    driverName: { type: String, trim: true },        // Driver ka naam
    fromLocation: { type: String, trim: true },      // Kahan se
    toLocation: { type: String, trim: true },        // Kahan tak
    kmStart: { type: Number },                       // Starting KM reading
    kmEnd: { type: Number },                         // Ending KM reading
    fuelType: { type: String, trim: true },          // Petrol, Diesel, CNG
    fuelAmount: { type: Number }                     // Fuel cost
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
