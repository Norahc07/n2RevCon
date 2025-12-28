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
    // Normalize projectId: convert empty string to null for general revenues
    const projectId = req.body.projectId && req.body.projectId.trim() !== '' 
      ? req.body.projectId 
      : null;

    // Verify project exists only if projectId is provided
    if (projectId) {
      const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if project is locked
      if (project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    const revenueData = {
      ...req.body,
      createdBy: req.user.id,
      // Set projectId to null if not provided (general revenue)
      projectId: projectId
    };

    const revenue = await Revenue.create(revenueData);
    if (revenue.projectId) {
    await revenue.populate('projectId', 'projectCode projectName');
    }

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
    // Get existing revenue to check its project
    const existingRevenue = await Revenue.findById(req.params.id);
    if (!existingRevenue) {
      return res.status(404).json({ message: 'Revenue record not found' });
    }

    // Check if the existing revenue's project is locked
    if (existingRevenue.projectId) {
      const project = await Project.findById(existingRevenue.projectId);
      if (project && project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    // Normalize projectId: convert empty string to null for general revenues
    if (req.body.projectId !== undefined) {
      req.body.projectId = req.body.projectId && req.body.projectId.trim() !== '' 
        ? req.body.projectId 
        : null;
    }

    // Verify project exists only if projectId is provided and not null
    if (req.body.projectId) {
      const project = await Project.findById(req.body.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      
      // Check if new project is locked
      if (project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    const revenue = await Revenue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (revenue.projectId) {
      await revenue.populate('projectId', 'projectCode projectName');
    }

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
    // Get revenue to check if its project is locked
    const revenue = await Revenue.findById(req.params.id);
    if (!revenue) {
      return res.status(404).json({ message: 'Revenue record not found' });
    }

    // Check if project is locked
    if (revenue.projectId) {
      const project = await Project.findById(revenue.projectId);
      if (project && project.isLocked) {
        return res.status(403).json({ 
          message: 'Project is locked and cannot be modified. Please unlock the project first.' 
        });
      }
    }

    await Revenue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Revenue record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

