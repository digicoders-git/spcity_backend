const associateService = require('../services/associateService');
const { validationResult } = require('express-validator');

class AssociateController {
  // Get all associates (Admin only)
  async getAllAssociates(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const result = await associateService.getAllAssociates(page, limit, search);
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

      const result = await associateService.createAssociate(associateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
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

      const result = await associateService.updateAssociate(req.params.id, req.body);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
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

      const result = await associateService.changeAssociatePassword(req.params.id, req.body.newPassword);

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
      const result = await associateService.deleteAssociate(req.params.id);

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
      const result = await associateService.updateAssociateProfile(req.user.id, req.body);
      res.json(result);
    } catch (error) {
      console.error('Update associate profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
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

      const result = await associateService.updateAssociateStatus(req.params.id, status);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
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