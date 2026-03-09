const Commission = require('../models/Commission');
const Payment = require('../models/Payment');
const Project = require('../models/Project');
const Withdrawal = require('../models/Withdrawal');

const RANKS = [
  { name: 'STAR', min: 0, max: 500000, rate: 5 },
  { name: 'GOLD', min: 500000, max: 5000000, rate: 6 },
  { name: 'PLATINUM', min: 4000000, max: 10000000, rate: 7 },
  { name: 'RUBY', min: 10000000, max: 20000000, rate: 8 },
  { name: 'EMERALD', min: 20000000, max: 50000000, rate: 9 },
  { name: 'DIAMOND', min: 50000000, max: 100000000, rate: 10 },
  { name: 'DOUBLE DIAMOND', min: 100000000, max: 150000000, rate: 11 },
  { name: 'CROWN', min: 150000000, max: 200000000, rate: 12 },
  { name: 'EX CROWN', min: 200000000, max: 300000000, rate: 13 },
  { name: 'SUPER CROWN', min: 300000000, max: 500000000, rate: 14 },
  { name: 'ROYAL CROWN', min: 500000000, max: Infinity, rate: 15 }
];

const getRankInfo = (sales) => {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (sales >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
};

class CommissionService {

  // Update total sales and rank for associate and all ancestors
  static async updateAssociateRank(associateId, saleAmount) {
    try {
      let currentId = associateId;
      const User = require('../models/User');

      while (currentId) {
        const user = await User.findById(currentId);
        if (!user || user.role !== 'associate') break;

        // Update total sales
        user.totalSales = (user.totalSales || 0) + saleAmount;

        // Check and update rank
        const newRankInfo = getRankInfo(user.totalSales);
        user.rank = newRankInfo.name;

        await user.save();

        // Check for automated rewards (60:40 rule)
        const rewardService = require('./rewardService');
        await rewardService.processAutomatedRewards(user._id);

        // Move up
        currentId = user.createdBy;
      }
    } catch (error) {
      console.error('Update Rank Error:', error);
    }
  }

  // Generate commission when payment is received (Differential Rank Based)
  static async generateCommissionFromPayment(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('project');
      
      if (!payment || payment.status !== 'Received') {
        return { success: false, message: 'Payment not found or not received' };
      }

      // 1. Update Sales and Ranks first (Team Sale logic)
      await this.updateAssociateRank(payment.associate, payment.amount);

      // 2. Check if any commission already exists
      if (payment.commissionGenerated) {
        return { success: false, message: 'Commissions already generated' };
      }

      const project = payment.project;
      const commissions = [];
      let currentAssociateId = payment.associate;
      let alreadyDistributedRate = 0;
      let level = 1;

      // 3. Differential Commission Distribution
      while (currentAssociateId && alreadyDistributedRate < 15) {
        const currentAssociate = await require('../models/User').findById(currentAssociateId);
        if (!currentAssociate || currentAssociate.role !== 'associate') break;

        // Determine the rate: priority to custom commissionRate, fallback to rank-based rate
        const rankInfo = getRankInfo(currentAssociate.totalSales);
        let associateRate = rankInfo.rate;
        let rankName = rankInfo.name;

        if (currentAssociate.commissionRate > 0) {
          associateRate = currentAssociate.commissionRate;
          // Map rate back to rank name if it matches standard ranks
          const standardRank = RANKS.find(r => r.rate === associateRate);
          rankName = standardRank ? standardRank.name : 'CUSTOM';
        }
        
        // Calculate gap/differential commission
        if (associateRate > alreadyDistributedRate) {
          const gapRate = associateRate - alreadyDistributedRate;
          const commissionAmount = (payment.amount * gapRate) / 100;

          const commission = await Commission.create({
            associate: currentAssociateId,
            payment: paymentId,
            project: project._id,
            saleAmount: payment.amount,
            commissionRate: gapRate,
            commissionAmount,
            associateRank: rankName,
            level,
            status: 'Earned'
          });

          commissions.push(commission);
          alreadyDistributedRate = associateRate; // Update distributed rate
        }

        currentAssociateId = currentAssociate.createdBy;
        level++;
      }

      // Mark payment as commission generated
      payment.commissionGenerated = true;
      await payment.save();

      return { success: true, count: commissions.length, data: commissions };
    } catch (error) {
      console.error('Commission Generation Error:', error);
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
        if (result.success && Array.isArray(result.data)) {
          commissions.push(...result.data);
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