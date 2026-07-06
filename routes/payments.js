const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', paymentType = '' } = req.query;
    
    let query = {};

    // If user is associate, only show their payments
    if (req.user.role === 'associate') {
      query.associate = req.user.id;
    }

    // Add search filters
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;

    const payments = await Payment.find(query)
      .populate('project', 'name location')
      .populate('site', 'name address')
      .populate('associate', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
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

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', [
  auth,
  body('customerName').notEmpty().withMessage('Customer name is required'),
  body('customerPhone').notEmpty().withMessage('Customer phone is required'),
  body('project').notEmpty().withMessage('Project is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentType').isIn(['Booking', 'Installment', 'Final', 'Token']).withMessage('Valid payment type is required'),
  body('paymentMethod').isIn(['Cash', 'Cheque', 'Bank Transfer', 'Online', 'Card']).withMessage('Valid payment method is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
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

    let { project, ...otherData } = req.body;
    
    // If project is a string (type), find the project by type
    if (typeof project === 'string' && !project.match(/^[0-9a-fA-F]{24}$/)) {
      const foundProject = await Project.findOne({ type: project });
      if (!foundProject) {
        return res.status(400).json({
          success: false,
          message: `No project found with type: ${project}`
        });
      }
      project = foundProject._id;
    }

    const paymentData = {
      ...otherData,
      project,
      associate: req.body.associate || req.user.id,
      createdBy: req.user.id
    };

    const payment = new Payment(paymentData);
    await payment.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('project', 'name location')
      .populate('site', 'name address')
      .populate('associate', 'name')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: populatedPayment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private
router.put('/:id', [
  auth,
  body('customerName').optional().notEmpty().withMessage('Customer name cannot be empty'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number')
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

    let payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user has permission to update this payment
    if (req.user.role === 'associate' && payment.associate.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this payment'
      });
    }

    payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('project', 'name location')
     .populate('site', 'name address')
     .populate('associate', 'name')
     .populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/payments/:id/status
// @desc    Update payment status
// @access  Private
router.put('/:id/status', [
  auth,
  body('status').isIn(['Pending', 'Received', 'Bounced', 'Cancelled']).withMessage('Valid status is required')
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

    let payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    const updateData = { status: req.body.status };
    if (req.body.status === 'Received') {
      updateData.receivedDate = new Date();
    }

    payment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('project', 'name location')
     .populate('site', 'name address')
     .populate('associate', 'name')
     .populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: payment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user has permission to delete this payment
    if (req.user.role === 'associate' && payment.associate.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this payment'
      });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
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