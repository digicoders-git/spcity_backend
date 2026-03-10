const rewardService = require('../services/rewardService');
const { createNotification } = require('./notificationController');

class RewardController {
  async create(req, res) {
    try {
      const result = await rewardService.createReward(req.body, req.user.id);
      res.status(201).json(result);

      if (result.success && result.data) {
        const associateId = result.data.associate;
        createNotification({
          userId: associateId,
          role: 'associate',
          title: 'New Reward Achieved! 🎉',
          message: `Congratulations! You have received a new reward: "${result.data.title}".`,
          type: 'success',
          link: '/associate/rewards'
        });
        
        createNotification({
          userId: null,
          role: 'admin',
          title: 'Reward Issued',
          message: `A reward has been issued to an associate.`,
          type: 'info',
          link: '/admin/rewards'
        });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const result = await rewardService.getAllRewards(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyRewards(req, res) {
    try {
      const result = await rewardService.getAssociateRewards(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await rewardService.updateReward(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await rewardService.deleteReward(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new RewardController();
