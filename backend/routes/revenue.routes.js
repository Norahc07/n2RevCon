import express from 'express';
import { body } from 'express-validator';
import {
  getAllRevenue,
  getRevenueById,
  createRevenue,
  updateRevenue,
  deleteRevenue
} from '../controllers/revenue.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all revenue
router.get('/', getAllRevenue);

// Get revenue by ID
router.get('/:id', getRevenueById);

// Create revenue
router.post(
  '/',
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('revenueCode').trim().notEmpty().withMessage('Revenue code is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('date').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  createRevenue
);

// Update revenue
router.put(
  '/:id',
  [
    body('amount').optional().isFloat({ min: 0 }),
    body('date').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  updateRevenue
);

// Delete revenue
router.delete('/:id', deleteRevenue);

export default router;

