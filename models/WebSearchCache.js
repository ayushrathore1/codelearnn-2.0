const mongoose = require('mongoose');

/**
 * WebSearchCache Schema - Stores SERP API search results permanently
 * Provides real-time web data for career guidance
 */
const webSearchCacheSchema = new mongoose.Schema({
  // Search query (normalized)
  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },

  // Type of search
  searchType: {
    type: String,
    enum: ['technology', 'market_trends', 'news', 'general'],
    required: true,
    index: true
  },

  // Unique key combining query and type
  cacheKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Search results data
  results: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Extracted insights from search
  insights: {
    latestVersion: String,
    useCases: [String],
    marketDemand: String,
    salaryRange: {
      min: Number,
      max: Number,
      currency: { type: String, default: 'USD' }
    },
    trendingTopics: [String],
    topCompanies: [String]
  },

  // Source info
  source: {
    type: String,
    default: 'serpapi'
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

// Compound index
webSearchCacheSchema.index({ query: 1, searchType: 1 });
webSearchCacheSchema.index({ usageCount: -1 });

/**
 * Static: Find cached search
 */
webSearchCacheSchema.statics.findByQuery = async function(query, searchType) {
  const cacheKey = `${query.toLowerCase().trim()}_${searchType}`;
  
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
 * Static: Save search results
 */
webSearchCacheSchema.statics.saveSearch = async function(query, searchType, results, insights = {}) {
  const cacheKey = `${query.toLowerCase().trim()}_${searchType}`;
  
  try {
    return await this.findOneAndUpdate(
      { cacheKey },
      {
        $set: {
          query: query.toLowerCase().trim(),
          searchType,
          results,
          insights,
          lastAccessedAt: new Date()
        },
        $inc: { usageCount: 1 }
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return this.findOne({ cacheKey });
  }
};

const WebSearchCache = mongoose.model('WebSearchCache', webSearchCacheSchema);

module.exports = WebSearchCache;
