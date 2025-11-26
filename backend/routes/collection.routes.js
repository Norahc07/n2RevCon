import express from 'express';
import { body } from 'express-validator';
import {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection
} from '../controllers/collection.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all collections
router.get('/', getAllCollections);

// Get collection by ID
router.get('/:id', getCollectionById);

// Create collection
router.post(
  '/',
  [
    body('billingId').notEmpty().withMessage('Billing ID is required'),
    body('collectionNumber').trim().notEmpty().withMessage('Collection number is required'),
    body('collectionDate').optional().isISO8601(),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    validate,
    sanitizeInput
  ],
  createCollection
);

// Update collection
router.put(
  '/:id',
  [
    body('collectionDate').optional().isISO8601(),
    body('amount').optional().isFloat({ min: 0 }),
    validate,
    sanitizeInput
  ],
  updateCollection
);

// Delete collection (Admin only)
router.delete('/:id', authorize('admin'), deleteCollection);

export default router;

