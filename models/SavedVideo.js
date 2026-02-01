const mongoose = require('mongoose');

/**
 * SavedVideo Schema - User's saved YouTube videos
 * 
 * This collection tracks videos that users explicitly save after analysis.
 * Separates VIDEO_ANALYZED from VIDEO_SAVED events for better control.
 * 
 * Flow:
 * 1. User analyzes video -> goes to YouTubeAnalysisCache (shared)
 * 2. User clicks "Add to Learning Path" -> creates SavedVideo (personal)
 * 3. SavedVideo can be added to UserLearningPath
 */

const savedVideoSchema = new mongoose.Schema({
  // User who saved the video
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // YouTube video identifier
  videoId: {
    type: String,
    required: true,
    trim: true
  },

  // Video metadata (copied from YouTubeAnalysisCache for quick access)
  title: {
    type: String,
    required: true,
    trim: true
  },
  channel: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    trim: true
  },
  thumbnail: {
    type: String
  },

  // Full analysis data (snapshot from YouTubeAnalysisCache)
  analyzedData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // AI-inferred metadata for filtering and recommendations
  inferredSkills: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  inferredCareers: [{
    type: String,
    trim: true
  }],

  // CodeLearnn quality score (0-100)
  codeLearnnScore: {
    type: Number,
    min: 0,
    max: 100
  },

  // Category from analysis
  category: {
    type: String,
    trim: true,
    lowercase: true
  },
  subcategory: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Learning path association (if added to a path)
  addedToPathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLearningPath',
    default: null
  },

  // Status within the path
  pathStatus: {
    type: String,
    enum: ['not_added', 'in_path', 'completed', 'skipped'],
    default: 'not_added'
  },

  // User's completion tracking
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },

  // Timestamps
  savedAt: {
    type: Date,
    default: Date.now
  },

  // Soft delete
  deletedAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true
});

// Compound index for user + video uniqueness (prevent duplicate saves)
savedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

// Index for fetching user's saved videos
savedVideoSchema.index({ userId: 1, savedAt: -1 });

// Index for filtering by career/skills
savedVideoSchema.index({ userId: 1, inferredCareers: 1 });
savedVideoSchema.index({ userId: 1, inferredSkills: 1 });

// Index for not-in-path videos
savedVideoSchema.index({ userId: 1, addedToPathId: 1 });

/**
 * Static: Get user's saved videos
 */
savedVideoSchema.statics.getUserVideos = async function(userId, options = {}) {
  const { 
    limit = 20, 
    skip = 0, 
    careerId = null, 
    inPath = null,
    includeDeleted = false 
  } = options;

  const filter = { userId };
  
  if (!includeDeleted) {
    filter.deletedAt = null;
  }
  
  if (careerId) {
    filter.inferredCareers = careerId;
  }
  
  if (inPath === true) {
    filter.addedToPathId = { $ne: null };
  } else if (inPath === false) {
    filter.addedToPathId = null;
  }

  return this.find(filter)
    .sort({ savedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-analyzedData'); // Exclude heavy analysis data for list view
};

/**
 * Static: Get video with full analysis data
 */
savedVideoSchema.statics.getVideoWithAnalysis = async function(userId, videoId) {
  return this.findOne({ 
    userId, 
    videoId, 
    deletedAt: null 
  });
};

/**
 * Static: Check if video is saved by user
 */
savedVideoSchema.statics.isVideoSaved = async function(userId, videoId) {
  const exists = await this.exists({ 
    userId, 
    videoId, 
    deletedAt: null 
  });
  return !!exists;
};

/**
 * Static: Soft delete a saved video
 */
savedVideoSchema.statics.softDelete = async function(userId, videoId) {
  return this.findOneAndUpdate(
    { userId, videoId },
    { 
      $set: { 
        deletedAt: new Date(),
        addedToPathId: null,
        pathStatus: 'not_added'
      }
    },
    { new: true }
  );
};

/**
 * Static: Restore a soft-deleted video
 */
savedVideoSchema.statics.restore = async function(userId, videoId) {
  return this.findOneAndUpdate(
    { userId, videoId, deletedAt: { $ne: null } },
    { $set: { deletedAt: null } },
    { new: true }
  );
};

/**
 * Static: Get count of saved videos for user
 */
savedVideoSchema.statics.getCountForUser = async function(userId) {
  return this.countDocuments({ userId, deletedAt: null });
};

/**
 * Static: Get videos not yet added to any path
 */
savedVideoSchema.statics.getUnassignedVideos = async function(userId, limit = 10) {
  return this.find({ 
    userId, 
    addedToPathId: null, 
    deletedAt: null 
  })
    .sort({ savedAt: -1 })
    .limit(limit)
    .select('videoId title channel duration thumbnail inferredSkills codeLearnnScore savedAt');
};

const SavedVideo = mongoose.model('SavedVideo', savedVideoSchema);

module.exports = SavedVideo;
