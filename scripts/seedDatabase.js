const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@spcity.com',
      username: 'admin',
      password: 'admin123',
      phone: '+91 9999999999',
      role: 'admin',
      department: 'Administration',
      permissions: ['leads', 'projects', 'reports'],
      status: 'Active'
    });

    await adminUser.save();
    console.log('Admin user created successfully');

    // Create sample associate user
    const associateUser = new User({
      name: 'Rajesh Kumar',
      email: 'rajesh@spcity.com',
      username: 'rajesh',
      password: 'rajesh123',
      phone: '+91 9876543210',
      role: 'associate',
      department: 'Sales',
      permissions: ['leads', 'projects'],
      status: 'Active',
      createdBy: adminUser._id
    });

    await associateUser.save();
    console.log('Sample associate user created successfully');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();