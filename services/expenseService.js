const Expense = require('../models/Expense');
const User = require('../models/User');

class ExpenseService {
  async createExpense(expenseData, userId) {
    try {
      const expense = new Expense({
        ...expenseData,
        createdBy: userId
      });
      await expense.save();
      return { success: true, data: expense };
    } catch (error) {
      throw error;
    }
  }

  async getAllExpenses(filters = {}) {
    try {
      const { category, associate, lead, startDate, endDate, status, page = 1, limit = 10 } = filters;
      let query = {};

      if (category) query.category = category;
      if (associate) query.associate = associate;
      if (lead) query.lead = lead;
      if (status) query.status = status;

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const expenses = await Expense.find(query)
        .populate('associate', 'name email phone')
        .populate('lead', 'name phone')
        .populate('project', 'name')
        .populate('createdBy', 'name')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Expense.countDocuments(query);

      return { 
        success: true, 
        data: expenses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / (limit || 10)),
          total
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getAssociateAdvanceSummary(associateId) {
    try {
      const advances = await Expense.find({
        associate: associateId,
        category: 'Advance',
        status: 'Approved'
      });

      const totalAdvance = advances.reduce((sum, exp) => sum + exp.amount, 0);
      return { success: true, totalAdvance, details: advances };
    } catch (error) {
      throw error;
    }
  }

  async updateExpense(id, updateData) {
    try {
      const expense = await Expense.findByIdAndUpdate(id, updateData, { new: true });
      return { success: true, data: expense };
    } catch (error) {
      throw error;
    }
  }

  async deleteExpense(id) {
    try {
      await Expense.findByIdAndDelete(id);
      return { success: true, message: 'Expense deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ExpenseService();
