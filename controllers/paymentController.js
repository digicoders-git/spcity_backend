const paymentService = require('../services/paymentService');
const { validationResult } = require('express-validator');

class PaymentController {
  // Get all payments
  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = '', paymentType = '' } = req.query;
      const userId = req.user.role === 'associate' ? req.user.id : null;
      
      const result = await paymentService.getAllPayments(page, limit, search, status, paymentType, userId);
      res.json(result);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Create new payment
  async createPayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const paymentData = {
        ...req.body,
        associate: req.body.associate || req.user.id,
        createdBy: req.user.id
      };

      const result = await paymentService.createPayment(paymentData);
      res.status(201).json(result);
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update payment
  async updatePayment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await paymentService.updatePayment(req.params.id, req.body, req.user);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Update payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update payment status
  async updatePaymentStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await paymentService.updatePaymentStatus(req.params.id, req.body.status);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Update payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete payment
  async deletePayment(req, res) {
    try {
      const result = await paymentService.deletePayment(req.params.id, req.user);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Delete payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get associate commission
  async getAssociateCommission(req, res) {
    try {
      const result = await paymentService.getAssociateCommission(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Get associate commission error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get associate amounts
  async getAssociateAmounts(req, res) {
    try {
      const result = await paymentService.getAssociateAmounts(req.user.id);
      res.json(result);
    } catch (error) {
      console.error('Get associate amounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
}

module.exports = new PaymentController();