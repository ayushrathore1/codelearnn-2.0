const mongoose = require('mongoose');

/**
 * CareerKeywordCache Schema - Stores career-related keyword analyses
 * Only career-related keywords are saved (validated by AI)
 * Categories are auto-generated as new keywords are analyzed
 */
const careerKeywordCacheSchema = new mongoose.Schema({
  // Search keyword (normalized to lowercase)
  keyword: {
    type: String,
    required: [true, 'Keyword is required'],
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },

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

  // Full AI analysis response
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

// Text index for full-text search
careerKeywordCacheSchema.index(
  { keyword: 'text', tags: 'text' },
  { weights: { keyword: 10, tags: 5 } }
);

// Compound indexes for efficient browsing
careerKeywordCacheSchema.index({ category: 1, subcategory: 1 });
careerKeywordCacheSchema.index({ category: 1, usageCount: -1 });

/**
 * Static: Find by keyword (case-insensitive)
 */
careerKeywordCacheSchema.statics.findByKeyword = async function(keyword) {
  const normalized = keyword.toLowerCase().trim();
  const cached = await this.findOneAndUpdate(
    { keyword: normalized },
    { 
      $inc: { usageCount: 1 },
      $set: { lastAccessedAt: new Date() }
    },
    { new: true }
  );
  return cached;
};

/**
 * Static: Search keywords with text search
 */
careerKeywordCacheSchema.statics.search = async function(query, options = {}) {
  const { page = 1, limit = 20, category } = options;
  
  const filter = { $text: { $search: query } };
  if (category) filter.category = category.toLowerCase();

  return this.find(filter)
    .sort({ score: { $meta: 'textScore' }, usageCount: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('keyword category subcategory tags usageCount');
};

/**
 * Static: Browse by category
 */
careerKeywordCacheSchema.statics.browseByCategory = async function(category, subcategory = null) {
  const filter = { category: category.toLowerCase() };
  if (subcategory) filter.subcategory = subcategory.toLowerCase();

  return this.find(filter)
    .sort({ usageCount: -1 })
    .select('keyword category subcategory tags usageCount');
};

/**
 * Static: Get category tree with counts
 */
careerKeywordCacheSchema.statics.getCategoryTree = async function() {
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

const CareerKeywordCache = mongoose.model('CareerKeywordCache', careerKeywordCacheSchema);

module.exports = CareerKeywordCache;
