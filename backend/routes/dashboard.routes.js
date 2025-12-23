import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { authenticate, requirePermission, ACTIONS } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get dashboard summary - requires VIEW_REPORTS permission
router.get('/summary', requirePermission(ACTIONS.VIEW_REPORTS), getDashboardSummary);

export default router;

