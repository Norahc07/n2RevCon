import express from 'express';
import { body } from 'express-validator';
import {
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection
} from '../controllers/collection.controller.js';
import { authenticate, requirePermission, ACTIONS } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all collections - requires VIEW_REPORTS permission
router.get('/', requirePermission(ACTIONS.VIEW_REPORTS), getAllCollections);

// Get collection by ID - requires VIEW_REPORTS permission
router.get('/:id', requirePermission(ACTIONS.VIEW_REPORTS), getCollectionById);

// Create collection - requires COLLECTION permission
router.post(
  '/',
  requirePermission(ACTIONS.COLLECTION),
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

// Update collection - requires COLLECTION permission
router.put(
  '/:id',
  requirePermission(ACTIONS.COLLECTION),
  [
    body('collectionDate').optional().isISO8601(),
    body('amount').optional().isFloat({ min: 0 }),
    validate,
    sanitizeInput
  ],
  updateCollection
);

// Delete collection - requires COLLECTION permission
router.delete('/:id', requirePermission(ACTIONS.COLLECTION), deleteCollection);

export default router;

