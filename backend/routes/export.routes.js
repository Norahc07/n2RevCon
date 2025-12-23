import express from 'express';
import {
  exportProject,
  exportProjects,
  exportRevenueCosts,
  exportBillingCollections,
  exportSummary
} from '../controllers/export.controller.js';
import { authenticate, requirePermission, ACTIONS } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Export all projects - requires VIEW_REPORTS permission
router.get('/projects', requirePermission(ACTIONS.VIEW_REPORTS), exportProjects);

// Export project report - requires VIEW_REPORTS permission
router.get('/project/:id', requirePermission(ACTIONS.VIEW_REPORTS), exportProject);

// Export revenue vs expenses - requires VIEW_REPORTS permission
router.get('/revenue-costs', requirePermission(ACTIONS.VIEW_REPORTS), exportRevenueCosts);

// Export billing & collections - requires VIEW_REPORTS permission
router.get('/billing-collections', requirePermission(ACTIONS.VIEW_REPORTS), exportBillingCollections);

// Export full summary - requires VIEW_REPORTS permission
router.get('/summary', requirePermission(ACTIONS.VIEW_REPORTS), exportSummary);

export default router;

