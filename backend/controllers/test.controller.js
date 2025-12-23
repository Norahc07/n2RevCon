import { sendEmailVerificationEmail } from '../services/email.service.js';

/**
 * @route   POST /api/test/send-email
 * @desc    Test email sending (development only)
 * @access  Public
 */
export const testEmail = async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Test endpoint only available in development' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const testUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/test-token-123`;
    
    const result = await sendEmailVerificationEmail({
      to: email,
      userName: 'Test User',
      verificationUrl: testUrl,
    });

    res.json({
      success: true,
      message: 'Test email sent',
      result: {
        messageId: result.messageId,
        isConsoleMode: result.isConsoleMode,
        verificationUrl: result.verificationUrl,
        previewUrl: result.previewUrl,
      },
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
      },
    });
  }
};

