import express from 'express';
import { body } from 'express-validator';
import {
  getAllRevenue,
  getRevenueById,
  createRevenue,
  updateRevenue,
  deleteRevenue
} from '../controllers/revenue.controller.js';
import { authenticate, requirePermission, ACTIONS } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all revenue - requires VIEW_REPORTS permission (all roles with revenue access can view)
router.get('/', requirePermission(ACTIONS.VIEW_REPORTS), getAllRevenue);

// Get revenue by ID - requires VIEW_REPORTS permission
router.get('/:id', requirePermission(ACTIONS.VIEW_REPORTS), getRevenueById);

// Create revenue - requires REVENUE permission
router.post(
  '/',
  requirePermission(ACTIONS.REVENUE),
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

// Update revenue - requires REVENUE permission
router.put(
  '/:id',
  requirePermission(ACTIONS.REVENUE),
  [
    body('amount').optional().isFloat({ min: 0 }),
    body('date').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  updateRevenue
);

// Delete revenue - requires REVENUE permission
router.delete('/:id', requirePermission(ACTIONS.REVENUE), deleteRevenue);

export default router;

