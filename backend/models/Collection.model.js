import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  billingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    required: [true, 'Billing ID is required']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  collectionNumber: {
    type: String,
    required: [true, 'Collection number is required'],
    unique: true,
    trim: true
  },
  collectionDate: {
    type: Date,
    required: [true, 'Collection date is required'],
    default: Date.now
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'check', 'bank_transfer', 'credit_card', 'other'],
    default: 'bank_transfer'
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'partial', 'uncollectible'],
    default: 'unpaid'
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  checkNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
collectionSchema.index({ billingId: 1 });
collectionSchema.index({ projectId: 1 });
collectionSchema.index({ status: 1 });
collectionSchema.index({ collectionDate: -1 });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;

