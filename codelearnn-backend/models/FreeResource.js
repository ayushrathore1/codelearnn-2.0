const mongoose = require('mongoose');

/**
 * FreeResource Schema - Stores curated YouTube coding tutorials
 * with AI-evaluated quality scores
 */
const freeResourceSchema = new mongoose.Schema({
  // YouTube Video Info
  youtubeId: {
    type: String,
    required: [true, 'YouTube video ID is required'],
    unique: true,
    trim: true,
    index: true
  },
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
  thumbnail: {
    type: String,
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  publishedAt: {
    type: Date
  },

  // Categorization
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['web-dev', 'java', 'javascript', 'data-science', 'python', 'dsa', 'devops', 'mobile', 'c-programming', 'other'],
      message: '{VALUE} is not a valid category'
    },
    index: true
  },
  
  // Course relationship (for organized lecture series)
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  lectureOrder: {
    type: Number,
    default: 0  // Order within course (1, 2, 3...)
  },
  lectureNumber: {
    type: String  // "Week 1", "Lecture 3", "Session 1", etc.
  },
  
  // C Language Relation Tag
  cRelation: {
    type: String,
    enum: ['specifically-for-c', 'related-to-c', 'general-programming', null],
    default: null,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tags: [{
    type: String,
    trim: true
  }],

  // YouTube Statistics (refreshed periodically)
  statistics: {
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  },

  // AI Evaluation
  codeLearnnScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    index: true
  },
  qualityTier: {
    type: String,
    enum: ['excellent', 'good', 'average', 'below_average', 'poor', 'not_applicable'],
    default: 'average'
  },
  aiAnalysis: {
    breakdown: {
      engagement: { type: Number, default: 0 },
      contentQuality: { type: Number, default: 0 },
      teachingClarity: { type: Number, default: 0 },
      practicalValue: { type: Number, default: 0 },
      upToDateScore: { type: Number, default: 0 },
      commentSentiment: { type: Number, default: 0 }
    },
    penalties: {
      outdated: { type: Number, default: 0 },
      confusion: { type: Number, default: 0 }
    },
    evaluationConfidence: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    recommendation: {
      type: String,
      enum: ['strongly_recommend', 'recommend', 'neutral', 'caution', 'avoid', 'not_applicable'],
      default: 'neutral'
    },
    strengths: [String],
    weaknesses: [String],
    redFlags: [String],
    recommendedFor: String,
    notRecommendedFor: String,
    summary: String,
    commentAnalysis: {
      sentiment: String,
      concerns: [String],
      totalAnalyzed: { type: Number, default: 0 }
    },
    evaluatedAt: Date,
    
    // Enhanced AI-generated description (supplements YouTube description)
    enhancedDescription: {
      whatYouWillLearn: [String],         // Key learning points
      topicsCovered: [String],            // Specific topics in this lecture
      cRelevance: String,                 // How it relates to C programming
      learningBenefits: String,           // Why watch this for C/programming basics
      suggestedPrerequisites: [String],   // What to watch/know before
      keyTakeaways: [String]              // Main takeaways from lecture
    }
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for YouTube URL
freeResourceSchema.virtual('youtubeUrl').get(function() {
  return `https://www.youtube.com/watch?v=${this.youtubeId}`;
});

// Virtual for embed URL
freeResourceSchema.virtual('embedUrl').get(function() {
  return `https://www.youtube.com/embed/${this.youtubeId}`;
});

// Compound indexes for efficient queries
freeResourceSchema.index({ category: 1, codeLearnnScore: -1 });
freeResourceSchema.index({ isActive: 1, category: 1, createdAt: -1 });
freeResourceSchema.index({ category: 1, level: 1 });

// Static method: Find by category with pagination
freeResourceSchema.statics.findByCategory = function(category, options = {}) {
  const { 
    page = 1, 
    limit = 12, 
    sortBy = 'codeLearnnScore',
    sortOrder = -1,
    level 
  } = options;

  const query = { isActive: true, category };
  if (level) query.level = level;

  return this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .select('-aiAnalysis.weaknesses');
};

// Static method: Get featured resources
freeResourceSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ codeLearnnScore: -1 })
    .limit(limit)
    .select('-aiAnalysis.weaknesses');
};

// Static method: Search resources
freeResourceSchema.statics.search = function(query, options = {}) {
  const { page = 1, limit = 12 } = options;
  
  return this.find({
    isActive: true,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
      { channelName: { $regex: query, $options: 'i' } }
    ]
  })
    .sort({ codeLearnnScore: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

// Instance method: Update statistics
freeResourceSchema.methods.updateStatistics = function(stats) {
  this.statistics = {
    ...stats,
    lastUpdated: new Date()
  };
  return this.save();
};

// Instance method: Update AI analysis
freeResourceSchema.methods.updateAiAnalysis = function(analysis) {
  this.codeLearnnScore = analysis.codeLearnnScore;
  this.qualityTier = analysis.qualityTier;
  this.aiAnalysis = {
    breakdown: analysis.breakdown,
    penalties: analysis.penalties || { outdated: 0, confusion: 0 },
    evaluationConfidence: analysis.evaluationConfidence || 'medium',
    recommendation: analysis.recommendation,
    strengths: analysis.strengths,
    weaknesses: analysis.weaknesses,
    redFlags: analysis.redFlags || [],
    recommendedFor: analysis.recommendedFor,
    notRecommendedFor: analysis.notRecommendedFor || '',
    summary: analysis.summary,
    commentAnalysis: analysis.commentAnalysis || {},
    evaluatedAt: new Date()
  };
  return this.save();
};

// Pre-save middleware: Set default thumbnail
freeResourceSchema.pre('save', function() {
  if (!this.thumbnail && this.youtubeId) {
    this.thumbnail = `https://img.youtube.com/vi/${this.youtubeId}/maxresdefault.jpg`;
  }
});

const FreeResource = mongoose.model('FreeResource', freeResourceSchema);

module.exports = FreeResource;
