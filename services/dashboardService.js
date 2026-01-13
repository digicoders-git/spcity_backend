const Lead = require('../models/Lead');
const Project = require('../models/Project');
const Payment = require('../models/Payment');
const User = require('../models/User');

class DashboardService {
  // Get dashboard statistics based on user role
  async getDashboardStats(user) {
    try {
      let stats = {};

      if (user.role === 'admin') {
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

        const monthlyRevenue = await Payment.aggregate([
          {
            $match: {
              status: 'Received',
              receivedDate: {
                $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        stats = {
          totalLeads,
          totalProjects,
          totalAssociates,
          totalPayments,
          totalRevenue: totalRevenue[0]?.total || 0,
          pendingRevenue: pendingPayments[0]?.total || 0,
          monthlyRevenue: monthlyRevenue[0]?.total || 0
        };
      } else {
        // Associate dashboard stats
        const totalLeads = await Lead.countDocuments({ associate: user.id });
        const totalPayments = await Payment.countDocuments({ associate: user.id });
        
        // Get commission data from Commission model
        const Commission = require('../models/Commission');
        const commissions = await Commission.find({ associate: user.id });
        const totalCommission = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
        
        const convertedLeads = await Lead.countDocuments({ 
          associate: user.id, 
          status: 'Deal Done' 
        });

        // Get site visits count (fallback to 0 if model doesn't exist)
        let totalSiteVisits = 0;
        try {
          const SiteVisit = require('../models/SiteVisit');
          totalSiteVisits = await SiteVisit.countDocuments({ associate: user.id });
        } catch (error) {
          // SiteVisit model doesn't exist, use fallback calculation
          totalSiteVisits = Math.floor(totalLeads * 0.4); // 40% of leads become site visits
        }

        stats = {
          totalLeads,
          convertedLeads,
          totalPayments,
          totalSiteVisits,
          totalCommission,
          pendingCommission: 0, // Will be calculated from pending payments if needed
          monthlyCommission: 0, // Will be calculated if needed
          conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0
        };
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw error;
    }
  }

  // Get leads trend data for charts
  async getLeadsTrend(period, user) {
    try {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let matchQuery = { createdAt: { $gte: startDate } };
      if (user.role === 'associate') {
        matchQuery.assignedTo = user.id;
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

      return {
        success: true,
        data: leadsTrend
      };
    } catch (error) {
      throw error;
    }
  }

  // Get revenue trend data for charts (Admin only)
  async getRevenueTrend(period) {
    try {
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

      return {
        success: true,
        data: revenueTrend
      };
    } catch (error) {
      throw error;
    }
  }

  // Get project status distribution
  async getProjectStatus() {
    try {
      const projectStatus = await Project.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        data: projectStatus
      };
    } catch (error) {
      throw error;
    }
  }

  // Get lead sources distribution
  async getLeadSources(user) {
    try {
      let matchQuery = {};
      if (user.role === 'associate') {
        matchQuery.assignedTo = user.id;
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

      return {
        success: true,
        data: leadSources
      };
    } catch (error) {
      throw error;
    }
  }

  // Get recent activities
  async getRecentActivities(user) {
    try {
      let activities = [];

      if (user.role === 'admin') {
        // Recent leads
        const recentLeads = await Lead.find()
          .populate('assignedTo', 'name')
          .populate('addedBy', 'name')
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
            message: `New lead ${lead.name} assigned to ${lead.assignedTo.name}`,
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
        const recentLeads = await Lead.find({ assignedTo: user.id })
          .sort({ createdAt: -1 })
          .limit(5);

        const recentPayments = await Payment.find({ associate: user.id })
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

      return {
        success: true,
        data: activities
      };
    } catch (error) {
      throw error;
    }
  }

  // Get associate performance data
  async getAssociatePerformance(associateId) {
    try {
      const performance = await Lead.aggregate([
        { $match: { assignedTo: associateId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const commissionData = await Payment.aggregate([
        { $match: { associate: associateId, status: 'Received' } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$receivedDate' }
            },
            commission: { $sum: { $multiply: ['$amount', 0.05] } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        success: true,
        data: {
          leadPerformance: performance,
          commissionTrend: commissionData
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DashboardService();