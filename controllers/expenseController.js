const expenseService = require('../services/expenseService');

class ExpenseController {
  async create(req, res) {
    try {
      const result = await expenseService.createExpense(req.body, req.user.id);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const result = await expenseService.getAllExpenses(req.query);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAdvanceSummary(req, res) {
    try {
      const { associateId } = req.params;
      const result = await expenseService.getAssociateAdvanceSummary(associateId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const result = await expenseService.updateExpense(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await expenseService.deleteExpense(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ExpenseController();
