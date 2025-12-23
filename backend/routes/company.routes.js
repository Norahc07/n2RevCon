import express from 'express';
import { 
  getCompanyProfile, 
  updateCompanyProfile,
  getAuditLogs,
  createBackup
} from '../controllers/company.controller.js';
import { authenticate, requirePermission, ACTIONS, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get company profile - requires VIEW_REPORTS permission
router.get('/', requirePermission(ACTIONS.VIEW_REPORTS), getCompanyProfile);

// Update company profile - requires CLOSE_LOCK_PROJECT permission (Master Admin/System Admin)
router.put('/', requirePermission(ACTIONS.CLOSE_LOCK_PROJECT), updateCompanyProfile);

// Get audit logs - requires VIEW_REPORTS permission (all roles with report access can view)
router.get('/audit-logs', requirePermission(ACTIONS.VIEW_REPORTS), getAuditLogs);

// Create manual backup - requires CLOSE_LOCK_PROJECT permission (Master Admin/System Admin)
router.post('/backup', requirePermission(ACTIONS.CLOSE_LOCK_PROJECT), createBackup);

export default router;

