import crypto from 'crypto';
import QRCode from 'qrcode';
import GuestLink from '../models/GuestLink.model.js';
import { ROLES } from '../config/permissions.js';

/**
 * Generate a secure random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * @route   POST /api/guest/generate-link
 * @desc    Generate a guest access link and QR code
 * @access  Private (Master Admin only)
 */
export const generateGuestLink = async (req, res) => {
  try {
    // Check if user is Master Admin
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ 
        message: 'Only Master Admin can generate guest links' 
      });
    }

    const { type, name, description, expiresInDays } = req.body;

    // Validate type
    if (!type || !['researcher', 'client'].includes(type)) {
      return res.status(400).json({ 
        message: 'Invalid type. Must be "researcher" or "client"' 
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Name is required' 
      });
    }

    // Generate unique token
    const token = generateToken();

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    // Create guest link
    const guestLink = await GuestLink.create({
      token,
      type,
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: req.user.id,
      expiresAt
    });

    // Generate the access URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accessUrl = `${frontendUrl}/guest/${type}/${token}`;

    // Generate QR code as data URL
    let qrCodeDataUrl = null;
    try {
      qrCodeDataUrl = await QRCode.toDataURL(accessUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      });
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
      // Continue without QR code if generation fails
    }

    res.status(201).json({
      message: 'Guest link generated successfully',
      guestLink: {
        id: guestLink._id,
        token: guestLink.token,
        type: guestLink.type,
        name: guestLink.name,
        description: guestLink.description,
        accessUrl,
        qrCodeDataUrl,
        isActive: guestLink.isActive,
        expiresAt: guestLink.expiresAt,
        createdAt: guestLink.createdAt
      }
    });
  } catch (error) {
    console.error('Error generating guest link:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate guest link' 
    });
  }
};

/**
 * @route   GET /api/guest/links
 * @desc    Get all guest links
 * @access  Private (Master Admin only)
 */
export const getAllGuestLinks = async (req, res) => {
  try {
    // Check if user is Master Admin
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ 
        message: 'Only Master Admin can view guest links' 
      });
    }

    const guestLinks = await GuestLink.find()
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const linksWithUrls = guestLinks.map(link => ({
      id: link._id,
      token: link.token,
      type: link.type,
      name: link.name,
      description: link.description,
      accessUrl: `${frontendUrl}/guest/${link.type}/${link.token}`,
      isActive: link.isActive,
      expiresAt: link.expiresAt,
      accessCount: link.accessCount,
      lastAccessedAt: link.lastAccessedAt,
      createdAt: link.createdAt,
      createdBy: link.createdBy
    }));

    res.json({
      message: 'Guest links retrieved successfully',
      guestLinks: linksWithUrls
    });
  } catch (error) {
    console.error('Error fetching guest links:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to fetch guest links' 
    });
  }
};

/**
 * @route   GET /api/guest/verify/:token
 * @desc    Verify guest link token and get access info
 * @access  Public
 */
export const verifyGuestToken = async (req, res) => {
  try {
    const { token } = req.params;

    const guestLink = await GuestLink.findOne({ token, isActive: true });

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

    // Update access statistics
    guestLink.accessCount += 1;
    guestLink.lastAccessedAt = new Date();
    await guestLink.save({ validateBeforeSave: false });

    res.json({
      message: 'Guest link verified',
      guestLink: {
        type: guestLink.type,
        name: guestLink.name,
        description: guestLink.description
      }
    });
  } catch (error) {
    console.error('Error verifying guest token:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to verify guest link' 
    });
  }
};

/**
 * @route   PUT /api/guest/links/:id/toggle
 * @desc    Toggle guest link active status
 * @access  Private (Master Admin only)
 */
export const toggleGuestLink = async (req, res) => {
  try {
    // Check if user is Master Admin
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ 
        message: 'Only Master Admin can toggle guest links' 
      });
    }

    const { id } = req.params;

    const guestLink = await GuestLink.findById(id);

    if (!guestLink) {
      return res.status(404).json({ 
        message: 'Guest link not found' 
      });
    }

    guestLink.isActive = !guestLink.isActive;
    await guestLink.save();

    res.json({
      message: `Guest link ${guestLink.isActive ? 'activated' : 'deactivated'} successfully`,
      guestLink: {
        id: guestLink._id,
        isActive: guestLink.isActive
      }
    });
  } catch (error) {
    console.error('Error toggling guest link:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to toggle guest link' 
    });
  }
};

/**
 * @route   DELETE /api/guest/links/:id
 * @desc    Delete a guest link
 * @access  Private (Master Admin only)
 */
export const deleteGuestLink = async (req, res) => {
  try {
    // Check if user is Master Admin
    if (req.user.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ 
        message: 'Only Master Admin can delete guest links' 
      });
    }

    const { id } = req.params;

    const guestLink = await GuestLink.findByIdAndDelete(id);

    if (!guestLink) {
      return res.status(404).json({ 
        message: 'Guest link not found' 
      });
    }

    res.json({
      message: 'Guest link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting guest link:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to delete guest link' 
    });
  }
};

/**
 * @route   GET /api/guest/qrcode/:token
 * @desc    Generate QR code for a guest link
 * @access  Public
 */
export const generateQRCode = async (req, res) => {
  try {
    const { token } = req.params;

    const guestLink = await GuestLink.findOne({ token, isActive: true });

    if (!guestLink) {
      return res.status(404).json({ 
        message: 'Invalid or inactive guest link' 
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const accessUrl = `${frontendUrl}/guest/${guestLink.type}/${token}`;

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(accessUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="qrcode-${token}.png"`);
    res.send(qrCodeBuffer);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate QR code' 
    });
  }
};

