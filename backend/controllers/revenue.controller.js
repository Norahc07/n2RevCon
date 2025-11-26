import Revenue from '../models/Revenue.model.js';
import Project from '../models/Project.model.js';

/**
 * @route   GET /api/revenue
 * @desc    Get all revenue records
 * @access  Private
 */
export const getAllRevenue = async (req, res) => {
  try {
    const { projectId, startDate, endDate, category } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const revenue = await Revenue.find(filter)
      .populate('projectId', 'projectCode projectName')
      .populate('createdBy', 'firstName lastName')
      .sort({ date: -1 });

    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/revenue/:id
 * @desc    Get revenue by ID
 * @access  Private
 */
export const getRevenueById = async (req, res) => {
  try {
    const revenue = await Revenue.findById(req.params.id)
      .populate('projectId', 'projectCode projectName')
      .populate('createdBy', 'firstName lastName');

    if (!revenue) {
      return res.status(404).json({ message: 'Revenue record not found' });
    }

    res.json({ revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/revenue
 * @desc    Create revenue record
 * @access  Private
 */
export const createRevenue = async (req, res) => {
  try {
    // Verify project exists
    const project = await Project.findById(req.body.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const revenueData = {
      ...req.body,
      createdBy: req.user.id
    };

    const revenue = await Revenue.create(revenueData);
    await revenue.populate('projectId', 'projectCode projectName');

    res.status(201).json({ message: 'Revenue record created successfully', revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/revenue/:id
 * @desc    Update revenue record
 * @access  Private
 */
export const updateRevenue = async (req, res) => {
  try {
    const revenue = await Revenue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('projectId', 'projectCode projectName');

    if (!revenue) {
      return res.status(404).json({ message: 'Revenue record not found' });
    }

    res.json({ message: 'Revenue record updated successfully', revenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/revenue/:id
 * @desc    Delete revenue record
 * @access  Private
 */
export const deleteRevenue = async (req, res) => {
  try {
    const revenue = await Revenue.findByIdAndDelete(req.params.id);
    if (!revenue) {
      return res.status(404).json({ message: 'Revenue record not found' });
    }
    res.json({ message: 'Revenue record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

