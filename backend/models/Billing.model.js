import mongoose from 'mongoose';

const billingSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true
  },
  billingDate: {
    type: Date,
    required: [true, 'Billing date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  description: {
    type: String,
    trim: true
  },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    amount: Number
  }],
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
billingSchema.index({ projectId: 1, billingDate: -1 });
billingSchema.index({ status: 1 });
billingSchema.index({ dueDate: 1 });

// Calculate total before saving
// Logic: Amount - Tax = Total Amount (subtraction, not addition)
billingSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('tax')) {
    // Only auto-calculate if totalAmount wasn't explicitly set
    // This allows frontend to send the calculated value, but ensures consistency
    if (!this.isModified('totalAmount') || this.totalAmount === undefined) {
      this.totalAmount = this.amount - (this.tax || 0);
    }
  }
  next();
});

const Billing = mongoose.model('Billing', billingSchema);

export default Billing;

