import GuestLink from '../models/GuestLink.model.js';
import { ROLES } from '../config/permissions.js';

/**
 * Guest Authentication Middleware
 * Verifies guest token and creates a virtual viewer user for API access
 * This allows guest links to access view-only endpoints
 */
export const authenticateGuest = async (req, res, next) => {
  try {
    // Try to get guest token from header or query parameter
    const guestToken = req.headers['x-guest-token'] || req.query.guestToken;

    if (!guestToken) {
      return res.status(401).json({ message: 'Guest token required' });
    }

    // Verify guest link
    const guestLink = await GuestLink.findOne({ 
      token: guestToken, 
      isActive: true,
      type: 'client' // Only client type can access actual data
    });

    if (!guestLink) {
      return res.status(404).json({ 
        message: 'Invalid or inactive guest link' 
      });
    }

    // Check if link has expired
    if (guestLink.expiresAt && new Date() > guestLink.expiresAt) {
      return res.status(410).json({ 
        message: 'Guest link has expired' 
      });
    }

    // Create a virtual user object with viewer role
    // This allows the guest to access view-only endpoints
    req.user = {
      _id: `guest_${guestLink._id}`,
      id: `guest_${guestLink._id}`,
      role: ROLES.VIEWER,
      isGuest: true,
      guestLinkId: guestLink._id,
      guestLinkType: guestLink.type
    };

    // Update access statistics (async, don't block request)
    guestLink.accessCount += 1;
    guestLink.lastAccessedAt = new Date();
    GuestLink.findByIdAndUpdate(guestLink._id, {
      accessCount: guestLink.accessCount,
      lastAccessedAt: guestLink.lastAccessedAt
    }, { validateBeforeSave: false })
      .catch(err => console.error('Guest link update error:', err));

    next();
  } catch (error) {
    console.error('Guest authentication error:', error);
    res.status(401).json({ message: 'Invalid guest token' });
  }
};

import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * Optional guest authentication - allows both regular auth and guest auth
 * Tries regular authentication first, then guest authentication
 */
export const authenticateOptionalGuest = async (req, res, next) => {
  try {
    // First try regular JWT authentication
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (user) {
          req.user = user;
          return next();
        }
      } catch (jwtError) {
        // JWT auth failed, try guest auth
      }
    }

    // If JWT auth failed or no token, try guest auth
    const guestToken = req.headers['x-guest-token'] || req.query.guestToken;
    
    if (guestToken) {
      return authenticateGuest(req, res, next);
    }

    // No authentication method worked
    return res.status(401).json({ message: 'Authentication required' });
  } catch (error) {
    console.error('Optional guest authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

