import express from 'express';
import { body } from 'express-validator';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getDeletedProjects,
  restoreProject,
  permanentDeleteProject,
  closeProject,
  lockProject,
  unlockProject
} from '../controllers/project.controller.js';
import { authenticate, requirePermission, requireAnyPermission, ACTIONS } from '../middleware/auth.middleware.js';
import { authenticateOptionalGuest } from '../middleware/guestAuth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// View-only routes - allow both regular auth and guest auth
// Get all projects - requires VIEW_REPORTS permission
router.get('/', authenticateOptionalGuest, requirePermission(ACTIONS.VIEW_REPORTS), getAllProjects);

// Get deleted projects - requires VIEW_REPORTS permission
router.get('/deleted', authenticateOptionalGuest, requirePermission(ACTIONS.VIEW_REPORTS), getDeletedProjects);

// Get project by ID - requires VIEW_REPORTS permission
router.get('/:id', authenticateOptionalGuest, requirePermission(ACTIONS.VIEW_REPORTS), getProjectById);

// All write operations require regular authentication (no guest access)
router.use(authenticate);

// Create project - requires VIEW_REPORTS permission (anyone who can view can create projects)
// Note: You may want to restrict this further based on your business logic
router.post(
  '/',
  requirePermission(ACTIONS.VIEW_REPORTS),
  [
    body('projectCode').trim().notEmpty().withMessage('Project code is required'),
    body('projectName').trim().notEmpty().withMessage('Project name is required'),
    body('clientName').trim().notEmpty().withMessage('Client name is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
    validate,
    sanitizeInput
  ],
  createProject
);

// Update project - requires VIEW_REPORTS permission
// Note: You may want to add a check to prevent updates if project is locked
router.put(
  '/:id',
  requirePermission(ACTIONS.VIEW_REPORTS),
  [
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  updateProject
);

// Restore deleted project - requires VIEW_REPORTS permission
router.post('/:id/restore', requirePermission(ACTIONS.VIEW_REPORTS), restoreProject);

// Close project - requires CLOSE_LOCK_PROJECT permission
router.post('/:id/close', requirePermission(ACTIONS.CLOSE_LOCK_PROJECT), closeProject);

// Lock project - requires DELETE_PROJECT permission (Master Admin only)
router.post('/:id/lock', requirePermission(ACTIONS.DELETE_PROJECT), lockProject);

// Unlock project - requires DELETE_PROJECT permission (Master Admin only)
router.post('/:id/unlock', requirePermission(ACTIONS.DELETE_PROJECT), unlockProject);

// Delete project (soft delete) - requires DELETE_PROJECT permission (Master Admin only)
router.delete('/:id', requirePermission(ACTIONS.DELETE_PROJECT), deleteProject);

// Permanently delete project - requires DELETE_PROJECT permission (Master Admin only)
router.delete('/:id/permanent', requirePermission(ACTIONS.DELETE_PROJECT), permanentDeleteProject);

export default router;

