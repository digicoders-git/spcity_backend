const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // if null, system-wide admin notification
  },
  role: {
    type: String,
    enum: ['admin', 'associate', 'all'],
    default: 'all' // who should see this. if all, both see it
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String // optional link attached to notification
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
