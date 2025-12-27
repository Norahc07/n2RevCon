import Project from '../models/Project.model.js';

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
export const getAllProjects = async (req, res) => {
  try {
    const { status, clientName, startDate, endDate, includeDeleted } = req.query;
    const filter = {};

    // Exclude deleted projects by default
    if (includeDeleted !== 'true') {
      filter.deletedAt = null;
    }

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
    // Allow viewing deleted projects (for Recently Deleted page)
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
 * @desc    Soft delete project (moves to recently deleted)
 * @access  Private (Master Admin only)
 */
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project moved to recently deleted. It will be permanently deleted after 30 days.', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/projects/deleted
 * @desc    Get all deleted projects
 * @access  Private
 */
export const getDeletedProjects = async (req, res) => {
  try {
    const projects = await Project.find({ deletedAt: { $ne: null } })
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .sort({ deletedAt: -1 });

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/projects/:id/restore
 * @desc    Restore a deleted project
 * @access  Private
 */
export const restoreProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { deletedAt: null },
      { new: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project restored successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/projects/:id/permanent
 * @desc    Permanently delete a project
 * @access  Private (Master Admin only)
 */
export const permanentDeleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/projects/:id/close
 * @desc    Close a project (set status to 'closed')
 * @access  Private (Requires CLOSE_LOCK_PROJECT permission)
 */
export const closeProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'closed',
        actualEndDate: new Date(),
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email')
     .populate('lockedBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project closed successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/projects/:id/lock
 * @desc    Lock a project (prevent modifications)
 * @access  Private (Requires CLOSE_LOCK_PROJECT permission)
 */
export const lockProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        isLocked: true,
        lockedAt: new Date(),
        lockedBy: req.user.id,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email')
     .populate('lockedBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project locked successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/projects/:id/unlock
 * @desc    Unlock a project (allow modifications)
 * @access  Private (Requires CLOSE_LOCK_PROJECT permission)
 */
export const unlockProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        isLocked: false,
        lockedAt: null,
        lockedBy: null,
        updatedBy: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email')
     .populate('updatedBy', 'firstName lastName email')
     .populate('lockedBy', 'firstName lastName email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project unlocked successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

