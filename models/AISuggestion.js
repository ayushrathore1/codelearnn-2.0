const mongoose = require('mongoose');

/**
 * AISuggestion Schema - AI-generated suggestions for learning paths
 * 
 * Stores AI suggestions with:
 * - Clear reasoning (explainability)
 * - Confidence scores
 * - User response tracking
 * - Context about when/why suggestion was made
 */

const aiSuggestionSchema = new mongoose.Schema({
  // Reference to the learning path
  pathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLearningPath',
    required: true,
    index: true
  },

  // User who owns the path
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Type of suggestion
  suggestionType: {
    type: String,
    enum: [
      'add_video',           // Suggest adding a specific video
      'add_skill_video',     // Suggest videos for a missing skill
      'reorder',             // Suggest reordering nodes
      'remove_duplicate',    // Suggest removing duplicate content
      'add_prerequisite',    // Suggest adding a prerequisite video
      'create_branch',       // Suggest creating an optional branch
      'improve_coverage',    // Suggest videos to improve skill coverage
      'career_alignment',    // Suggest changes for better career fit
      'consolidate',         // Suggest combining similar paths
      'next_step'            // Recommend what to learn next
    ],
    required: true,
    index: true
  },

  // Trigger event that caused this suggestion
  trigger: {
    type: String,
    enum: [
      'video_added',         // User added a video
      'video_removed',       // User removed a video
      'path_created',        // New path was created
      'career_changed',      // User changed active career
      'node_completed',      // User completed a node
      'periodic_review',     // Scheduled analysis
      'skill_gap_detected',  // Skills analysis found gaps
      'user_requested'       // User explicitly asked for suggestions
    ],
    required: true
  },

  // The proposed change
  proposedChange: {
    // For add_video suggestions
    videoId: String,
    videoTitle: String,
    videoUrl: String,
    
    // For reorder suggestions
    newOrder: [String],      // Node IDs in suggested order
    
    // For remove suggestions
    nodeIdToRemove: String,
    
    // For branch suggestions
    branchFromNodeId: String,
    branchVideos: [{
      videoId: String,
      title: String
    }],
    
    // For skill-based suggestions
    targetSkill: String,
    suggestedVideos: [{
      videoId: String,
      title: String,
      relevanceScore: Number
    }]
  },

  // AI reasoning (explainability)
  reasoning: {
    summary: {
      type: String,
      required: true,
      maxlength: 500
    },
    details: [String],       // Bullet points explaining why
    dataPoints: [{           // Supporting data
      label: String,
      value: mongoose.Schema.Types.Mixed
    }]
  },

  // Confidence score (0-1)
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },

  // Priority (for ordering multiple suggestions)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'dismissed'],
    default: 'pending',
    index: true
  },

  // User response
  userResponse: {
    respondedAt: Date,
    action: {
      type: String,
      enum: ['accepted', 'rejected', 'modified', 'dismissed']
    },
    feedback: String,        // Optional user feedback
    modifiedChange: mongoose.Schema.Types.Mixed  // If user modified the suggestion
  },

  // Context at time of suggestion
  context: {
    pathProgress: Number,    // Progress % at time of suggestion
    completedNodes: Number,
    totalNodes: Number,
    activeCareerId: String,
    recentActivity: [String] // Recent actions that influenced suggestion
  },

  // Expiration
  expiresAt: {
    type: Date,
    index: true
  }

}, {
  timestamps: true
});

// Indexes
aiSuggestionSchema.index({ pathId: 1, status: 1 });
aiSuggestionSchema.index({ userId: 1, status: 1, createdAt: -1 });
aiSuggestionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

/**
 * Static: Get pending suggestions for a path
 */
aiSuggestionSchema.statics.getPendingForPath = async function(pathId, limit = 5) {
  return this.find({
    pathId,
    status: 'pending',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  })
    .sort({ priority: -1, confidence: -1, createdAt: -1 })
    .limit(limit);
};

/**
 * Static: Get pending suggestions for a user
 */
aiSuggestionSchema.statics.getPendingForUser = async function(userId, limit = 10) {
  return this.find({
    userId,
    status: 'pending',
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  })
    .sort({ priority: -1, confidence: -1, createdAt: -1 })
    .limit(limit)
    .populate('pathId', 'title status');
};

/**
 * Static: Accept a suggestion
 */
aiSuggestionSchema.statics.accept = async function(suggestionId, userId, feedback = null) {
  return this.findOneAndUpdate(
    { _id: suggestionId, userId, status: 'pending' },
    {
      $set: {
        status: 'accepted',
        'userResponse.respondedAt': new Date(),
        'userResponse.action': 'accepted',
        'userResponse.feedback': feedback
      }
    },
    { new: true }
  );
};

/**
 * Static: Reject a suggestion
 */
aiSuggestionSchema.statics.reject = async function(suggestionId, userId, feedback = null) {
  return this.findOneAndUpdate(
    { _id: suggestionId, userId, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        'userResponse.respondedAt': new Date(),
        'userResponse.action': 'rejected',
        'userResponse.feedback': feedback
      }
    },
    { new: true }
  );
};

/**
 * Static: Dismiss a suggestion (user acknowledged but no action)
 */
aiSuggestionSchema.statics.dismiss = async function(suggestionId, userId) {
  return this.findOneAndUpdate(
    { _id: suggestionId, userId, status: 'pending' },
    {
      $set: {
        status: 'dismissed',
        'userResponse.respondedAt': new Date(),
        'userResponse.action': 'dismissed'
      }
    },
    { new: true }
  );
};

/**
 * Static: Get suggestion stats for a user
 */
aiSuggestionSchema.statics.getStats = async function(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    dismissed: 0,
    acceptanceRate: 0
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  if (result.accepted + result.rejected > 0) {
    result.acceptanceRate = Math.round(
      (result.accepted / (result.accepted + result.rejected)) * 100
    );
  }

  return result;
};

/**
 * Static: Expire old pending suggestions
 */
aiSuggestionSchema.statics.expireOld = async function(daysOld = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  return this.updateMany(
    {
      status: 'pending',
      createdAt: { $lt: cutoff }
    },
    {
      $set: { status: 'expired' }
    }
  );
};

const AISuggestion = mongoose.model('AISuggestion', aiSuggestionSchema);

module.exports = AISuggestion;
