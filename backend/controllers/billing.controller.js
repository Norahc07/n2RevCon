import Billing from '../models/Billing.model.js';
import Project from '../models/Project.model.js';

/**
 * @route   GET /api/billing
 * @desc    Get all billing records
 * @access  Private
 */
export const getAllBilling = async (req, res) => {
  try {
    const { projectId, status, startDate, endDate } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.billingDate = {};
      if (startDate) filter.billingDate.$gte = new Date(startDate);
      if (endDate) filter.billingDate.$lte = new Date(endDate);
    }

    const billing = await Billing.find(filter)
      .populate('projectId', 'projectCode projectName clientName')
      .populate('createdBy', 'firstName lastName')
      .sort({ billingDate: -1 });

    res.json({ billing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/billing/:id
 * @desc    Get billing by ID
 * @access  Private
 */
export const getBillingById = async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id)
      .populate('projectId', 'projectCode projectName clientName')
      .populate('createdBy', 'firstName lastName');

    if (!billing) {
      return res.status(404).json({ message: 'Billing record not found' });
    }

    res.json({ billing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/billing
 * @desc    Create billing record
 * @access  Private
 */
export const createBilling = async (req, res) => {
  try {
    // Verify project exists
    const project = await Project.findById(req.body.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project is locked
    if (project.isLocked) {
      return res.status(403).json({ 
        message: 'Project is locked and cannot be modified. Please unlock the project first.' 
      });
    }

    const billingData = {
      ...req.body,
      createdBy: req.user.id
    };

    const billing = await Billing.create(billingData);
    await billing.populate('projectId', 'projectCode projectName clientName');

    res.status(201).json({ message: 'Billing record created successfully', billing });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Invoice number already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/billing/:id
 * @desc    Update billing record
 * @access  Private
 */
export const updateBilling = async (req, res) => {
  try {
    // Get existing billing to check if its project is locked
    const existingBilling = await Billing.findById(req.params.id);
    if (!existingBilling) {
      return res.status(404).json({ message: 'Billing record not found' });
    }

    // Check if project is locked
    if (existingBilling.projectId) {
      const project = await Project.findById(existingBilling.projectId);
      if (project && project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    const billing = await Billing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'projectCode projectName clientName');

    res.json({ message: 'Billing record updated successfully', billing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/billing/:id
 * @desc    Delete billing record
 * @access  Private (Admin only)
 */
export const deleteBilling = async (req, res) => {
  try {
    // Get billing to check if its project is locked
    const billing = await Billing.findById(req.params.id);
    if (!billing) {
      return res.status(404).json({ message: 'Billing record not found' });
    }

    // Check if project is locked
    if (billing.projectId) {
      const project = await Project.findById(billing.projectId);
      if (project && project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    await Billing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Billing record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

