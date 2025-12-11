const mongoose = require('mongoose');

const generationSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  modelId: {
    type: String,
    required: true
  },
  pose: {
    type: String,
    default: 'professional_standing'
  },
  provider: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  prompt: {
    type: String
  },
  imageUrl: {
    type: String
  },
  imagePath: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  processedFiles: [{
    type: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    analysis: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  error: {
    type: String
  },
  processingTime: {
    type: Number
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  userIp: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'generations'
});

// Index for efficient queries
generationSchema.index({ createdAt: -1 });
generationSchema.index({ status: 1 });
generationSchema.index({ modelId: 1, createdAt: -1 });

// Virtual for duration
generationSchema.virtual('duration').get(function() {
  if (this.endTime && this.startTime) {
    return this.endTime - this.startTime;
  }
  return null;
});

// Static methods
generationSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

generationSchema.statics.findByModelId = function(modelId, limit = 10) {
  return this.find({ modelId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

generationSchema.statics.findProcessingJobs = function() {
  return this.find({
    status: 'processing',
    startTime: {
      $lt: new Date(Date.now() - 5 * 60 * 1000) // Older than 5 minutes
    }
  });
};

// Instance methods
generationSchema.methods.updateProgress = function(progress, status = null) {
  this.progress = Math.min(100, Math.max(0, progress));
  if (status) {
    this.status = status;
  }
  return this.save();
};

generationSchema.methods.complete = function(result) {
  this.status = 'completed';
  this.progress = 100;
  this.endTime = new Date();
  this.processingTime = this.endTime - this.startTime;

  if (result) {
    this.imageUrl = result.imageUrl;
    this.imagePath = result.imagePath;
    this.prompt = result.prompt;
    this.metadata = result.metadata;
  }

  return this.save();
};

generationSchema.methods.fail = function(error) {
  this.status = 'failed';
  this.error = error;
  this.endTime = new Date();
  this.processingTime = this.endTime - this.startTime;
  return this.save();
};

module.exports = mongoose.model('Generation', generationSchema);