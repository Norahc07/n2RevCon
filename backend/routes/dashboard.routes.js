import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.controller.js';
import { authenticate, requirePermission, ACTIONS } from '../middleware/auth.middleware.js';
import { authenticateOptionalGuest } from '../middleware/guestAuth.middleware.js';

const router = express.Router();

// Get dashboard summary - allows both regular auth and guest auth (view-only)
router.get('/summary', authenticateOptionalGuest, requirePermission(ACTIONS.VIEW_REPORTS), getDashboardSummary);

export default router;

