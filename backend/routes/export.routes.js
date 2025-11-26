import express from 'express';
import {
  exportProject,
  exportProjects,
  exportRevenueCosts,
  exportBillingCollections,
  exportSummary
} from '../controllers/export.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Export all projects
router.get('/projects', exportProjects);

// Export project report
router.get('/project/:id', exportProject);

// Export revenue vs costs
router.get('/revenue-costs', exportRevenueCosts);

// Export billing & collections
router.get('/billing-collections', exportBillingCollections);

// Export full summary (Admin only)
router.get('/summary', authorize('admin'), exportSummary);

export default router;

