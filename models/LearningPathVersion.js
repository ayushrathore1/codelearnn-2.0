const mongoose = require('mongoose');

/**
 * LearningPathVersion Schema - Version history for learning paths
 * 
 * Captures snapshots of learning path state at significant points:
 * - User edits (manual changes)
 * - AI suggestions (accepted recommendations)
 * - System events (auto-generated changes)
 * 
 * Use cases:
 * - Undo/redo functionality
 * - Audit trail for path evolution
 * - AI suggestion tracking
 */

const learningPathVersionSchema = new mongoose.Schema({
  // Reference to the learning path
  pathId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLearningPath',
    required: true,
    index: true
  },

  // User who owns the path (denormalized for query efficiency)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Version number (auto-incremented per path)
  versionNumber: {
    type: Number,
    required: true,
    min: 1
  },

  // Reason for version creation
  reason: {
    type: String,
    enum: [
      'user_edit',        // User manually edited the path
      'video_added',      // Video was added to the path
      'video_removed',    // Video was removed from the path
      'reorder',          // Nodes were reordered
      'node_completed',   // A node was marked complete
      'ai_suggestion',    // AI suggestion was accepted
      'branch_created',   // A branch was created
      'path_activated',   // Path was set as active
      'path_created',     // Initial version when path is created
      'import',           // Imported from official path
      'bulk_operation'    // Multiple changes at once
    ],
    default: 'user_edit'
  },

  // Human-readable description of the change
  changeDescription: {
    type: String,
    maxlength: 500
  },

  // Full snapshot of the path at this version
  snapshot: {
    title: String,
    description: String,
    careerId: String,
    status: String,
    structureGraph: {
      nodes: [{
        id: String,
        videoId: String,
        title: String,
        order: Number,
        isCompleted: Boolean,
        completedAt: Date,
        notes: String
      }],
      edges: [{
        from: String,
        to: String,
        type: String
      }]
    },
    inferredSkills: [String],
    inferredCareers: [String],
    readinessScore: Number,
    visibility: String
  },

  // Delta from previous version (for efficient storage)
  // Only populated for minor changes
  delta: {
    addedNodes: [String],    // Node IDs added
    removedNodes: [String],  // Node IDs removed
    addedEdges: [{ from: String, to: String }],
    removedEdges: [{ from: String, to: String }],
    completedNodes: [String], // Node IDs marked complete
    metadataChanged: [String] // List of changed fields
  },

  // AI suggestion metadata (if applicable)
  aiSuggestion: {
    suggestionId: String,
    suggestionType: String,    // 'add_video', 'reorder', 'remove_video', 'add_skill'
    confidence: Number,
    reasoning: String,
    wasAccepted: Boolean
  },

  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }

}, {
  timestamps: false // We only need createdAt
});

// Compound indexes
learningPathVersionSchema.index({ pathId: 1, versionNumber: -1 });
learningPathVersionSchema.index({ pathId: 1, createdAt: -1 });
learningPathVersionSchema.index({ userId: 1, createdAt: -1 });

/**
 * Static: Create a new version for a path
 */
learningPathVersionSchema.statics.createVersion = async function(
  pathId, 
  userId, 
  reason, 
  snapshot, 
  options = {}
) {
  const { changeDescription, delta, aiSuggestion } = options;

  // Get the next version number
  const lastVersion = await this.findOne({ pathId })
    .sort({ versionNumber: -1 })
    .select('versionNumber');
  
  const versionNumber = lastVersion ? lastVersion.versionNumber + 1 : 1;

  return this.create({
    pathId,
    userId,
    versionNumber,
    reason,
    changeDescription,
    snapshot,
    delta,
    aiSuggestion
  });
};

/**
 * Static: Get version history for a path
 */
learningPathVersionSchema.statics.getHistory = async function(pathId, options = {}) {
  const { limit = 20, offset = 0 } = options;

  return this.find({ pathId })
    .sort({ versionNumber: -1 })
    .skip(offset)
    .limit(limit)
    .select('-snapshot.structureGraph.nodes.notes'); // Exclude notes for list view
};

/**
 * Static: Get a specific version
 */
learningPathVersionSchema.statics.getVersion = async function(pathId, versionNumber) {
  return this.findOne({ pathId, versionNumber });
};

/**
 * Static: Get latest version
 */
learningPathVersionSchema.statics.getLatestVersion = async function(pathId) {
  return this.findOne({ pathId })
    .sort({ versionNumber: -1 });
};

/**
 * Static: Compare two versions
 * Returns delta between versions
 */
learningPathVersionSchema.statics.compare = async function(pathId, fromVersion, toVersion) {
  const [v1, v2] = await Promise.all([
    this.findOne({ pathId, versionNumber: fromVersion }),
    this.findOne({ pathId, versionNumber: toVersion })
  ]);

  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }

  const fromNodes = new Set(v1.snapshot.structureGraph.nodes.map(n => n.id));
  const toNodes = new Set(v2.snapshot.structureGraph.nodes.map(n => n.id));

  const addedNodes = v2.snapshot.structureGraph.nodes
    .filter(n => !fromNodes.has(n.id))
    .map(n => ({ id: n.id, title: n.title }));
  
  const removedNodes = v1.snapshot.structureGraph.nodes
    .filter(n => !toNodes.has(n.id))
    .map(n => ({ id: n.id, title: n.title }));

  // Edge comparison
  const fromEdges = new Set(v1.snapshot.structureGraph.edges.map(e => `${e.from}->${e.to}`));
  const toEdges = new Set(v2.snapshot.structureGraph.edges.map(e => `${e.from}->${e.to}`));

  const addedEdges = v2.snapshot.structureGraph.edges
    .filter(e => !fromEdges.has(`${e.from}->${e.to}`));
  
  const removedEdges = v1.snapshot.structureGraph.edges
    .filter(e => !toEdges.has(`${e.from}->${e.to}`));

  return {
    from: { version: v1.versionNumber, createdAt: v1.createdAt },
    to: { version: v2.versionNumber, createdAt: v2.createdAt },
    changes: {
      addedNodes,
      removedNodes,
      addedEdges,
      removedEdges,
      titleChanged: v1.snapshot.title !== v2.snapshot.title,
      descriptionChanged: v1.snapshot.description !== v2.snapshot.description,
      statusChanged: v1.snapshot.status !== v2.snapshot.status
    }
  };
};

/**
 * Static: Cleanup old versions (keep last N versions per path)
 */
learningPathVersionSchema.statics.cleanup = async function(pathId, keepCount = 50) {
  const versions = await this.find({ pathId })
    .sort({ versionNumber: -1 })
    .select('_id versionNumber');

  if (versions.length <= keepCount) {
    return { deleted: 0 };
  }

  const toDelete = versions.slice(keepCount).map(v => v._id);
  const result = await this.deleteMany({ _id: { $in: toDelete } });

  return { deleted: result.deletedCount };
};

/**
 * Static: Get AI suggestion acceptance rate
 */
learningPathVersionSchema.statics.getAISuggestionStats = async function(userId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        reason: 'ai_suggestion',
        createdAt: { $gte: since }
      }
    },
    {
      $group: {
        _id: '$aiSuggestion.suggestionType',
        total: { $sum: 1 },
        accepted: { $sum: { $cond: ['$aiSuggestion.wasAccepted', 1, 0] } }
      }
    }
  ]);

  return stats.reduce((acc, s) => {
    acc[s._id] = {
      total: s.total,
      accepted: s.accepted,
      rate: s.total > 0 ? (s.accepted / s.total * 100).toFixed(1) : 0
    };
    return acc;
  }, {});
};

const LearningPathVersion = mongoose.model('LearningPathVersion', learningPathVersionSchema);

module.exports = LearningPathVersion;
