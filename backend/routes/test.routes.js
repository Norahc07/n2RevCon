import express from 'express';
import { testEmail } from '../controllers/test.controller.js';

const router = express.Router();

// Test email endpoint (development only)
router.post('/send-email', testEmail);

export default router;

