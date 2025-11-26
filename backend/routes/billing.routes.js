import express from 'express';
import { body } from 'express-validator';
import {
  getAllBilling,
  getBillingById,
  createBilling,
  updateBilling,
  deleteBilling
} from '../controllers/billing.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all billing
router.get('/', getAllBilling);

// Get billing by ID
router.get('/:id', getBillingById);

// Create billing
router.post(
  '/',
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

// Update billing
router.put(
  '/:id',
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

// Delete billing (Admin only)
router.delete('/:id', authorize('admin'), deleteBilling);

export default router;

