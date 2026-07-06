const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'SP City Admin',
      email: 'admin@spcity.com',
      username: 'admin',
      password: 'admin123',
      phone: '+91 9876543210',
      role: 'admin',
      department: 'Administration',
      permissions: ['all'],
      status: 'Active'
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@spcity.com');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    mongoose.disconnect();
  }
};

createAdmin();