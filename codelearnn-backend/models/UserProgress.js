const mongoose = require('mongoose');

/**
 * User Progress Model
 * Tracks user's learning progress across resources and paths
 */
const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Completed Resources
  completedResources: [{
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: {
      type: String,
      maxlength: 1000
    },
    timeSpent: {
      type: Number, // Minutes
      default: 0
    }
  }],

  // Currently In Progress
  inProgressResources: [{
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number, // 0-100
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // Minutes
      default: 0
    }
  }],

  // Bookmarked/Saved Resources
  savedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],

  // AI Generated Personalized Paths
  personalizedPaths: [{
    path: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalizedPath'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],

  // Overall Stats
  stats: {
    totalTimeSpent: { type: Number, default: 0 }, // Minutes
    totalCompleted: { type: Number, default: 0 },
    totalInProgress: { type: Number, default: 0 },
    totalSaved: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    xp: { type: Number, default: 0 }
  },

  // Domain Progress
  domainProgress: [{
    domain: String,
    resourcesCompleted: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }
  }],

  // Activity History (last 30 days)
  activityLog: [{
    date: Date,
    resourcesCompleted: { type: Number, default: 0 },
    timeSpent: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Static: Get or create progress for user
UserProgressSchema.statics.getOrCreate = async function(userId) {
  let progress = await this.findOne({ user: userId });
  if (!progress) {
    progress = await this.create({ user: userId });
  }
  return progress;
};

// Method: Mark resource as started
UserProgressSchema.methods.startResource = async function(resourceId) {
  // Check if already in progress
  const existing = this.inProgressResources.find(
    r => r.resource.toString() === resourceId.toString()
  );
  
  if (!existing) {
    this.inProgressResources.push({
      resource: resourceId,
      startedAt: new Date(),
      progress: 0,
      lastAccessedAt: new Date()
    });
    this.stats.totalInProgress = this.inProgressResources.length;
  } else {
    existing.lastAccessedAt = new Date();
  }
  
  this.stats.lastActiveAt = new Date();
  return this.save();
};

// Method: Update resource progress
UserProgressSchema.methods.updateResourceProgress = async function(resourceId, progress, timeSpent = 0) {
  const resource = this.inProgressResources.find(
    r => r.resource.toString() === resourceId.toString()
  );
  
  if (resource) {
    resource.progress = progress;
    resource.lastAccessedAt = new Date();
    resource.timeSpent = (resource.timeSpent || 0) + timeSpent;
    this.stats.totalTimeSpent += timeSpent;
    this.stats.lastActiveAt = new Date();
  }
  
  return this.save();
};

// Method: Mark resource as complete
UserProgressSchema.methods.completeResource = async function(resourceId, rating = null, notes = '', timeSpent = 0) {
  // Remove from in progress
  this.inProgressResources = this.inProgressResources.filter(
    r => r.resource.toString() !== resourceId.toString()
  );
  
  // Check if already completed
  const alreadyCompleted = this.completedResources.find(
    r => r.resource.toString() === resourceId.toString()
  );
  
  if (!alreadyCompleted) {
    this.completedResources.push({
      resource: resourceId,
      completedAt: new Date(),
      rating,
      notes,
      timeSpent
    });
    
    // Update stats
    this.stats.totalCompleted = this.completedResources.length;
    this.stats.totalInProgress = this.inProgressResources.length;
    this.stats.totalTimeSpent += timeSpent;
    this.stats.xp += 50; // XP for completing a resource
    this.stats.lastActiveAt = new Date();
    
    // Update streak
    await this.updateStreak();
  }
  
  return this.save();
};

// Method: Save/bookmark resource
UserProgressSchema.methods.saveResource = async function(resourceId) {
  if (!this.savedResources.includes(resourceId)) {
    this.savedResources.push(resourceId);
    this.stats.totalSaved = this.savedResources.length;
  }
  return this.save();
};

// Method: Unsave resource
UserProgressSchema.methods.unsaveResource = async function(resourceId) {
  this.savedResources = this.savedResources.filter(
    r => r.toString() !== resourceId.toString()
  );
  this.stats.totalSaved = this.savedResources.length;
  return this.save();
};

// Method: Update streak
UserProgressSchema.methods.updateStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastActive = new Date(this.stats.lastActiveAt);
  lastActive.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
  
  if (daysDiff === 0) {
    // Same day, streak continues
  } else if (daysDiff === 1) {
    // Next day, increment streak
    this.stats.currentStreak += 1;
  } else {
    // Streak broken
    this.stats.currentStreak = 1;
  }
  
  if (this.stats.currentStreak > this.stats.longestStreak) {
    this.stats.longestStreak = this.stats.currentStreak;
  }
};

// Method: Get progress summary
UserProgressSchema.methods.getSummary = function() {
  return {
    totalCompleted: this.stats.totalCompleted,
    totalInProgress: this.stats.totalInProgress,
    totalSaved: this.stats.totalSaved,
    totalTimeSpent: this.stats.totalTimeSpent,
    currentStreak: this.stats.currentStreak,
    longestStreak: this.stats.longestStreak,
    xp: this.stats.xp,
    lastActiveAt: this.stats.lastActiveAt
  };
};

module.exports = mongoose.model('UserProgress', UserProgressSchema);
