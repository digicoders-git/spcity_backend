const express = require('express');
const Lead = require('../models/Lead');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'admin') {
      // Admin dashboard stats
      const totalLeads = await Lead.countDocuments();
      const totalProjects = await Project.countDocuments();
      const totalAssociates = await User.countDocuments({ role: 'associate' });
      const totalPayments = await Payment.countDocuments();
      
      const totalRevenue = await Payment.aggregate([
        { $match: { status: 'Received' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const pendingPayments = await Payment.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      stats = {
        totalLeads,
        totalProjects,
        totalAssociates,
        totalPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingRevenue: pendingPayments[0]?.total || 0
      };
    } else {
      // Associate dashboard stats
      const totalLeads = await Lead.countDocuments({ associate: req.user.id });
      const totalPayments = await Payment.countDocuments({ associate: req.user.id });
      
      // Get commission data from Commission model
      const Commission = require('../models/Commission');
      const commissions = await Commission.find({ associate: req.user.id });
      const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      
      const convertedLeads = await Lead.countDocuments({ 
        associate: req.user.id, 
        status: 'Deal Done' 
      });

      // Calculate site visits (fallback if no SiteVisit model)
      let totalSiteVisits = 0;
      try {
        const SiteVisit = require('../models/SiteVisit');
        totalSiteVisits = await SiteVisit.countDocuments({ associate: req.user.id });
      } catch (error) {
        totalSiteVisits = Math.floor(totalLeads * 0.4); // 40% of leads
      }

      stats = {
        totalLeads,
        convertedLeads,
        totalPayments,
        totalSiteVisits,
        totalCommission,
        pendingCommission: 0,
        conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/charts/leads-trend
// @desc    Get leads trend data for charts
// @access  Private
router.get('/charts/leads-trend', auth, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let matchQuery = { createdAt: { $gte: startDate } };
    if (req.user.role === 'associate') {
      matchQuery.assignedTo = req.user.id;
    }

    const leadsTrend = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: leadsTrend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/charts/revenue-trend
// @desc    Get revenue trend data for charts
// @access  Private (Admin only)
router.get('/charts/revenue-trend', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const revenueTrend = await Payment.aggregate([
      { 
        $match: { 
          status: 'Received',
          receivedDate: { $gte: startDate }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$receivedDate' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: revenueTrend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/charts/project-status
// @desc    Get project status distribution
// @access  Private (Admin only)
router.get('/charts/project-status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const projectStatus = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: projectStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/charts/lead-sources
// @desc    Get lead sources distribution
// @access  Private
router.get('/charts/lead-sources', auth, async (req, res) => {
  try {
    let matchQuery = {};
    if (req.user.role === 'associate') {
      matchQuery.assignedTo = req.user.id;
    }

    const leadSources = await Lead.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: leadSources
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/recent-activities
// @desc    Get recent activities
// @access  Private
router.get('/recent-activities', auth, async (req, res) => {
  try {
    let activities = [];

    if (req.user.role === 'admin') {
      // Recent leads
      const recentLeads = await Lead.find()
        .populate('assignedTo', 'name')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      // Recent payments
      const recentPayments = await Payment.find()
        .populate('associate', 'name')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      activities = [
        ...recentLeads.map(lead => ({
          type: 'lead',
          message: `New lead ${lead.name} assigned to ${lead.assignedTo?.name || 'Unassigned'}`,
          timestamp: lead.createdAt
        })),
        ...recentPayments.map(payment => ({
          type: 'payment',
          message: `Payment of ₹${payment.amount} from ${payment.customerName}`,
          timestamp: payment.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    } else {
      // Associate activities
      const recentLeads = await Lead.find({ assignedTo: req.user.id })
        .sort({ createdAt: -1 })
        .limit(5);

      const recentPayments = await Payment.find({ associate: req.user.id })
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      activities = [
        ...recentLeads.map(lead => ({
          type: 'lead',
          message: `New lead: ${lead.name} (${lead.status})`,
          timestamp: lead.createdAt
        })),
        ...recentPayments.map(payment => ({
          type: 'payment',
          message: `Payment: ₹${payment.amount} from ${payment.customerName}`,
          timestamp: payment.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    }

    res.json({
      success: true,
      data: activities
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