const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const ResourceCategory = require('../models/ResourceCategory');
const { protect, authorize } = require('../middleware/auth');

/**
 * Vault Routes - Resource Management API
 * Supports multiple content sources: YouTube, edX, Coursera, articles, documentation, etc.
 */

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/vault
 * @desc    Get all resources with filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      domain,
      topic,
      level,
      sourceType,
      contentType,
      search,
      isFeatured,
      isCurated,
      sortBy = 'qualityScore',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { isActive: true };

    if (domain && domain !== 'all') filter.domain = domain;
    if (topic) filter.topic = topic;
    if (level && level !== 'all') filter.level = level;
    if (sourceType) filter.sourceType = sourceType;
    if (contentType) filter.contentType = contentType;
    if (isFeatured === 'true') filter.isFeatured = true;
    if (isCurated === 'true') filter.isCurated = true;

    // Search in title, description, topic, tags
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { topic: searchRegex },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-aiAnalysis'),
      Resource.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + resources.length < total
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resources'
    });
  }
});

/**
 * @route   GET /api/vault/featured
 * @desc    Get featured resources
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const resources = await Resource.getFeatured(parseInt(limit));

    res.json({
      success: true,
      data: resources
    });
  } catch (error) {
    console.error('Get featured resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured resources'
    });
  }
});

/**
 * @route   GET /api/vault/categories
 * @desc    Get all categories with hierarchy
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const { domain, flat } = req.query;

    if (flat === 'true') {
      // Return flat list
      const categories = domain
        ? await ResourceCategory.getByDomain(domain)
        : await ResourceCategory.find({ isActive: true }).sort({ order: 1, name: 1 });
      
      return res.json({
        success: true,
        data: categories
      });
    }

    // Return tree structure
    const categoryTree = await ResourceCategory.getTree();

    res.json({
      success: true,
      data: categoryTree
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

/**
 * @route   GET /api/vault/topics/:domain
 * @desc    Get topics for a specific domain
 * @access  Public
 */
router.get('/topics/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const topics = await Resource.getTopicsByDomain(domain);

    res.json({
      success: true,
      data: topics.map(t => ({ topic: t._id, count: t.count }))
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics'
    });
  }
});

/**
 * @route   GET /api/vault/domains
 * @desc    Get all domains with resource counts
 * @access  Public
 */
router.get('/domains', async (req, res) => {
  try {
    const domains = await Resource.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: domains.map(d => ({ domain: d._id, count: d.count }))
    });
  } catch (error) {
    console.error('Get domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch domains'
    });
  }
});

/**
 * @route   GET /api/vault/:id
 * @desc    Get single resource by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource || !resource.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Increment view count
    resource.stats.views = (resource.stats.views || 0) + 1;
    await resource.save();

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource'
    });
  }
});

// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================

/**
 * @route   POST /api/vault
 * @desc    Add a new resource
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const resourceData = {
      ...req.body,
      addedBy: req.user._id
    };

    const resource = await Resource.create(resourceData);

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create resource'
    });
  }
});

/**
 * @route   POST /api/vault/bulk
 * @desc    Bulk import resources
 * @access  Private
 */
router.post('/bulk', protect, async (req, res) => {
  try {
    const { resources } = req.body;

    if (!Array.isArray(resources) || resources.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resources array is required'
      });
    }

    // Add user ID to each resource
    const resourcesWithUser = resources.map(r => ({
      ...r,
      addedBy: req.user._id
    }));

    const result = await Resource.bulkUpsert(resourcesWithUser);

    res.status(201).json({
      success: true,
      message: `Processed ${resources.length} resources`,
      data: {
        inserted: result.upsertedCount || 0,
        modified: result.modifiedCount || 0,
        matched: result.matchedCount || 0
      }
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import resources'
    });
  }
});

/**
 * @route   PUT /api/vault/:id
 * @desc    Update a resource
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update resource'
    });
  }
});

/**
 * @route   DELETE /api/vault/:id
 * @desc    Delete a resource (soft delete)
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.json({
      success: true,
      message: 'Resource deleted'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource'
    });
  }
});

// ============================================
// CATEGORY MANAGEMENT (Protected)
// ============================================

/**
 * @route   POST /api/vault/categories
 * @desc    Create a new category
 * @access  Private
 */
router.post('/categories', protect, async (req, res) => {
  try {
    const category = await ResourceCategory.create(req.body);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create category'
    });
  }
});

/**
 * @route   PUT /api/vault/categories/:id
 * @desc    Update a category
 * @access  Private
 */
router.put('/categories/:id', protect, async (req, res) => {
  try {
    const category = await ResourceCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category'
    });
  }
});

module.exports = router;
