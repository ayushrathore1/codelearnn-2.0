const mongoose = require('mongoose');

/**
 * Universal Resource Model
 * Supports multiple content sources: YouTube, edX, Coursera, articles, documentation, etc.
 */
const ResourceSchema = new mongoose.Schema({
  // Core Info
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  url: {
    type: String,
    required: [true, 'Resource URL is required'],
    trim: true
  },
  thumbnail: {
    type: String,
    default: ''
  },

  // Source Information
  sourceType: {
    type: String,
    required: true,
    enum: ['youtube', 'edx', 'coursera', 'udemy', 'article', 'documentation', 'github', 'freecodecamp', 'mdn', 'other'],
    index: true
  },
  sourceName: {
    type: String,
    trim: true // e.g., "freeCodeCamp", "Traversy Media", "MDN"
  },
  sourceId: {
    type: String,
    trim: true // e.g., YouTube video ID, course ID
  },

  // Categorization
  domain: {
    type: String,
    required: true,
    enum: ['frontend', 'backend', 'fullstack', 'mobile', 'devops', 'data-science', 'ai-ml', 'dsa', 'databases', 'security', 'cloud', 'other'],
    index: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    index: true // e.g., "React", "Python", "SQL"
  },
  subtopic: {
    type: String,
    trim: true // e.g., "Hooks", "OOP", "Joins"
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
    default: 'beginner',
    index: true
  },

  // Content Info
  contentType: {
    type: String,
    enum: ['video', 'article', 'course', 'tutorial', 'documentation', 'project', 'interactive', 'podcast'],
    default: 'video'
  },
  duration: {
    type: String, // "2h 30m", "15 min read", "40 hours"
    default: ''
  },
  language: {
    type: String,
    default: 'English'
  },

  // Quality Metrics
  qualityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 70,
    index: true
  },
  isCurated: {
    type: Boolean,
    default: false // Manually verified by admin
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false // For paid resources (edX verified, Udemy paid)
  },

  // Engagement Stats (can be updated periodically)
  stats: {
    views: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },

  // AI Evaluation (optional, for YouTube videos)
  aiAnalysis: {
    evaluated: { type: Boolean, default: false },
    summary: String,
    strengths: [String],
    weaknesses: [String],
    recommendedFor: String,
    evaluatedAt: Date
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  order: {
    type: Number,
    default: 0 // For manual ordering in lists
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
ResourceSchema.index({ domain: 1, topic: 1, qualityScore: -1 });
ResourceSchema.index({ sourceType: 1, isActive: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index({ topic: 'text', title: 'text', description: 'text' });

// Virtual for external link
ResourceSchema.virtual('externalUrl').get(function() {
  return this.url;
});

// Static: Find by domain with filters
ResourceSchema.statics.findByDomain = function(domain, options = {}) {
  const { page = 1, limit = 20, level, topic, sourceType } = options;
  
  const query = { isActive: true, domain };
  if (level && level !== 'all') query.level = level;
  if (topic) query.topic = topic;
  if (sourceType) query.sourceType = sourceType;

  return this.find(query)
    .sort({ qualityScore: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static: Search resources
ResourceSchema.statics.search = function(searchQuery, options = {}) {
  const { page = 1, limit = 20, domain, level, sourceType } = options;
  
  const query = {
    isActive: true,
    $or: [
      { title: { $regex: searchQuery, $options: 'i' } },
      { description: { $regex: searchQuery, $options: 'i' } },
      { topic: { $regex: searchQuery, $options: 'i' } },
      { tags: { $in: [new RegExp(searchQuery, 'i')] } }
    ]
  };

  if (domain && domain !== 'all') query.domain = domain;
  if (level && level !== 'all') query.level = level;
  if (sourceType) query.sourceType = sourceType;

  return this.find(query)
    .sort({ qualityScore: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Static: Get featured resources
ResourceSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ qualityScore: -1 })
    .limit(limit);
};

// Static: Get topics for a domain
ResourceSchema.statics.getTopicsByDomain = function(domain) {
  return this.aggregate([
    { $match: { isActive: true, domain } },
    { $group: { _id: '$topic', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Static: Bulk insert with deduplication
ResourceSchema.statics.bulkUpsert = async function(resources) {
  const operations = resources.map(resource => ({
    updateOne: {
      filter: { url: resource.url },
      update: { $set: resource },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

module.exports = mongoose.model('Resource', ResourceSchema);
