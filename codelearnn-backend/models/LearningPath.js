const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: String, // e.g., "2h 15m"
    default: '1h'
  },
  order: {
    type: Number,
    default: 0
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lessons: [{
    title: String,
    type: { type: String, enum: ['video', 'article', 'quiz', 'project'], default: 'video' },
    duration: String,
    resourceUrl: String,
    isCompleted: { type: Boolean, default: false }
  }]
});

const LearningPathSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  longDescription: {
    type: String,
    maxlength: [2000, 'Long description cannot be more than 2000 characters']
  },
  domain: {
    type: String,
    enum: ['frontend', 'backend', 'fullstack', 'mobile', 'devops', 'data-science', 'ai-ml', 'security', 'other'],
    default: 'other'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  tags: [{
    type: String,
    trim: true
  }],
  duration: {
    type: String, // Total estimated hours, e.g., "45 hours"
    default: '10 hours'
  },
  modules: [ModuleSchema],
  outcomes: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  isPro: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  enrolledCount: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String // URL to thumbnail image
  },
  instructor: {
    name: String,
    title: String,
    avatar: String
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create slug from title before saving
LearningPathSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for total modules count
LearningPathSchema.virtual('moduleCount').get(function() {
  return this.modules ? this.modules.length : 0;
});

// Static method to get paths by domain
LearningPathSchema.statics.getByDomain = async function(domain) {
  return this.find({ domain, isPublished: true }).sort({ enrolledCount: -1 });
};

// Static method to search paths
LearningPathSchema.statics.search = async function(query, filters = {}) {
  const searchRegex = new RegExp(query, 'i');
  
  const filter = {
    isPublished: true,
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex }
    ]
  };

  if (filters.domain) filter.domain = filters.domain;
  if (filters.level) filter.level = filters.level;
  if (filters.isPro !== undefined) filter.isPro = filters.isPro;

  return this.find(filter)
    .sort({ enrolledCount: -1, rating: -1 })
    .limit(filters.limit || 20);
};

module.exports = mongoose.model('LearningPath', LearningPathSchema);
