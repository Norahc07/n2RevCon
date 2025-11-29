import CompanyProfile from '../models/CompanyProfile.model.js';
import AuditLog from '../models/AuditLog.model.js';

/**
 * @route   GET /api/company
 * @desc    Get company profile
 * @access  Private
 */
export const getCompanyProfile = async (req, res) => {
  try {
    let company = await CompanyProfile.findOne();
    
    if (!company) {
      // Create default company profile if none exists
      company = await CompanyProfile.create({
        companyName: 'N2 RevCon',
        companyCode: 'N2RC',
        createdBy: req.user.id,
        projectConfig: {
          autoGenerateId: true,
          idFormat: 'CompanyCode-YYYY-MM-DD-Sequence',
          defaultStatus: 'pending',
          allowedStatuses: ['pending', 'ongoing', 'completed'],
          defaultYearFilter: true
        },
        billingConfig: {
          billingStatusLabels: { billed: 'Billed', unbilled: 'Unbilled' },
          paymentStatusLabels: { paid: 'Paid', unpaid: 'Unpaid', uncollectible: 'Uncollectible' },
          requireCheckNumber: false,
          requireBINumber: false
        },
        notificationConfig: {
          enabled: true,
          projectEndDate: true,
          billingFollowUp: true,
          unpaidAfterCompletion: true,
          timing: { daysBefore3: true, daysBefore2: true, daysBefore1: true },
          overdueTriggerDays: 1
        },
        backupConfig: {
          autoBackup: false,
          backupFrequency: 'daily',
          lastBackup: null
        },
        exportConfig: {
          defaultFormat: 'xlsx',
          includeCompanyInfo: true,
          defaultColumns: []
        },
        appearanceConfig: {
          themeColor: 'red',
          buttonStyle: 'rounded',
          sidebarLayout: 'expanded',
          logoInNavbar: true
        },
        auditConfig: {
          enabled: true,
          logProjectCreation: true,
          logDataEdits: true,
          logDeletions: true,
          logLoginLogout: true
        },
        pwaConfig: {
          offlineMode: true,
          autoSync: true,
          lastSync: null
        }
      });
    }

    res.json({ company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   PUT /api/company
 * @desc    Update company profile (full or partial update)
 * @access  Private (Admin only)
 */
export const updateCompanyProfile = async (req, res) => {
  try {
    let company = await CompanyProfile.findOne();

    if (!company) {
      company = await CompanyProfile.create({
        ...req.body,
        createdBy: req.user.id
      });
    } else {
      // Merge updates instead of replacing
      Object.keys(req.body).forEach(key => {
        if (key === 'company' && typeof req.body[key] === 'object' && !Array.isArray(req.body[key]) && req.body[key] !== null) {
          // Special handling for 'company' key - merge its properties directly into company document
          Object.keys(req.body[key]).forEach(subKey => {
            if (typeof req.body[key][subKey] === 'object' && !Array.isArray(req.body[key][subKey]) && req.body[key][subKey] !== null) {
              // Deep merge for nested objects like settings, address, contact
              if (!company[subKey]) {
                company[subKey] = {};
              }
              company[subKey] = { ...company[subKey], ...req.body[key][subKey] };
            } else {
              company[subKey] = req.body[key][subKey];
            }
          });
        } else if (typeof req.body[key] === 'object' && !Array.isArray(req.body[key]) && req.body[key] !== null) {
          // For other keys, merge normally
          if (!company[key]) {
            company[key] = {};
          }
          company[key] = { ...company[key], ...req.body[key] };
        } else {
          company[key] = req.body[key];
        }
      });
      await company.save();
    }

    // Log audit if enabled
    if (company.auditConfig?.enabled && company.auditConfig?.logDataEdits) {
      await AuditLog.create({
        action: 'update',
        entity: 'company',
        entityId: company._id,
        entityRef: 'CompanyProfile',
        userId: req.user.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: 'Company profile updated'
      });
    }

    res.json({ message: 'Company profile updated successfully', company });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   GET /api/company/audit-logs
 * @desc    Get audit logs
 * @access  Private (Admin only)
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, entity, action, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (entity) query.entity = entity;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route   POST /api/company/backup
 * @desc    Create manual backup
 * @access  Private (Admin only)
 */
export const createBackup = async (req, res) => {
  try {
    const company = await CompanyProfile.findOne();
    if (!company) {
      return res.status(404).json({ message: 'Company profile not found' });
    }

    // Update last backup time
    company.backupConfig.lastBackup = new Date();
    await company.save();

    // Log backup action
    if (company.auditConfig?.enabled) {
      await AuditLog.create({
        action: 'backup',
        entity: 'system',
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        description: 'Manual backup created'
      });
    }

    res.json({ 
      message: 'Backup created successfully',
      lastBackup: company.backupConfig.lastBackup
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

