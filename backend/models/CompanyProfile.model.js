import mongoose from 'mongoose';

const companyProfileSchema = new mongoose.Schema({
  // 1. Company Information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  companyCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  logo: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  taxInfo: {
    taxId: String,
    registrationNumber: String
  },
  
  // 2. Project Configuration
  projectConfig: {
    autoGenerateId: { type: Boolean, default: true },
    idFormat: { type: String, default: 'CompanyCode-YYYY-MM-DD-Sequence' },
    defaultStatus: { type: String, enum: ['pending', 'ongoing', 'completed'], default: 'pending' },
    allowedStatuses: [{ type: String, enum: ['pending', 'ongoing', 'completed', 'cancelled'] }],
    defaultYearFilter: { type: Boolean, default: true } // Auto-select latest year
  },
  
  // 3. Billing & Collection Settings
  billingConfig: {
    billingStatusLabels: {
      billed: { type: String, default: 'Billed' },
      unbilled: { type: String, default: 'Unbilled' }
    },
    paymentStatusLabels: {
      paid: { type: String, default: 'Paid' },
      unpaid: { type: String, default: 'Unpaid' },
      uncollectible: { type: String, default: 'Uncollectible' }
    },
    requireCheckNumber: { type: Boolean, default: false },
    requireBINumber: { type: Boolean, default: false }
  },
  
  // 4. Notification System Settings
  notificationConfig: {
    enabled: { type: Boolean, default: true },
    projectEndDate: { type: Boolean, default: true },
    billingFollowUp: { type: Boolean, default: true },
    paymentOverdue: { type: Boolean, default: true },
    systemAnnouncements: { type: Boolean, default: true },
    unpaidAfterCompletion: { type: Boolean, default: true },
    timing: {
      daysBefore3: { type: Boolean, default: true },
      daysBefore2: { type: Boolean, default: true },
      daysBefore1: { type: Boolean, default: true }
    },
    overdueTriggerDays: { type: Number, default: 1 } // Days after end date
  },
  
  // 5. Data Management & Backup
  backupConfig: {
    autoBackup: { type: Boolean, default: false },
    backupFrequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    lastBackup: Date,
    backupLocation: String
  },
  
  // 6. Export & Reporting Settings
  exportConfig: {
    defaultFormat: { type: String, enum: ['xlsx', 'csv', 'pdf'], default: 'xlsx' },
    includeCompanyInfo: { type: Boolean, default: true },
    reportHeaderLogo: String,
    defaultColumns: [String] // Array of column names
  },
  
  // 7. System Appearance & Branding
  appearanceConfig: {
    themeColor: { type: String, default: 'red' }, // red, blue, green, etc.
    buttonStyle: { type: String, enum: ['rounded', 'sharp'], default: 'rounded' },
    sidebarLayout: { type: String, enum: ['expanded', 'collapsed'], default: 'expanded' },
    logoInNavbar: { type: Boolean, default: true }
  },
  
  // 8. Audit Logs & Activity Tracking
  auditConfig: {
    enabled: { type: Boolean, default: true },
    logProjectCreation: { type: Boolean, default: true },
    logDataEdits: { type: Boolean, default: true },
    logDeletions: { type: Boolean, default: true },
    logLoginLogout: { type: Boolean, default: true }
  },
  
  // 9. PWA & Offline Settings
  pwaConfig: {
    offlineMode: { type: Boolean, default: true },
    autoSync: { type: Boolean, default: true },
    cacheSize: Number, // in MB
    lastSync: Date
  },
  
  // General Settings
  settings: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'PHP', 'JPY', 'CNY']
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    fiscalYearStart: {
      type: String,
      default: '01-01'
    }
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const CompanyProfile = mongoose.model('CompanyProfile', companyProfileSchema);

export default CompanyProfile;

