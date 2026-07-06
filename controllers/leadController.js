const leadService = require('../services/leadService');
const { validationResult } = require('express-validator');

class LeadController {
  // Get all leads
  async getAllLeads(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '', source = '' } = req.query;
      const userId = req.user.role === 'associate' ? req.user.id : null;
      
      const result = await leadService.getAllLeads(page, limit, search, status, source, userId);
      res.json(result);
    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Create new lead
  async createLead(req, res) {
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
        assignedTo: req.body.assignedTo || req.user.id,
        addedBy: req.user.id
      };

      const result = await leadService.createLead(leadData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update lead
  async updateLead(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await leadService.updateLead(req.params.id, req.body, req.user);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Update lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete lead
  async deleteLead(req, res) {
    try {
      const result = await leadService.deleteLead(req.params.id, req.user);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Delete lead error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get lead statistics
  async getLeadStats(req, res) {
    try {
      const userId = req.user.role === 'associate' ? req.user.id : null;
      const result = await leadService.getLeadStats(userId);
      res.json(result);
    } catch (error) {
      console.error('Get lead stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get single lead
  async getLeadById(req, res) {
    try {
      const result = await leadService.getLeadById(req.params.id, req.user);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Get lead by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = new LeadController();