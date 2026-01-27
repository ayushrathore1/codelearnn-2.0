const mongoose = require('mongoose');

/**
 * CareerJobRoleCache Schema - Stores job role detail analyses
 * Persistent storage for getJobRoleDetails() responses
 */
const careerJobRoleCacheSchema = new mongoose.Schema({
  // Unique identifier combining role name and domain
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },

  // Job role name
  roleName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Domain context
  domain: {
    type: String,
    trim: true,
    index: true
  },

  // Full analysis response from AI
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Usage tracking
  usageCount: {
    type: Number,
    default: 1
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient lookups
careerJobRoleCacheSchema.index({ roleName: 1, domain: 1 });
careerJobRoleCacheSchema.index({ usageCount: -1 });

/**
 * Static: Find by role and domain
 */
careerJobRoleCacheSchema.statics.findByRole = async function(roleName, domain) {
  const cacheKey = `${roleName.toLowerCase()}_${(domain || 'general').toLowerCase()}`;
  
  const cached = await this.findOneAndUpdate(
    { cacheKey },
    { 
      $inc: { usageCount: 1 },
      $set: { lastAccessedAt: new Date() }
    },
    { new: true }
  );
  return cached;
};

/**
 * Static: Save role details to cache
 */
careerJobRoleCacheSchema.statics.saveToCache = async function(roleName, domain, analysis) {
  const cacheKey = `${roleName.toLowerCase()}_${(domain || 'general').toLowerCase()}`;
  
  try {
    const existing = await this.findOne({ cacheKey });
    if (existing) {
      existing.analysis = analysis;
      existing.lastAccessedAt = new Date();
      await existing.save();
      return existing;
    }

    const entry = new this({
      cacheKey,
      roleName,
      domain: domain || 'general',
      analysis
    });
    await entry.save();
    return entry;
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
    // Handle race condition
    return this.findOne({ cacheKey });
  }
};

/**
 * Static: Get popular roles
 */
careerJobRoleCacheSchema.statics.getPopular = async function(limit = 10) {
  return this.find()
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('roleName domain usageCount');
};

const CareerJobRoleCache = mongoose.model('CareerJobRoleCache', careerJobRoleCacheSchema);

module.exports = CareerJobRoleCache;
