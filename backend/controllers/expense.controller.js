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
    // Normalize projectId: convert empty string to null for general expenses
    const projectId = req.body.projectId && req.body.projectId.trim() !== '' 
      ? req.body.projectId 
      : null;

    // Verify project exists only if projectId is provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if project is locked
      if (project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    const expenseData = {
      ...req.body,
      createdBy: req.user.id,
      // Set projectId to null if not provided (general expense)
      projectId: projectId
    };

    const expense = await Expense.create(expenseData);
    if (expense.projectId) {
      await expense.populate('projectId', 'projectCode projectName');
    }

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
    // Get existing expense to check its project
    const existingExpense = await Expense.findById(req.params.id);
    if (!existingExpense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    // Check if the existing expense's project is locked
    if (existingExpense.projectId) {
      const project = await Project.findById(existingExpense.projectId);
      if (project && project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    // Normalize projectId: convert empty string to null for general expenses
    if (req.body.projectId !== undefined) {
      req.body.projectId = req.body.projectId && req.body.projectId.trim() !== '' 
        ? req.body.projectId 
        : null;
    }

    // Verify project exists only if projectId is provided and not null
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if new project is locked
      if (project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (expense.projectId) {
      await expense.populate('projectId', 'projectCode projectName');
    }

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
    // Get expense to check if its project is locked
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    // Check if project is locked
    if (expense.projectId) {
      const project = await Project.findById(expense.projectId);
      if (project && project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

