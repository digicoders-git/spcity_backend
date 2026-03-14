const associateService = require('../services/associateService');
const { validationResult } = require('express-validator');
const { createNotification } = require('./notificationController');

class AssociateController {
  // Get all associates (Admin only)
  async getAllAssociates(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const sponsorId = req.user.role === 'associate' ? req.user.id : null;
      const result = await associateService.getAllAssociates(page, limit, search, sponsorId);
      res.json(result);
    } catch (error) {
      console.error('Get associates error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Create new associate (Admin only)
  async createAssociate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const associateData = {
        ...req.body,
        createdBy: req.user.id
      };

      if (req.user.role === 'associate' && !associateData.sponsor) {
        associateData.sponsor = req.user.id;
      }

      const result = await associateService.createAssociate(associateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);

      if (result.success && result.data) {
        createNotification({
          userId: result.data._id,
          role: 'associate',
          title: 'Welcome to SP City!',
          message: `Your account has been created by ${req.user.name}. You can now login and start managing your leads.`,
          type: 'success',
          link: '/associate/profile'
        });
        
        createNotification({
          userId: null,
          role: 'admin',
          title: 'New Associate Created',
          message: `Associate ${result.data.name} has been added to the system.`,
          type: 'info',
          link: '/admin/associates'
        });
      }
    } catch (error) {
      console.error('Create associate error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update associate (Admin only)
  async updateAssociate(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await associateService.updateAssociate(req.params.id, req.body, req.user);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);

      if (result.success && result.data) {
        createNotification({
          userId: result.data._id,
          role: 'associate',
          title: 'Account Updated',
          message: 'Your account details have been updated by Admin.',
          type: 'info',
          link: '/associate/profile'
        });
      }
    } catch (error) {
      console.error('Update associate error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Change associate password (Admin only)
  async changeAssociatePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await associateService.changeAssociatePassword(req.params.id, req.body.newPassword, req.user);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Change associate password error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete associate (Admin only)
  async deleteAssociate(req, res) {
    try {
      const result = await associateService.deleteAssociate(req.params.id, req.user);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Delete associate error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get associate profile (Associate only)
  async getAssociateProfile(req, res) {
    try {
      const result = await associateService.getAssociateProfile(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Get associate profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update associate profile (Associate only)
  async updateAssociateProfile(req, res) {
    try {
      console.log('Update Associate Profile Triggered');
      const result = await associateService.updateAssociateProfile(req.user.id, req.body, req.files);
      res.json(result);
    } catch (error) {
      console.error('CRITICAL: Update associate profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }

  // Update associate status (Admin only)
  async updateAssociateStatus(req, res) {
    try {
      const { status } = req.body;
      
      if (!['Active', 'Inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Active or Inactive'
        });
      }

      const result = await associateService.updateAssociateStatus(req.params.id, status, req.user);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);

      if (result.success && result.data) {
        createNotification({
          userId: result.data._id,
          role: 'associate',
          title: `Account Status: ${status}`,
          message: `Your account status has been updated to ${status}.`,
          type: status === 'Active' ? 'success' : 'warning',
          link: '/associate/profile'
        });
      }
    } catch (error) {
      console.error('Update associate status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = new AssociateController();