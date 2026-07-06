const Reward = require('../models/Reward');

class RewardController {
  // Get all rewards with filtering
  async getAllRewards(req, res) {
    try {
      const { month, year, associate } = req.query;
      const query = {};

      if (month) query.month = month;
      if (year) query.year = year;
      if (associate) query.associate = associate;

      // If requested by an associate, they can only see their own rewards
      if (req.user && req.user.role === 'associate') {
        query.associate = req.user.id;
      }

      const rewards = await Reward.find(query)
        .populate('associate', 'name username')
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: rewards
      });
    } catch (error) {
      console.error('Get rewards error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching rewards'
      });
    }
  }

  // Get my rewards (for associates)
  async getMyRewards(req, res) {
    try {
      const rewards = await Reward.find({ associate: req.user.id })
        .populate('associate', 'name username')
        .sort({ createdAt: -1 });

      const totalRewardAmount = rewards.reduce((sum, reward) => sum + reward.amount, 0);

      res.json({
        success: true,
        data: rewards,
        totalRewardAmount
      });
    } catch (error) {
      console.error('Get my rewards error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching your rewards'
      });
    }
  }

  // Create a new reward
  async createReward(req, res) {
    try {
      const rewardData = {
        ...req.body,
        createdBy: req.user.id
      };

      const newReward = await Reward.create(rewardData);

      // Populate associate name for the response
      const populatedReward = await Reward.findById(newReward._id).populate('associate', 'name username');

      res.status(201).json({
        success: true,
        data: populatedReward,
        message: 'Reward created successfully'
      });
    } catch (error) {
      console.error('Create reward error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating reward'
      });
    }
  }

  // Update a reward
  async updateReward(req, res) {
    try {
      const reward = await Reward.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate('associate', 'name username');

      if (!reward) {
        return res.status(404).json({
          success: false,
          message: 'Reward not found'
        });
      }

      res.json({
        success: true,
        data: reward,
        message: 'Reward updated successfully'
      });
    } catch (error) {
      console.error('Update reward error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating reward'
      });
    }
  }

  // Delete a reward
  async deleteReward(req, res) {
    try {
      const reward = await Reward.findById(req.params.id);

      if (!reward) {
        return res.status(404).json({
          success: false,
          message: 'Reward not found'
        });
      }

      await reward.deleteOne();

      res.json({
        success: true,
        message: 'Reward deleted successfully'
      });
    } catch (error) {
      console.error('Delete reward error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting reward'
      });
    }
  }
}

module.exports = new RewardController();
