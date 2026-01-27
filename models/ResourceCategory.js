const mongoose = require('mongoose');

/**
 * Resource Category Model
 * Organizes resources into hierarchical categories
 */
const ResourceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    enum: ['frontend', 'backend', 'fullstack', 'mobile', 'devops', 'data-science', 'ai-ml', 'dsa', 'databases', 'security', 'cloud', 'other']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  icon: {
    type: String, // FontAwesome icon name e.g., 'faReact', 'faPython'
    default: 'faCode'
  },
  color: {
    type: String, // Hex color for UI
    default: '#00D9FF'
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResourceCategory',
    default: null // null means top-level category
  },
  order: {
    type: Number,
    default: 0
  },
  resourceCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name
ResourceCategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for subcategories
ResourceCategorySchema.virtual('subcategories', {
  ref: 'ResourceCategory',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Static: Get all top-level categories
ResourceCategorySchema.statics.getTopLevel = function() {
  return this.find({ isActive: true, parentCategory: null })
    .sort({ order: 1, name: 1 });
};

// Static: Get categories by domain
ResourceCategorySchema.statics.getByDomain = function(domain) {
  return this.find({ isActive: true, domain })
    .sort({ order: 1, name: 1 });
};

// Static: Get category tree
ResourceCategorySchema.statics.getTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();
  
  // Build tree structure
  const map = {};
  const roots = [];
  
  categories.forEach(cat => {
    map[cat._id] = { ...cat, children: [] };
  });
  
  categories.forEach(cat => {
    if (cat.parentCategory) {
      if (map[cat.parentCategory]) {
        map[cat.parentCategory].children.push(map[cat._id]);
      }
    } else {
      roots.push(map[cat._id]);
    }
  });
  
  return roots;
};

// Method: Update resource count
ResourceCategorySchema.methods.updateCount = async function() {
  const Resource = mongoose.model('Resource');
  this.resourceCount = await Resource.countDocuments({
    isActive: true,
    topic: this.name
  });
  return this.save();
};

module.exports = mongoose.model('ResourceCategory', ResourceCategorySchema);
