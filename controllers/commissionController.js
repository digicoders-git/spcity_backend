const CommissionService = require('../services/commissionService');
const Commission = require('../models/Commission');
const Withdrawal = require('../models/Withdrawal');

class CommissionController {

  // ================= ASSOCIATE COMMISSION ROUTES =================

  // Get all commissions for logged-in associate
  async getMyCommissions(req, res) {
    try {
      const commissions = await Commission.find({ associate: req.user.id })
        .populate('payment', 'customerName amount paymentType')
        .populate('project', 'name location')
        .sort({ earnedDate: -1 });
      
      res.json({ 
        success: true, 
        data: commissions,
        message: `Found ${commissions.length} commissions`
      });
    } catch (error) {
      console.error('Get commissions error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get commission stats for associate
  async getMyStats(req, res) {
    try {
      const result = await CommissionService.getAssociateStats(req.user.id);
      
      if (!result.success) {
        return res.status(500).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get withdrawal history for associate
  async getMyWithdrawals(req, res) {
    try {
      const withdrawals = await Withdrawal.find({ associate: req.user.id })
        .sort({ createdAt: -1 });
      
      res.json({ 
        success: true, 
        data: withdrawals,
        message: `Found ${withdrawals.length} withdrawal requests`
      });
    } catch (error) {
      console.error('Get withdrawals error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Request withdrawal
  async requestWithdrawal(req, res) {
    try {
      const { amount, method, accountDetails, notes } = req.body;
      
      // Validate required fields
      if (!amount || !method || !accountDetails) {
        return res.status(400).json({
          success: false,
          message: 'Amount, method, and account details are required'
        });
      }
      
      // Validate minimum withdrawal amount
      if (amount < 100) {
        return res.status(400).json({
          success: false,
          message: 'Minimum withdrawal amount is ₹100'
        });
      }
      
      // Check available balance
      const statsResult = await CommissionService.getAssociateStats(req.user.id);
      if (!statsResult.success) {
        return res.status(500).json(statsResult);
      }
      
      const { availableBalance } = statsResult.data;
      
      if (amount > availableBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Available: ₹${availableBalance.toLocaleString()}`
        });
      }
      
      const withdrawal = await Withdrawal.create({
        associate: req.user.id,
        amount,
        method,
        accountDetails,
        notes
      });
      
      res.status(201).json({ 
        success: true, 
        message: 'Withdrawal request submitted successfully. It will be processed within 2-3 business days.',
        data: withdrawal 
      });
    } catch (error) {
      console.error('Request withdrawal error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // ================= ADMIN COMMISSION ROUTES =================

  // Get all withdrawal requests (Admin only)
  async getAllWithdrawals(req, res) {
    try {
      const { page = 1, limit = 10, status = '' } = req.query;
      
      const result = await CommissionService.getAllWithdrawals(page, limit, status);
      
      if (!result.success) {
        return res.status(500).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Get all withdrawals error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Process withdrawal request (Admin only)
  async processWithdrawal(req, res) {
    try {
      const { status, notes } = req.body;
      
      if (!['Completed', 'Failed', 'Cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Completed, Failed, or Cancelled'
        });
      }
      
      const result = await CommissionService.processWithdrawal(
        req.params.id,
        req.user.id,
        status,
        notes
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Process withdrawal error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Generate commission from payment
  async generateCommission(req, res) {
    try {
      const result = await CommissionService.generateCommissionFromPayment(req.params.paymentId);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json({
        success: true,
        message: 'Commission generated successfully',
        data: result.data
      });
    } catch (error) {
      console.error('Generate commission error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get commission dashboard stats (Admin)
  async getDashboardStats(req, res) {
    try {
      const totalCommissions = await Commission.countDocuments();
      const totalCommissionAmount = await Commission.aggregate([
        { $group: { _id: null, total: { $sum: '$commissionAmount' } } }
      ]);
      
      const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'Pending' });
      const pendingWithdrawalAmount = await Withdrawal.aggregate([
        { $match: { status: 'Pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const completedWithdrawals = await Withdrawal.countDocuments({ status: 'Completed' });
      const completedWithdrawalAmount = await Withdrawal.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      res.json({
        success: true,
        data: {
          totalCommissions,
          totalCommissionAmount: totalCommissionAmount[0]?.total || 0,
          pendingWithdrawals,
          pendingWithdrawalAmount: pendingWithdrawalAmount[0]?.total || 0,
          completedWithdrawals,
          completedWithdrawalAmount: completedWithdrawalAmount[0]?.total || 0
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new CommissionController();