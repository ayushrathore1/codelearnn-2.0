const mongoose = require('mongoose');

/**
 * CareerDomainCache Schema - Stores career domain detail analyses
 * Persistent storage for getDomainDetails() responses
 */
const careerDomainCacheSchema = new mongoose.Schema({
  // Unique identifier combining domain name and parent keyword
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },

  // Domain name
  domainName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Parent keyword for context
  parentKeyword: {
    type: String,
    trim: true,
    lowercase: true,
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
careerDomainCacheSchema.index({ domainName: 1, parentKeyword: 1 });
careerDomainCacheSchema.index({ usageCount: -1 });

/**
 * Static: Find by domain and parent keyword
 */
careerDomainCacheSchema.statics.findByDomain = async function(domainName, parentKeyword) {
  const cacheKey = `${domainName.toLowerCase()}_${(parentKeyword || domainName).toLowerCase()}`;
  
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
 * Static: Save domain details to cache
 */
careerDomainCacheSchema.statics.saveToCache = async function(domainName, parentKeyword, analysis) {
  const cacheKey = `${domainName.toLowerCase()}_${(parentKeyword || domainName).toLowerCase()}`;
  
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
      domainName,
      parentKeyword: parentKeyword || domainName,
      analysis
    });
    await entry.save();
    return entry;
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
    // Handle race condition - just return the existing one
    return this.findOne({ cacheKey });
  }
};

/**
 * Static: Get popular domains
 */
careerDomainCacheSchema.statics.getPopular = async function(limit = 10) {
  return this.find()
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('domainName parentKeyword usageCount');
};

const CareerDomainCache = mongoose.model('CareerDomainCache', careerDomainCacheSchema);

module.exports = CareerDomainCache;
