import Project from '../models/Project.model.js';

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
export const getAllProjects = async (req, res) => {
  try {
    const { status, clientName, startDate, endDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (clientName) filter.clientName = { $regex: clientName, $options: 'i' };
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const projects = await Project.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/projects/:id
 * @desc    Get project by ID
 * @access  Private
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private
 */
export const createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user.id
    };

    const project = await Project.create(projectData);
    await project.populate('createdBy', 'firstName lastName email');

    res.status(201).json({ message: 'Project created successfully', project });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Project code already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project
 * @access  Private
 */
export const updateProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      projectData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/projects/:id
 * @desc    Delete project
 * @access  Private (Admin only)
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

