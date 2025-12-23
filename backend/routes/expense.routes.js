import express from 'express';
import { body } from 'express-validator';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expense.controller.js';
import { authenticate, requirePermission, ACTIONS } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all expenses - requires VIEW_REPORTS permission
router.get('/', requirePermission(ACTIONS.VIEW_REPORTS), getAllExpenses);

// Get expense by ID - requires VIEW_REPORTS permission
router.get('/:id', requirePermission(ACTIONS.VIEW_REPORTS), getExpenseById);

// Create expense - requires EXPENSES permission
router.post(
  '/',
  requirePermission(ACTIONS.EXPENSES),
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

// Update expense - requires EXPENSES permission
router.put(
  '/:id',
  requirePermission(ACTIONS.EXPENSES),
  [
    body('amount').optional().isFloat({ min: 0 }),
    body('date').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  updateExpense
);

// Delete expense - requires EXPENSES permission
router.delete('/:id', requirePermission(ACTIONS.EXPENSES), deleteExpense);

export default router;

