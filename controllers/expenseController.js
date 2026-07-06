const Expense = require('../models/Expense');

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { category, status, startDate, endDate, associate, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (associate) filter.associate = associate;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // If associate, only see their own expenses
    if (req.user.role === 'associate') {
      filter.createdBy = req.user.id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const expenses = await Expense.find(filter)
      .populate('associate', 'name email username')
      .populate('lead', 'name phone')
      .populate('project', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Expense.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    
    // If role is associate, ensure they can only add expense for themselves
    if (req.user.role === 'associate') {
      req.body.associate = req.user.id;
    }

    const expense = await Expense.create(req.body);

    const populatedExpense = await Expense.findById(expense._id)
      .populate('associate', 'name')
      .populate('lead', 'name')
      .populate('project', 'name');

    res.status(201).json({
      success: true,
      data: populatedExpense
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Only admin can update status
    if (req.user.role === 'associate' && req.body.status && req.body.status !== expense.status) {
      return res.status(403).json({ success: false, message: 'Associates cannot change expense status' });
    }

    // Associates can only update their own pending expenses
    if (req.user.role === 'associate') {
      if (expense.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this expense' });
      }
      if (expense.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Cannot edit processed expenses' });
      }
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('associate', 'name')
      .populate('lead', 'name')
      .populate('project', 'name');

    res.status(200).json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (req.user.role === 'associate') {
      if (expense.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this expense' });
      }
      if (expense.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Cannot delete processed expenses' });
      }
    }

    await expense.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get advance summary for an associate
// @route   GET /api/expenses/advance-summary/:associateId
// @access  Private
exports.getAdvanceSummary = async (req, res) => {
  try {
    const expenses = await Expense.find({
      associate: req.params.associateId,
      category: 'Advance',
      status: 'Approved'
    });

    const totalAdvance = expenses.reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
      success: true,
      totalAdvance
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
