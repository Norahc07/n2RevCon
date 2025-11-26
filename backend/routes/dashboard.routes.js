import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard summary
router.get('/summary', getDashboardSummary);

export default router;

