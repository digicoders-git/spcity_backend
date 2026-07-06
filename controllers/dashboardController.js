const dashboardService = require('../services/dashboardService');

class DashboardController {
  // Get dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const result = await dashboardService.getDashboardStats(req.user);
      res.json(result);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get leads trend data for charts
  async getLeadsTrend(req, res) {
    try {
      const { period = '7' } = req.query;
      const result = await dashboardService.getLeadsTrend(period, req.user);
      res.json(result);
    } catch (error) {
      console.error('Get leads trend error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get revenue trend data for charts (Admin only)
  async getRevenueTrend(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { period = '30' } = req.query;
      const result = await dashboardService.getRevenueTrend(period);
      res.json(result);
    } catch (error) {
      console.error('Get revenue trend error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get project status distribution (Admin only)
  async getProjectStatus(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const result = await dashboardService.getProjectStatus();
      res.json(result);
    } catch (error) {
      console.error('Get project status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get lead sources distribution
  async getLeadSources(req, res) {
    try {
      const result = await dashboardService.getLeadSources(req.user);
      res.json(result);
    } catch (error) {
      console.error('Get lead sources error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get recent activities
  async getRecentActivities(req, res) {
    try {
      const result = await dashboardService.getRecentActivities(req.user);
      res.json(result);
    } catch (error) {
      console.error('Get recent activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get associate performance data
  async getAssociatePerformance(req, res) {
    try {
      const result = await dashboardService.getAssociatePerformance(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Get associate performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = new DashboardController();