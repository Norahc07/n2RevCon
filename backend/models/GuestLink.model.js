import mongoose from 'mongoose';

const guestLinkSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['researcher', 'client'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: null // null means no expiration
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
guestLinkSchema.index({ token: 1 });
guestLinkSchema.index({ type: 1, isActive: 1 });
guestLinkSchema.index({ expiresAt: 1 });

const GuestLink = mongoose.model('GuestLink', guestLinkSchema);

export default GuestLink;

