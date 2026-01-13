const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Site = require('../models/Site');
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

const clearDummyData = async () => {
  try {
    await connectDB();

    // Clear all collections
    await Lead.deleteMany({});
    await Payment.deleteMany({});
    await Project.deleteMany({});
    await Site.deleteMany({});

    console.log('✅ All dummy data cleared successfully!');
    console.log('✅ Database is now clean and ready for real data');
    console.log('✅ All new data will be properly saved to MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

clearDummyData();