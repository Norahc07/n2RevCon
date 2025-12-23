import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { hasPermission, ACTIONS } from '../config/permissions.js';

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Update session last activity (async, don't block request)
    if (user.sessions && user.sessions.length > 0) {
      const session = user.sessions.find(s => s.token === token);
      if (session) {
        session.lastActivity = new Date();
        // Save in background, don't wait
        User.findByIdAndUpdate(user._id, { sessions: user.sessions }, { validateBeforeSave: false })
          .catch(err => console.error('Session update error:', err));
      }
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * Checks if user has permission for a specific action
 * @param {string} action - Required action (e.g., ACTIONS.REVENUE)
 * @returns {Function} - Express middleware function
 */
export const requirePermission = (action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!hasPermission(req.user.role, action)) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to perform this action.' 
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware for multiple actions (OR logic)
 * User needs at least one of the specified permissions
 * @param {string[]} actions - Array of actions (user needs at least one)
 * @returns {Function} - Express middleware function
 */
export const requireAnyPermission = (...actions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const hasAny = actions.some(action => hasPermission(req.user.role, action));
    
    if (!hasAny) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to perform this action.' 
      });
    }

    next();
  };
};

// Export ACTIONS for use in routes
export { ACTIONS };

