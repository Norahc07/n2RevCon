import mongoose from 'mongoose';

const revenueSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  revenueCode: {
    type: String,
    required: [true, 'Revenue code is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  category: {
    type: String,
    enum: ['service', 'product', 'consultation', 'other'],
    default: 'service'
  },
  status: {
    type: String,
    enum: ['recorded', 'confirmed', 'cancelled'],
    default: 'recorded'
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
revenueSchema.index({ projectId: 1, date: -1 });
revenueSchema.index({ date: -1 });

const Revenue = mongoose.model('Revenue', revenueSchema);

export default Revenue;

