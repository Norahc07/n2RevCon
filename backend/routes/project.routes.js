import express from 'express';
import { body } from 'express-validator';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';
import { validate, sanitizeInput } from '../middleware/validation.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all projects
router.get('/', getAllProjects);

// Get project by ID
router.get('/:id', getProjectById);

// Create project
router.post(
  '/',
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

// Update project
router.put(
  '/:id',
  [
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    validate,
    sanitizeInput
  ],
  updateProject
);

// Delete project (Admin only)
router.delete('/:id', authorize('admin'), deleteProject);

export default router;

