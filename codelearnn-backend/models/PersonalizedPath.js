const mongoose = require('mongoose');

/**
 * Personalized Path Model
 * AI-generated learning paths customized for each user's goals
 */
const PersonalizedPathSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Path Info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  goal: {
    type: String,
    required: true,
    trim: true // User's learning goal e.g., "Become a React developer"
  },
  
  // User Context (used for generation)
  userContext: {
    currentLevel: {
      type: String,
      enum: ['complete-beginner', 'beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    priorKnowledge: [String], // Skills user already has
    timeAvailable: String, // e.g., "10 hours/week"
    preferredContentType: [String], // ['video', 'article', 'interactive']
    targetTimeframe: String // e.g., "3 months"
  },
  
  // AI Generated Structure
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    order: {
      type: Number,
      required: true
    },
    estimatedDuration: String, // e.g., "2 weeks"
    
    // Resources for this milestone
    resources: [{
      resource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resource'
      },
      order: Number,
      isRequired: { type: Boolean, default: true },
      isCompleted: { type: Boolean, default: false },
      completedAt: Date
    }],
    
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  
  // Generation Metadata
  generation: {
    model: {
      type: String,
      default: 'groq-llama' // AI model used
    },
    prompt: String, // The prompt used for generation
    resourcesConsidered: Number, // How many resources were in the pool
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  
  // Estimated Info
  estimatedDuration: String, // Total time e.g., "45 hours"
  totalResources: {
    type: Number,
    default: 0
  },
  
  // Progress Tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedMilestones: {
    type: Number,
    default: 0
  },
  completedResources: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'abandoned'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
PersonalizedPathSchema.index({ user: 1, status: 1 });

// Method: Calculate overall progress
PersonalizedPathSchema.methods.calculateProgress = function() {
  if (this.totalResources === 0) return 0;
  
  let completed = 0;
  this.milestones.forEach(milestone => {
    milestone.resources.forEach(r => {
      if (r.isCompleted) completed++;
    });
  });
  
  this.completedResources = completed;
  this.progress = Math.round((completed / this.totalResources) * 100);
  
  // Count completed milestones
  this.completedMilestones = this.milestones.filter(m => m.isCompleted).length;
  
  // Check if path is complete
  if (this.progress === 100) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return this.progress;
};

// Method: Mark resource as complete
PersonalizedPathSchema.methods.completeResource = async function(milestoneIndex, resourceId) {
  const milestone = this.milestones[milestoneIndex];
  if (!milestone) return this;
  
  const resource = milestone.resources.find(
    r => r.resource.toString() === resourceId.toString()
  );
  
  if (resource && !resource.isCompleted) {
    resource.isCompleted = true;
    resource.completedAt = new Date();
    
    // Check if milestone is complete
    const allComplete = milestone.resources.every(r => r.isCompleted);
    if (allComplete) {
      milestone.isCompleted = true;
      milestone.completedAt = new Date();
    }
    
    this.calculateProgress();
    this.lastAccessedAt = new Date();
  }
  
  return this.save();
};

// Method: Get next resource to learn
PersonalizedPathSchema.methods.getNextResource = function() {
  for (const milestone of this.milestones) {
    for (const resource of milestone.resources) {
      if (!resource.isCompleted) {
        return {
          milestoneIndex: milestone.order,
          milestoneTitle: milestone.title,
          resource: resource.resource
        };
      }
    }
  }
  return null; // All complete
};

// Static: Get user's active paths
PersonalizedPathSchema.statics.getActivePaths = function(userId) {
  return this.find({ user: userId, status: 'active' })
    .sort({ lastAccessedAt: -1 })
    .populate('milestones.resources.resource', 'title url sourceType thumbnail duration');
};

// Static: Get user's path history
PersonalizedPathSchema.statics.getUserPaths = function(userId, status = null) {
  const query = { user: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .select('-milestones.resources');
};

module.exports = mongoose.model('PersonalizedPath', PersonalizedPathSchema);
