const express = require('express');
const router = express.Router();
const rewardController = require('../controllers/rewardController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/', auth, adminAuth, rewardController.create);
router.get('/', auth, rewardController.getAll);
router.get('/my-rewards', auth, rewardController.getMyRewards);
router.put('/:id', auth, adminAuth, rewardController.update);
router.delete('/:id', auth, adminAuth, rewardController.delete);

module.exports = router;
