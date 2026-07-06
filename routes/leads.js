const express = require('express');
const { body, validationResult } = require('express-validator');
const Lead = require('../models/Lead');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/leads
// @desc    Get all leads
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', source = '' } = req.query;
    
    let query = {};
    
    // If user is associate, only show their leads
    if (req.user.role === 'associate') {
      query.associate = req.user.id;
    }

    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (source) query.source = source;

    const leads = await Lead.find(query)
      .populate('project', 'name location')
      .populate('associate', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/leads
// @desc    Create new lead
// @access  Private
router.post('/', [
  auth,
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('source').optional().isIn(['Website', 'Referral', 'Social Media', 'Walk-in', 'Advertisement', 'Other']).withMessage('Valid source is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const leadData = {
      ...req.body,
      associate: req.body.associate || req.user.id,
      createdBy: req.user.id
    };

    const lead = new Lead(leadData);
    await lead.save();

    const populatedLead = await Lead.findById(lead._id)
      .populate('project', 'name location')
      .populate('associate', 'name')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: populatedLead
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update lead
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if user has permission to update this lead
    if (req.user.role === 'associate' && lead.associate.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this lead'
      });
    }

    lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('project', 'name location')
     .populate('associate', 'name')
     .populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete lead
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check if user has permission to delete this lead
    if (req.user.role === 'associate' && lead.associate.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this lead'
      });
    }

    await Lead.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/leads/stats
// @desc    Get lead statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'associate') {
      matchQuery.associate = req.user.id;
    }

    const stats = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLeads = await Lead.countDocuments(matchQuery);

    res.json({
      success: true,
      data: {
        total: totalLeads,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;