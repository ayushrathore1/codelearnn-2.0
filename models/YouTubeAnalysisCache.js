const mongoose = require('mongoose');

/**
 * YouTubeAnalysisCache Schema - Stores analyzed YouTube tutorials
 * Only tech/programming tutorials are saved (validated by AI)
 * Categories are auto-generated based on video content
 */
const youtubeAnalysisCacheSchema = new mongoose.Schema({
  // YouTube identifier
  youtubeId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Content type
  type: {
    type: String,
    enum: ['video', 'playlist'],
    required: true,
    index: true
  },

  // Video/playlist metadata for search
  title: {
    type: String,
    required: true,
    trim: true
  },
  channelName: {
    type: String,
    trim: true
  },
  thumbnail: String,
  duration: String,

  // Hierarchical categorization (auto-detected by AI)
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Full analysis data
  analysisData: {
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

// Text index for full-text search
youtubeAnalysisCacheSchema.index(
  { title: 'text', tags: 'text', channelName: 'text' },
  { weights: { title: 10, tags: 5, channelName: 3 } }
);

// Compound indexes for efficient browsing
youtubeAnalysisCacheSchema.index({ category: 1, subcategory: 1 });
youtubeAnalysisCacheSchema.index({ category: 1, usageCount: -1 });
youtubeAnalysisCacheSchema.index({ type: 1, category: 1 });

/**
 * Static: Find by YouTube ID
 */
youtubeAnalysisCacheSchema.statics.findByYoutubeId = async function(youtubeId) {
  const cached = await this.findOneAndUpdate(
    { youtubeId },
    { 
      $inc: { usageCount: 1 },
      $set: { lastAccessedAt: new Date() }
    },
    { new: true }
  );
  return cached;
};

/**
 * Static: Search tutorials with text search
 */
youtubeAnalysisCacheSchema.statics.search = async function(query, options = {}) {
  const { page = 1, limit = 20, category, type } = options;
  
  const filter = { $text: { $search: query } };
  if (category) filter.category = category.toLowerCase();
  if (type) filter.type = type;

  return this.find(filter)
    .sort({ score: { $meta: 'textScore' }, usageCount: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('youtubeId type title channelName thumbnail category subcategory tags usageCount');
};

/**
 * Static: Browse by category
 */
youtubeAnalysisCacheSchema.statics.browseByCategory = async function(category, options = {}) {
  const { subcategory, type, page = 1, limit = 20 } = options;
  
  const filter = { category: category.toLowerCase() };
  if (subcategory) filter.subcategory = subcategory.toLowerCase();
  if (type) filter.type = type;

  return this.find(filter)
    .sort({ usageCount: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('youtubeId type title channelName thumbnail category subcategory tags usageCount duration');
};

/**
 * Static: Get category tree with counts
 */
youtubeAnalysisCacheSchema.statics.getCategoryTree = async function() {
  return this.aggregate([
    {
      $group: {
        _id: { category: '$category', subcategory: '$subcategory' },
        count: { $sum: 1 },
        totalUsage: { $sum: '$usageCount' }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        subcategories: {
          $push: {
            name: '$_id.subcategory',
            count: '$count',
            totalUsage: '$totalUsage'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
};

/**
 * Static: Get popular tutorials
 */
youtubeAnalysisCacheSchema.statics.getPopular = async function(limit = 10) {
  return this.find()
    .sort({ usageCount: -1 })
    .limit(limit)
    .select('youtubeId type title channelName thumbnail category subcategory usageCount duration');
};

const YouTubeAnalysisCache = mongoose.model('YouTubeAnalysisCache', youtubeAnalysisCacheSchema);

module.exports = YouTubeAnalysisCache;
