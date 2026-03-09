const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { auth, adminAuth } = require('../middleware/auth');

router.post('/', auth, adminAuth, expenseController.create);
router.get('/', auth, expenseController.getAll);
router.get('/advance-summary/:associateId', auth, expenseController.getAdvanceSummary);
router.put('/:id', auth, adminAuth, expenseController.update);
router.delete('/:id', auth, adminAuth, expenseController.delete);

module.exports = router;
