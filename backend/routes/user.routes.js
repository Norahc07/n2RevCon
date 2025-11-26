import express from 'express';
import { body } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUser,
  updatePassword,
  requestPasswordChange,
  changePasswordWithToken,
  getUserSessions,
  logoutAllDevices,
  getLoginHistory,
  deleteUser
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// Public route: Change password with verification token (no auth needed)
router.put(
  '/change-password/:token',
  [
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
    sanitizeInput
  ],
  changePasswordWithToken
);

// All other routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get('/', authorize('admin'), getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Update user
router.put(
  '/:id',
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    validate,
    sanitizeInput
  ],
  updateUser
);

// Request password change (sends verification email) - uses authenticated user's ID
router.post('/request-password-change', requestPasswordChange);

// Update password (direct - requires current password)
router.put(
  '/:id/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
    validate,
    sanitizeInput
  ],
  updatePassword
);

// Get user sessions
router.get('/:id/sessions', getUserSessions);

// Logout from all devices
router.delete('/:id/sessions', logoutAllDevices);

// Get login history
router.get('/:id/login-history', getLoginHistory);

// Delete user (Admin only)
router.delete('/:id', authorize('admin'), deleteUser);

export default router;

