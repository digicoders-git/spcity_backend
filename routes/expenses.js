const express = require('express');
const {
  getExpenses,
  getAdvanceSummary,
  createExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All expense routes require authentication

router
  .route('/')
  .get(getExpenses)
  .post(createExpense);

router
  .route('/advance-summary/:associateId')
  .get(getAdvanceSummary);

router
  .route('/:id')
  .put(updateExpense)
  .delete(deleteExpense);

module.exports = router;
