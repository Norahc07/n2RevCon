import Collection from '../models/Collection.model.js';
import Billing from '../models/Billing.model.js';

/**
 * @route   GET /api/collections
 * @desc    Get all collection records
 * @access  Private
 */
export const getAllCollections = async (req, res) => {
  try {
    const { projectId, billingId, status, startDate, endDate } = req.query;
    const filter = {};

    if (projectId) filter.projectId = projectId;
    if (billingId) filter.billingId = billingId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.collectionDate = {};
      if (startDate) filter.collectionDate.$gte = new Date(startDate);
      if (endDate) filter.collectionDate.$lte = new Date(endDate);
    }

    const collections = await Collection.find(filter)
      .populate('billingId', 'invoiceNumber amount totalAmount')
      .populate('projectId', 'projectCode projectName')
      .populate('createdBy', 'firstName lastName')
      .sort({ collectionDate: -1 });

    res.json({ collections });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/collections/:id
 * @desc    Get collection by ID
 * @access  Private
 */
export const getCollectionById = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('billingId', 'invoiceNumber amount totalAmount')
      .populate('projectId', 'projectCode projectName')
      .populate('createdBy', 'firstName lastName');

    if (!collection) {
      return res.status(404).json({ message: 'Collection record not found' });
    }

    res.json({ collection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/collections
 * @desc    Create collection record
 * @access  Private
 */
export const createCollection = async (req, res) => {
  try {
    // Verify billing exists
    const billing = await Billing.findById(req.body.billingId);
    if (!billing) {
      return res.status(404).json({ message: 'Billing record not found' });
    }

    const collectionData = {
      ...req.body,
      projectId: billing.projectId,
      createdBy: req.user.id
    };

    const collection = await Collection.create(collectionData);
    await collection.populate('billingId', 'invoiceNumber amount totalAmount');
    await collection.populate('projectId', 'projectCode projectName');

    res.status(201).json({ message: 'Collection record created successfully', collection });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Collection number already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/collections/:id
 * @desc    Update collection record
 * @access  Private
 */
export const updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('billingId', 'invoiceNumber amount totalAmount')
     .populate('projectId', 'projectCode projectName');

    if (!collection) {
      return res.status(404).json({ message: 'Collection record not found' });
    }

    res.json({ message: 'Collection record updated successfully', collection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   DELETE /api/collections/:id
 * @desc    Delete collection record
 * @access  Private (Admin only)
 */
export const deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection record not found' });
    }
    res.json({ message: 'Collection record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

