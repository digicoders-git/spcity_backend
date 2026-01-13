const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    await connectDB();

    // Clear existing users
    await User.deleteMany({});

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'admin@spcity.com',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      phone: '+91 9999999999',
      status: 'Active'
    });

    // Create associate user
    const associate = new User({
      name: 'Associate User',
      email: 'associate@spcity.com',
      username: 'associate',
      password: 'associate123',
      role: 'associate',
      phone: '+91 8888888888',
      status: 'Active'
    });

    await admin.save();
    await associate.save();

    console.log('Users seeded successfully!');
    console.log('Admin: admin@spcity.com / admin123');
    console.log('Associate: associate@spcity.com / associate123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();