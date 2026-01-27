const mongoose = require('mongoose');
const slugify = require('slugify');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['hackathon', 'fellowship', 'internship', 'job', 'scholarship', 'competition', 'other'],
    default: 'other'
  },
  organization: {
    type: String,
    trim: true
  },
  link: {
    type: String,
    required: [true, 'Please add an external link']
  },
  deadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  stipend: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: 'Remote'
  },
  eligibility: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  coverImage: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'upcoming'],
    default: 'active'
  },
  featured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
opportunitySchema.index({ slug: 1 });
opportunitySchema.index({ status: 1, deadline: 1 });
opportunitySchema.index({ type: 1, status: 1 });
opportunitySchema.index({ featured: 1, status: 1 });
opportunitySchema.index({ author: 1 });
opportunitySchema.index({ tags: 1 });

// Generate slug from title before saving
opportunitySchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    }) + '-' + Date.now().toString(36);
  }
  
  // Auto-generate excerpt if not provided
  if (this.isModified('description') && !this.excerpt) {
    const plainText = this.description.replace(/<[^>]+>/g, '');
    this.excerpt = plainText.substring(0, 250) + (plainText.length > 250 ? '...' : '');
  }
  
  // Auto-update status based on deadline
  if (this.deadline) {
    const now = new Date();
    if (this.deadline < now) {
      this.status = 'closed';
    } else if (this.startDate && this.startDate > now) {
      this.status = 'upcoming';
    }
  }
  
  next();
});

// Static method to get active opportunities
opportunitySchema.statics.getActive = function() {
  return this.find({ 
    status: 'active',
    $or: [
      { deadline: { $gte: new Date() } },
      { deadline: null }
    ]
  }).sort({ featured: -1, deadline: 1 });
};

// Static method to get featured opportunities
opportunitySchema.statics.getFeatured = function(limit = 5) {
  return this.find({ 
    featured: true,
    status: { $in: ['active', 'upcoming'] }
  })
  .sort({ deadline: 1 })
  .limit(limit)
  .populate('author', 'name avatarUrl');
};

module.exports = mongoose.model('Opportunity', opportunitySchema);
