import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'backup', 'restore']
  },
  entity: {
    type: String,
    required: true,
    enum: ['project', 'revenue', 'expense', 'billing', 'collection', 'user', 'company', 'system']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityRef'
  },
  entityRef: {
    type: String,
    enum: ['Project', 'Revenue', 'Expense', 'Billing', 'Collection', 'User', 'CompanyProfile']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed // Store before/after values
  },
  ipAddress: String,
  userAgent: String,
  description: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed // Additional context
  }
}, {
  timestamps: true
});

// Index for faster queries
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;

