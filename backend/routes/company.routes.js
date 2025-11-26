import express from 'express';
import { 
  getCompanyProfile, 
  updateCompanyProfile,
  getAuditLogs,
  createBackup
} from '../controllers/company.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get company profile
router.get('/', getCompanyProfile);

// Update company profile (Admin only)
router.put('/', authorize('admin'), updateCompanyProfile);

// Get audit logs (Admin only)
router.get('/audit-logs', authorize('admin'), getAuditLogs);

// Create manual backup (Admin only)
router.post('/backup', authorize('admin'), createBackup);

export default router;

