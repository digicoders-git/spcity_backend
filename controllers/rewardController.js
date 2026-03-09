const rewardService = require('../services/rewardService');

class RewardController {
  async create(req, res) {
    try {
      const result = await rewardService.createReward(req.body, req.user.id);
      res.status(201).json(result);
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
