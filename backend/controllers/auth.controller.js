import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.model.js';
import { sendPasswordResetEmail, sendEmailVerificationEmail, sendAccountApprovalEmail, sendAccountRejectionEmail } from '../services/email.service.js';
import { createSeedDataForUser } from '../services/seedData.service.js';

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user - Requires email verification and admin approval
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Create user with default role 'viewer' and pending status
    // Account status: pending (requires email verification + admin approval)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'viewer', // Default to viewer role
      accountStatus: 'pending', // Requires admin approval
      emailVerificationToken: hashedToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Generate email verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    
    // Send email verification email
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      const emailResult = await sendEmailVerificationEmail({
        to: user.email,
        userName: userName,
        verificationUrl: verificationUrl,
      });
      
      if (emailResult.isConsoleMode) {
        console.log('⚠️  Email service is in CONSOLE MODE - No real email sent');
        console.log('   To send real emails, configure SMTP in .env file');
        console.log('   Verification URL is available in console above');
      } else {
        console.log('✅ Email verification sent to:', user.email);
      }
      
      // In development, use extracted URL if available (console mode)
      if (process.env.NODE_ENV === 'development' && emailResult.verificationUrl) {
        verificationUrl = emailResult.verificationUrl;
      }
    } catch (emailError) {
      console.error('❌ Error sending verification email:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
      });
      // Don't fail registration if email fails, but log it
    }

    // Notify master admins about new registration (in background)
    notifyAdminsOfNewRegistration(user).catch(error => {
      console.error('Error notifying admins:', error);
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account. Your account will be activated after admin approval.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        accountStatus: user.accountStatus
      },
      // Include verification URL in development for testing
      ...(process.env.NODE_ENV === 'development' && { verificationUrl })
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Helper function to notify master admins of new registration
 */
async function notifyAdminsOfNewRegistration(newUser) {
  try {
    const masterAdmins = await User.find({ role: 'master_admin', isActive: true });
    
    // Send notification to each master admin
    for (const admin of masterAdmins) {
      // You can implement notification system here (email, in-app notification, etc.)
      console.log(`📧 New user registration pending approval: ${newUser.email} - Notify admin: ${admin.email}`);
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.' 
      });
    }

    // Check if account is approved
    if (user.accountStatus === 'pending') {
      return res.status(401).json({ 
        message: 'Your account is pending approval. Please wait for an administrator to approve your account.' 
      });
    }

    if (user.accountStatus === 'rejected') {
      return res.status(401).json({ 
        message: 'Your account registration has been rejected. Please contact support for more information.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      const device = req.headers['user-agent'] || 'Unknown Device';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
      
      if (!user.loginHistory) {
        user.loginHistory = [];
      }
      user.loginHistory.push({
        date: new Date(),
        device: device.substring(0, 100), // Limit length
        browser: device.substring(0, 100),
        ipAddress: ipAddress,
        success: false
      });
      // Keep only last 50 login attempts
      if (user.loginHistory.length > 50) {
        user.loginHistory = user.loginHistory.slice(-50);
      }
      await user.save({ validateBeforeSave: false });
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get device and browser info
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
    
    // Simple browser detection
    let browser = 'Unknown Browser';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    // Simple device detection
    let device = 'Desktop';
    if (userAgent.includes('Mobile')) device = 'Mobile';
    else if (userAgent.includes('Tablet')) device = 'Tablet';

    // Update last login
    user.lastLogin = new Date();
    
    // Add login history
    if (!user.loginHistory) {
      user.loginHistory = [];
    }
    user.loginHistory.push({
      date: new Date(),
      device: device,
      browser: browser,
      ipAddress: ipAddress,
      success: true
    });
    // Keep only last 50 login attempts
    if (user.loginHistory.length > 50) {
      user.loginHistory = user.loginHistory.slice(-50);
    }

    // Create session
    const token = generateToken(user._id);
    if (!user.sessions) {
      user.sessions = [];
    }
    
    // Add new session
    user.sessions.push({
      token: token,
      device: device,
      browser: browser,
      ipAddress: ipAddress,
      lastActivity: new Date(),
      createdAt: new Date()
    });
    
    // Keep only last 10 sessions
    if (user.sessions.length > 10) {
      user.sessions = user.sessions.slice(-10);
    }
    
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user with id field (convert _id to id for consistency)
    const userObj = user.toObject();
    res.json({ 
      user: {
        id: userObj._id,
        _id: userObj._id, // Keep _id for backward compatibility
        firstName: userObj.firstName,
        lastName: userObj.lastName,
        email: userObj.email,
        role: userObj.role,
        profile: userObj.profile || {},
        preferences: userObj.preferences || {},
        lastLogin: userObj.lastLogin,
        createdAt: userObj.createdAt,
        isActive: userObj.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    // In JWT, logout is handled client-side by removing token
    // Server-side: could implement token blacklist if needed
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If that email exists, a password reset link has been sent.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save token and expiration (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Generate password reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    // Send password reset email
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      const emailResult = await sendPasswordResetEmail({
        to: user.email,
        userName: userName,
        resetUrl: resetUrl,
      });

      console.log('✅ Password reset email sent successfully to:', user.email);
      
      // In development, always include the URL in response for testing
      const response = { 
        message: 'If that email exists, a password reset link has been sent.',
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.resetUrl = resetUrl;
        response.emailSent = emailResult.success;
        if (emailResult.previewUrl) {
          response.previewUrl = emailResult.previewUrl;
        }
        // If using console mode, include the URL from the result
        if (emailResult.passwordChangeUrl) {
          response.resetUrl = emailResult.passwordChangeUrl;
        }
      }
      
      res.json(response);
    } catch (emailError) {
      console.error('❌ Error sending password reset email:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
      });
      
      // In development, show the error details
      if (process.env.NODE_ENV === 'development') {
        res.json({ 
          message: 'If that email exists, a password reset link has been sent.',
          resetUrl: resetUrl,
          emailError: emailError.message,
          emailErrorCode: emailError.code,
          note: 'Email sending failed. Check backend console for details. Use the resetUrl above to test.',
        });
      } else {
        // In production, don't reveal email errors for security
        res.json({ 
          message: 'If that email exists, a password reset link has been sent.',
        });
      }
    }
  } catch (error) {
    // If error, clear reset token
    if (req.user) {
      req.user.resetPasswordToken = undefined;
      req.user.resetPasswordExpire = undefined;
      await req.user.save({ validateBeforeSave: false });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify email address with token
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid verification token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    res.json({ 
      message: 'Email verified successfully! Your account is now pending admin approval. You will be notified once approved.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 */
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If that email exists and is not verified, a verification email has been sent.' 
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Generate email verification URL
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
    
    // Send verification email
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      const emailResult = await sendEmailVerificationEmail({
        to: user.email,
        userName: userName,
        verificationUrl: verificationUrl,
      });
      console.log('✅ Verification email resent to:', user.email);
      
      // In development, use extracted URL if available (console mode)
      if (process.env.NODE_ENV === 'development' && emailResult.verificationUrl) {
        verificationUrl = emailResult.verificationUrl;
      }
      
      const response = { 
        message: 'If that email exists and is not verified, a verification email has been sent.',
      };
      
      // In development, always include the URL for testing
      if (process.env.NODE_ENV === 'development') {
        response.verificationUrl = verificationUrl;
        response.emailSent = emailResult.success;
        if (emailResult.previewUrl) {
          response.previewUrl = emailResult.previewUrl;
        }
      }
      
      res.json(response);
    } catch (emailError) {
      console.error('❌ Error sending verification email:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
      });
      
      // In development, still return the URL even if email fails
      const response = { 
        message: 'If that email exists and is not verified, a verification email has been sent.',
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.verificationUrl = verificationUrl;
        response.emailError = emailError.message;
        response.note = 'Email sending failed. Check backend console for details. Use the verificationUrl above to test.';
      }
      
      res.json(response);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

