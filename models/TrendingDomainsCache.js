const mongoose = require('mongoose');

/**
 * TrendingDomainsCache Schema - Stores trending domains analyses
 * Persistent storage for getTrendingDomains() responses
 * Uses TTL index to auto-expire after 24 hours (data should be refreshed daily)
 */
const trendingDomainsCacheSchema = new mongoose.Schema({
  // Cache key - always 'trending_domains' for singleton
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    default: 'trending_domains',
    index: true
  },

  // Full trending domains data from AI
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Usage tracking
  usageCount: {
    type: Number,
    default: 1
  },

  // When this cache entry expires and should be refreshed
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    index: { expires: 0 } // TTL index
  }
}, {
  timestamps: true
});

/**
 * Static: Get cached trending domains
 */
trendingDomainsCacheSchema.statics.getCached = async function() {
  const cached = await this.findOneAndUpdate(
    { cacheKey: 'trending_domains' },
    { 
      $inc: { usageCount: 1 }
    },
    { new: true }
  );
  
  // Check if cache is still valid (not expired)
  if (cached && cached.expiresAt > new Date()) {
    return cached.data;
  }
  
  return null;
};

/**
 * Static: Save trending domains to cache
 */
trendingDomainsCacheSchema.statics.saveToCache = async function(data) {
  try {
    const result = await this.findOneAndUpdate(
      { cacheKey: 'trending_domains' },
      {
        $set: {
          data,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        },
        $inc: { usageCount: 1 }
      },
      { upsert: true, new: true }
    );
    return result;
  } catch (error) {
    console.error('Failed to save trending domains cache:', error);
    throw error;
  }
};

const TrendingDomainsCache = mongoose.model('TrendingDomainsCache', trendingDomainsCacheSchema);

module.exports = TrendingDomainsCache;
