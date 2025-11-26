import Expense from '../models/Expense.model.js';
import Project from '../models/Project.model.js';

/**
 * @route   GET /api/expenses
 * @desc    Get all expense records
 * @access  Private
 */
export const getAllExpenses = async (req, res) => {
  try {
    const { projectId, startDate, endDate, category, status } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
      .populate('projectId', 'projectCode projectName')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json({ expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/expenses/:id
 * @desc    Get expense by ID
 * @access  Private
 */
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('projectId', 'projectCode projectName')
      .populate('createdBy', 'firstName lastName');

    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    res.json({ expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/expenses
 * @desc    Create expense record
 * @access  Private
 */
export const createExpense = async (req, res) => {
  try {
    // Verify project exists
    const project = await Project.findById(req.body.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const expenseData = {
      ...req.body,
      createdBy: req.user.id
    };

    const expense = await Expense.create(expenseData);
    await expense.populate('projectId', 'projectCode projectName');

    res.status(201).json({ message: 'Expense record created successfully', expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update expense record
 * @access  Private
 */
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'projectCode projectName');

    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    res.json({ message: 'Expense record updated successfully', expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete expense record
 * @access  Private
 */
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }
    res.json({ message: 'Expense record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

