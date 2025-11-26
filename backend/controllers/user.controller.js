import User from '../models/User.model.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendPasswordChangeEmail } from '../services/email.service.js';

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private
 */
export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, profile, preferences, role, isActive } = req.body;
    
    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
      }
    }
    
    // Update user data (role is always admin, but allow isActive changes)
    const updateData = { firstName, lastName, email, profile, preferences };
    // Allow isActive changes (for account deactivation)
    if (isActive !== undefined) updateData.isActive = isActive;
    // Role is always admin, no need to update

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/users/request-password-change
 * @desc    Request password change - sends verification email
 * @access  Private
 */
export const requestPasswordChange = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate verification token
    const changeToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(changeToken).digest('hex');

    // Save token and expiration (1 hour)
    user.changePasswordToken = hashedToken;
    user.changePasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Generate password change URL
    const changePasswordUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/change-password/${changeToken}`;
    
    // Send custom email with logo and system branding
    try {
      const userName = `${user.firstName} ${user.lastName}`;
      const emailResult = await sendPasswordChangeEmail({
        to: user.email,
        userName: userName,
        changePasswordUrl: changePasswordUrl,
      });

      console.log('✅ Password change email sent successfully to:', user.email);
      
      // In development, always include the URL in response for testing
      const response = { 
        message: 'Password change verification email sent. Please check your email.',
      };
      
      if (process.env.NODE_ENV === 'development') {
        response.changePasswordUrl = changePasswordUrl;
        response.emailSent = emailResult.success;
        if (emailResult.previewUrl) {
          response.previewUrl = emailResult.previewUrl;
        }
        // If using console mode, include the URL from the result
        if (emailResult.passwordChangeUrl) {
          response.changePasswordUrl = emailResult.passwordChangeUrl;
        }
      }
      
      res.json(response);
    } catch (emailError) {
      console.error('❌ Error sending password change email:', emailError);
      console.error('Error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
        response: emailError.response,
      });
      
      // In development, show the error details
      if (process.env.NODE_ENV === 'development') {
        res.json({ 
          message: 'Password change verification email sent. Please check your email.',
          changePasswordUrl: changePasswordUrl,
          emailError: emailError.message,
          emailErrorCode: emailError.code,
          note: 'Email sending failed. Check backend console for details. Use the changePasswordUrl above to test.',
        });
      } else {
        // In production, don't reveal email errors for security
        res.json({ 
          message: 'Password change verification email sent. Please check your email.',
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/users/change-password/:token
 * @desc    Change password with verification token
 * @access  Public (no auth needed, token is the verification)
 */
export const changePasswordWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token (token is unique, no need for user ID)
    const user = await User.findOne({
      changePasswordToken: hashedToken,
      changePasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update password
    user.password = newPassword;
    user.changePasswordToken = undefined;
    user.changePasswordExpire = undefined;
    await user.save();

    // Invalidate all sessions except current one
    const currentToken = req.headers.authorization?.split(' ')[1];
    if (currentToken) {
      try {
        const decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
        user.sessions = user.sessions.filter(s => s.token !== currentToken);
      } catch (e) {
        // If token invalid, clear all sessions
        user.sessions = [];
      }
    } else {
      user.sessions = [];
    }
    await user.save();

    res.json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password (direct - requires current password)
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/users/:id/sessions
 * @desc    Get user active sessions
 * @access  Private
 */
export const getUserSessions = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get current token
    const currentToken = req.headers.authorization?.split(' ')[1];
    
    const sessions = (user.sessions || []).map(session => ({
      ...session.toObject(),
      isCurrent: session.token === currentToken
    }));

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/users/:id/sessions
 * @desc    Log out from all devices
 * @access  Private
 */
export const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.sessions = [];
    await user.save();

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/users/:id/login-history
 * @desc    Get user login history
 * @access  Private
 */
export const getLoginHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const loginHistory = (user.loginHistory || []).slice(-20).reverse(); // Last 20 entries

    res.json({ loginHistory });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

