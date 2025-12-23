import express from 'express';
import { body } from 'express-validator';
import {
  getAllBilling,
  getBillingById,
  createBilling,
  updateBilling,
  deleteBilling
} from '../controllers/billing.controller.js';
import { authenticate, requirePermission, ACTIONS } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all billing - requires VIEW_REPORTS permission
router.get('/', requirePermission(ACTIONS.VIEW_REPORTS), getAllBilling);

// Get billing by ID - requires VIEW_REPORTS permission
router.get('/:id', requirePermission(ACTIONS.VIEW_REPORTS), getBillingById);

// Create billing - requires BILLING permission
router.post(
  '/',
  requirePermission(ACTIONS.BILLING),
  [
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('invoiceNumber').trim().notEmpty().withMessage('Invoice number is required'),
    body('billingDate').optional().isISO8601(),
    body('dueDate').isISO8601().withMessage('Valid due date is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('tax').optional().isFloat({ min: 0 }),
    validate,
    sanitizeInput
  ],
  createBilling
);

// Update billing - requires BILLING permission
router.put(
  '/:id',
  requirePermission(ACTIONS.BILLING),
  [
    body('billingDate').optional().isISO8601(),
    body('dueDate').optional().isISO8601(),
    body('amount').optional().isFloat({ min: 0 }),
    body('tax').optional().isFloat({ min: 0 }),
    validate,
    sanitizeInput
  ],
  updateBilling
);

// Delete billing - requires BILLING permission
router.delete('/:id', requirePermission(ACTIONS.BILLING), deleteBilling);

export default router;

