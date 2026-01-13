const Commission = require('../models/Commission');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Withdrawal = require('../models/Withdrawal');

class CommissionService {
  
  // Generate commission when payment is received
  static async generateCommissionFromPayment(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('project')
        .populate('associate');
      
      if (!payment || payment.status !== 'Received') {
        return { success: false, message: 'Payment not found or not received' };
      }

      // Check if commission already exists
      const existingCommission = await Commission.findOne({ payment: paymentId });
      if (existingCommission) {
        return { success: false, message: 'Commission already generated for this payment' };
      }

      const project = payment.project;
      const commissionRate = project.commissionRate || 2; // Default 2%
      const commissionAmount = (payment.amount * commissionRate) / 100;

      const commission = await Commission.create({
        associate: payment.associate,
        payment: paymentId,
        project: project._id,
        saleAmount: payment.amount,
        commissionRate,
        commissionAmount,
        status: 'Earned'
      });

      return { success: true, data: commission };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Approve project completion and generate commissions
  static async approveProjectCompletion(projectId, adminId) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        return { success: false, message: 'Project not found' };
      }

      if (project.status === 'Completed') {
        return { success: false, message: 'Project already completed' };
      }

      // Update project status
      await Project.findByIdAndUpdate(projectId, {
        status: 'Completed',
        approvedBy: adminId,
        approvedAt: new Date()
      });

      // Generate commissions for all received payments in this project
      const payments = await Payment.find({ 
        project: projectId, 
        status: 'Received' 
      }).populate('associate');

      const commissions = [];
      for (const payment of payments) {
        const result = await this.generateCommissionFromPayment(payment._id);
        if (result.success) {
          commissions.push(result.data);
        }
      }

      return { 
        success: true, 
        message: `Project approved and ${commissions.length} commissions generated`,
        data: { project, commissions }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get commission stats for associate
  static async getAssociateStats(associateId) {
    try {
      const commissions = await Commission.find({ associate: associateId });
      const withdrawals = await Withdrawal.find({ associate: associateId });
      
      const totalEarned = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
      const totalWithdrawn = withdrawals
        .filter(w => w.status === 'Completed')
        .reduce((sum, w) => sum + w.amount, 0);
      const pendingWithdrawal = withdrawals
        .filter(w => w.status === 'Pending')
        .reduce((sum, w) => sum + w.amount, 0);
      const availableBalance = totalEarned - totalWithdrawn - pendingWithdrawal;
      
      return {
        success: true,
        data: {
          totalCommissions: commissions.length,
          totalEarned,
          totalWithdrawn,
          pendingWithdrawal,
          availableBalance,
          avgCommission: commissions.length > 0 ? totalEarned / commissions.length : 0
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Process withdrawal request
  static async processWithdrawal(withdrawalId, adminId, status, notes = '') {
    try {
      const withdrawal = await Withdrawal.findById(withdrawalId)
        .populate('associate', 'name email');
      
      if (!withdrawal) {
        return { success: false, message: 'Withdrawal request not found' };
      }

      if (withdrawal.status !== 'Pending') {
        return { success: false, message: 'Withdrawal already processed' };
      }

      // Update withdrawal status
      withdrawal.status = status;
      withdrawal.processedBy = adminId;
      withdrawal.processedDate = new Date();
      withdrawal.notes = notes;
      await withdrawal.save();

      return {
        success: true,
        message: `Withdrawal ${status.toLowerCase()} successfully`,
        data: withdrawal
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get all withdrawal requests (Admin)
  static async getAllWithdrawals(page = 1, limit = 10, status = '') {
    try {
      const query = status ? { status } : {};
      const skip = (page - 1) * limit;
      
      const withdrawals = await Withdrawal.find(query)
        .populate('associate', 'name email phone')
        .populate('processedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Withdrawal.countDocuments(query);
      
      return {
        success: true,
        data: {
          withdrawals,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = CommissionService;