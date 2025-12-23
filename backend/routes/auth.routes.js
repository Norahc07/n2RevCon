import express from 'express';
import { body } from 'express-validator';
import { register, login, getMe, logout, forgotPassword, resetPassword, verifyEmail, resendVerificationEmail } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
    sanitizeInput
  ],
  register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
    sanitizeInput
  ],
  login
);

// Get current user
router.get('/me', authenticate, getMe);

// Logout
router.post('/logout', authenticate, logout);

// Forgot Password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    validate,
    sanitizeInput
  ],
  forgotPassword
);

// Reset Password
router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate,
    sanitizeInput
  ],
  resetPassword
);

// Verify Email
router.get('/verify-email/:token', verifyEmail);

// Resend Verification Email
router.post(
  '/resend-verification',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    validate,
    sanitizeInput
  ],
  resendVerificationEmail
);

export default router;

