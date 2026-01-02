import express from 'express';
import { body } from 'express-validator';
import {
  generateGuestLink,
  getAllGuestLinks,
  verifyGuestToken,
  toggleGuestLink,
  deleteGuestLink,
  generateQRCode
} from '../controllers/guest.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { ROLES } from '../config/permissions.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/verify/:token', verifyGuestToken);
router.get('/qrcode/:token', generateQRCode);

// Protected routes (require authentication)
router.use(authenticate);

// Master Admin only routes
router.post(
  '/generate-link',
  [
    body('type').isIn(['researcher', 'client']).withMessage('Type must be researcher or client'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('description').optional().trim(),
    body('expiresInDays').optional().isInt({ min: 1 }).withMessage('Expires in days must be a positive integer')
  ],
  authorize(ROLES.MASTER_ADMIN),
  generateGuestLink
);

router.get('/links', authorize(ROLES.MASTER_ADMIN), getAllGuestLinks);

router.put('/links/:id/toggle', authorize(ROLES.MASTER_ADMIN), toggleGuestLink);

router.delete('/links/:id', authorize(ROLES.MASTER_ADMIN), deleteGuestLink);

export default router;

