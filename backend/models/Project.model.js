import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectCode: {
    type: String,
    required: [true, 'Project code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  projectName: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  actualEndDate: {
    type: Date
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    type: String,
    trim: true
  },
  projectManager: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  variableConsiderations: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
projectSchema.index({ status: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ clientName: 1 });
projectSchema.index({ deletedAt: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;

