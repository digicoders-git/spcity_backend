const mongoose = require('mongoose');
const Project = require('../models/Project');
const Lead = require('../models/Lead');
const User = require('../models/User');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get admin and associate users
    const admin = await User.findOne({ email: 'admin@spcity.com' });
    const associate = await User.findOne({ email: 'associate@spcity.com' });

    if (!admin || !associate) {
      console.log('Please run seedUsers.js first to create users');
      return;
    }

    // Clear existing data
    await Project.deleteMany({});
    await Lead.deleteMany({});
    console.log('Cleared existing data');

    // Create sample projects
    const projects = [
      {
        name: 'SP City Heights',
        description: 'Luxury residential apartments with modern amenities',
        location: 'Baner, Pune',
        type: 'Residential',
        status: 'In Progress',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        budget: 50000000,
        totalUnits: 120,
        availableUnits: 85,
        pricePerUnit: 4500000,
        amenities: ['Swimming Pool', 'Gym', 'Garden', 'Parking', 'Security'],
        assignedTo: [associate._id],
        createdBy: admin._id
      },
      {
        name: 'SP City Commercial Plaza',
        description: 'Modern commercial spaces for offices and retail',
        location: 'Hinjewadi, Pune',
        type: 'Commercial',
        status: 'Planning',
        startDate: new Date('2024-06-01'),
        budget: 75000000,
        totalUnits: 50,
        availableUnits: 50,
        pricePerUnit: 8500000,
        amenities: ['Parking', 'Security', 'Elevator', 'Power Backup'],
        assignedTo: [associate._id],
        createdBy: admin._id
      },
      {
        name: 'SP City Villas',
        description: 'Premium independent villas with private gardens',
        location: 'Kharadi, Pune',
        type: 'Residential',
        status: 'Completed',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2024-01-31'),
        budget: 80000000,
        totalUnits: 25,
        availableUnits: 5,
        pricePerUnit: 12000000,
        amenities: ['Private Garden', 'Parking', 'Security', 'Club House'],
        assignedTo: [associate._id],
        createdBy: admin._id
      }
    ];

    const createdProjects = await Project.insertMany(projects);
    console.log(`Created ${createdProjects.length} projects`);

    // Create sample leads
    const leads = [
      {
        name: 'Rahul Sharma',
        phone: '+91 9876543210',
        email: 'rahul.sharma@email.com',
        project: createdProjects[0]._id,
        status: 'Pending',
        source: 'Website',
        budget: '40-50L',
        notes: 'Interested in 2BHK apartment',
        associate: associate._id,
        createdBy: admin._id
      },
      {
        name: 'Priya Patel',
        phone: '+91 9876543211',
        email: 'priya.patel@email.com',
        project: createdProjects[0]._id,
        status: 'Show',
        source: 'Referral',
        budget: '45-55L',
        notes: 'Looking for 3BHK with good view',
        associate: associate._id,
        createdBy: associate._id
      },
      {
        name: 'Amit Kumar',
        phone: '+91 9876543212',
        email: 'amit.kumar@email.com',
        project: createdProjects[1]._id,
        status: 'Visit',
        source: 'Social Media',
        budget: '80-90L',
        notes: 'Interested in commercial space for office',
        associate: associate._id,
        createdBy: associate._id
      },
      {
        name: 'Sneha Joshi',
        phone: '+91 9876543213',
        email: 'sneha.joshi@email.com',
        project: createdProjects[2]._id,
        status: 'Deal Done',
        source: 'Walk-in',
        budget: '1.2Cr',
        notes: 'Purchased villa in Phase 1',
        associate: associate._id,
        createdBy: admin._id
      },
      {
        name: 'Vikram Singh',
        phone: '+91 9876543214',
        email: 'vikram.singh@email.com',
        project: createdProjects[0]._id,
        status: 'Pending',
        source: 'Advertisement',
        budget: '35-45L',
        notes: 'First time buyer, needs guidance',
        associate: associate._id,
        createdBy: associate._id
      }
    ];

    const createdLeads = await Lead.insertMany(leads);
    console.log(`Created ${createdLeads.length} leads`);

    console.log('Sample data seeded successfully!');
    console.log('Projects:', createdProjects.length);
    console.log('Leads:', createdLeads.length);

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedData();