const Reward = require('../models/Reward');
const User = require('../models/User');

class RewardService {
  async createReward(rewardData, adminId) {
    try {
      const reward = new Reward({
        ...rewardData,
        createdBy: adminId
      });
      await reward.save();
      return { success: true, data: reward };
    } catch (error) {
      throw error;
    }
  }

  async getAllRewards(filters = {}) {
    try {
      const { associate, month, year, status } = filters;
      let query = {};

      if (associate) query.associate = associate;
      if (month) query.month = month;
      if (year) query.year = year;
      if (status) query.status = status;

      const rewards = await Reward.find(query)
        .populate('associate', 'name email phone')
        .populate('createdBy', 'name')
        .sort({ date: -1 });

      return { success: true, data: rewards };
    } catch (error) {
      throw error;
    }
  }

  async getAssociateRewards(associateId) {
    try {
      const rewards = await Reward.find({ associate: associateId })
        .populate('createdBy', 'name')
        .sort({ date: -1 });

      const totalRewardAmount = rewards.reduce((sum, r) => sum + r.amount, 0);

      return { 
        success: true, 
        data: rewards,
        totalRewardAmount 
      };
    } catch (error) {
      throw error;
    }
  }

  async updateReward(id, updateData) {
    try {
      const reward = await Reward.findByIdAndUpdate(id, updateData, { new: true });
      return { success: true, data: reward };
    } catch (error) {
      throw error;
    }
  }

  async deleteReward(id) {
    try {
      await Reward.findByIdAndDelete(id);
      return { success: true, message: 'Reward deleted successfully' };
    } catch (error) {
      throw error;
    }
  }

  async processAutomatedRewards(userId) {
    try {
      const User = require('../models/User');
      const REWARD_TARGETS = require('../config/rewardTargets');
      
      const user = await User.findById(userId);
      if (!user || user.role !== 'associate') return;

      // Find direct children (Legs)
      const children = await User.find({ createdBy: userId });
      if (children.length < 2) return; // Rule: Must have at least 2 logs (legs)

      // Calculate leg volumes
      // Note: child.totalSales already includes their entire downline sales
      const legVolumes = children.map(child => child.totalSales || 0);
      legVolumes.sort((a, b) => b - a); // Strongest leg first

      const strongLeg = legVolumes[0];
      const otherLegsTotal = legVolumes.slice(1).reduce((sum, v) => sum + v, 0);
      const totalTeamBusiness = strongLeg + otherLegsTotal;

      for (const target of REWARD_TARGETS) {
        // Check if already rewarded for this level
        const existing = await Reward.findOne({ associate: userId, rewardLevel: target.level });
        if (existing) continue;

        // 60:40 Distribution Rule:
        // 1. Total business must meet target
        // 2. Minimum 40% of target must come from "Other Legs" (all legs except the strongest)
        const requiredFromOthers = target.totalTarget * 0.4;
        
        if (totalTeamBusiness >= target.totalTarget && otherLegsTotal >= requiredFromOthers) {
          // Find an admin to act as creator or use a system ID
          const admin = await User.findOne({ role: 'admin' });
          
          const newReward = new Reward({
            associate: userId,
            title: target.title,
            amount: target.rewardValue,
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear().toString(),
            rewardLevel: target.level,
            description: `Automated Performance Reward (${target.title}). Target: ${target.totalTarget}, Distribution achieved.`,
            createdBy: admin ? admin._id : userId, // Fallback to self if no admin (shouldn't happen)
            status: 'Paid'
          });
          
          await newReward.save();
          console.log(`Auto-Reward Level ${target.level} granted to Associate: ${user.name}`);
        }
      }
    } catch (error) {
      console.error('Error in automated reward processing:', error);
    }
  }
}

module.exports = new RewardService();
