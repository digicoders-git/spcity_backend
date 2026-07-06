const mongoose = require('mongoose');
const User = require('../models/User');
const Payment = require('../models/Payment');

const LIFETIME_REWARDS = [
  { id: 1, target: '3 Lakh', targetNum: 300000, rewardName: 'Mobile', price: '7,500', image: '/rewards/reward_mobile_1783332860275.png' },
  { id: 2, target: '10 Lakh', targetNum: 1000000, rewardName: 'Bike', price: '25,000', image: '/rewards/reward_bike_1783332873305.png' },
  { id: 3, target: '40 Lakh', targetNum: 4000000, rewardName: 'Alto Car', price: '1,00,000', image: '/rewards/reward_alto_1783332883817.png' },
  { id: 4, target: '60 Lakh', targetNum: 6000000, rewardName: 'Celerio Car', price: '1,50,000', image: '/rewards/reward_celerio_1783332897098.png' },
  { id: 5, target: '1 Crore', targetNum: 10000000, rewardName: 'Swift Car', price: '2,00,000', image: '/rewards/reward_swift_1783332909722.png' },
  { id: 6, target: '1.5 Crore', targetNum: 15000000, rewardName: 'Triber Car', price: '3,00,000', image: '/rewards/reward_triber_1783332923103.png' },
  { id: 7, target: '2 Crore', targetNum: 20000000, rewardName: 'Kia Sonet', price: '4,00,000', image: '/rewards/reward_sonet_1783332933428.png' },
  { id: 8, target: '5 Crore', targetNum: 50000000, rewardName: 'Kia Carens', price: '5,00,000', image: '/rewards/reward_carens_1783332943480.png' },
  { id: 9, target: '10 Crore', targetNum: 100000000, rewardName: 'Safari', price: '10,00,000', image: '/rewards/reward_safari_1783332953873.png' },
  { id: 10, target: '20 Crore', targetNum: 200000000, rewardName: 'Fortuner', price: '20,00,000', image: '/rewards/reward_fortuner_1783332963892.png' },
  { id: 11, target: '40 Crore', targetNum: 400000000, rewardName: 'Bungalow', price: '30,00,000', image: '/rewards/reward_bungalow_1783332976271.png' }
];

class RewardService {
  async calculateLifetimeRewards(associateId) {
    try {
      const assocObjectId = new mongoose.Types.ObjectId(associateId);

      // 1. Get all direct referrals (Legs)
      const directReferrals = await User.find({ createdBy: assocObjectId }, '_id name');

      const legStats = [];

      // 2. For each leg, find total business recursively
      for (const referral of directReferrals) {
        const hierarchy = await User.aggregate([
          { $match: { _id: referral._id } },
          {
            $graphLookup: {
              from: 'users',
              startWith: '$_id',
              connectFromField: '_id',
              connectToField: 'createdBy',
              as: 'descendants'
            }
          }
        ]);

        if (hierarchy.length > 0) {
          const userIdsInLeg = [referral._id, ...hierarchy[0].descendants.map(d => d._id)];

          const businessResult = await Payment.aggregate([
            {
              $match: {
                associate: { $in: userIdsInLeg },
                status: 'Received'
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' }
              }
            }
          ]);

          const totalBusiness = businessResult.length > 0 ? businessResult[0].totalAmount : 0;
          
          if (totalBusiness > 0) {
            legStats.push({
              legId: referral._id,
              legName: referral.name,
              totalBusiness: totalBusiness
            });
          }
        }
      }

      // 3. Get Self Business (acts as its own leg)
      const selfBusinessResult = await Payment.aggregate([
        {
          $match: {
            associate: assocObjectId,
            status: 'Received'
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const selfBusiness = selfBusinessResult.length > 0 ? selfBusinessResult[0].totalAmount : 0;
      if (selfBusiness > 0) {
        legStats.push({
          legId: 'self',
          legName: 'Self (Direct Business)',
          totalBusiness: selfBusiness
        });
      }

      // 4. Sort legs by business descending
      legStats.sort((a, b) => b.totalBusiness - a.totalBusiness);

      const strongLeg = legStats.length > 0 ? legStats[0] : null;
      let otherLegsTotal = 0;
      for (let i = 1; i < legStats.length; i++) {
        otherLegsTotal += legStats[i].totalBusiness;
      }

      const strongLegBusiness = strongLeg ? strongLeg.totalBusiness : 0;
      const strongLegName = strongLeg ? strongLeg.legName : 'None';

      // 5. Evaluate rewards
      const rewardsProgress = LIFETIME_REWARDS.map(reward => {
        const maxStrongLegAllowed = reward.targetNum * 0.60; // Max 60% from strong leg
        const requiredOtherLegs = reward.targetNum * 0.40; // At least 40% from other legs
        
        // Capping the strong leg's contribution at 60% of the target
        const strongLegContributed = Math.min(strongLegBusiness, maxStrongLegAllowed);
        
        // Other legs can theoretically contribute the rest
        const otherLegsContributed = otherLegsTotal; 
        
        const totalApplicable = Math.min(strongLegContributed + otherLegsContributed, reward.targetNum);
        const percentage = Math.floor((totalApplicable / reward.targetNum) * 100);
        const isAchieved = totalApplicable >= reward.targetNum;

        return {
          ...reward,
          achievedBusiness: totalApplicable,
          percentage: percentage,
          isAchieved: isAchieved,
          legDetails: {
            strongLegName: strongLegName,
            strongLegTotal: strongLegBusiness,
            strongLegContributed: strongLegContributed,
            strongLegMaxAllowed: maxStrongLegAllowed,
            otherLegsTotal: otherLegsTotal,
            otherLegsRequired: requiredOtherLegs,
            allLegs: legStats.map(l => ({
              name: l.legName,
              business: l.totalBusiness,
              percentage: ((l.totalBusiness / reward.targetNum) * 100).toFixed(1)
            }))
          }
        };
      });

      return {
        success: true,
        data: {
          totalLegs: legStats.length,
          legs: legStats, // for debugging or admin view
          rewards: rewardsProgress
        }
      };

    } catch (error) {
      console.error('Error calculating lifetime rewards:', error);
      return {
        success: false,
        message: 'Failed to calculate rewards'
      };
    }
  }
}

module.exports = new RewardService();
