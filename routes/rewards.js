const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(rewardController.getAllRewards)
  .post(rewardController.createReward);

router.get('/my-rewards', rewardController.getMyRewards);

router.route('/:id')
  .put(rewardController.updateReward)
  .delete(rewardController.deleteReward);

module.exports = router;
