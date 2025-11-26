import express from 'express';
import { body } from 'express-validator';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all expenses
router.get('/', getAllExpenses);

// Get expense by ID
router.get('/:id', getExpenseById);

// Create expense
router.post(
  '/',
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('expenseCode').trim().notEmpty().withMessage('Expense code is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('date').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  createExpense
);

// Update expense
router.put(
  '/:id',
  [
    body('amount').optional().isFloat({ min: 0 }),
    body('date').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  updateExpense
);

// Delete expense
router.delete('/:id', deleteExpense);

export default router;

