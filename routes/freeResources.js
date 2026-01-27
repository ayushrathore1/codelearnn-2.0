const express = require('express');
const router = express.Router();
const {
  getResources,
  getByCategory,
  getResource,
  analyzeVideo,
  getCategories,
  createResource,
  addFromAnalysis,
  updateResource,
  deleteResource,
  refreshStatistics,
  reEvaluate
} = require('../controllers/freeResourceController');
const YouTubeAnalysisCache = require('../models/YouTubeAnalysisCache');
const Course = require('../models/Course');
const FreeResource = require('../models/FreeResource');

// Import auth middleware (uncomment when auth is needed)
// const { protect, authorize } = require('../middleware/auth');

/**
 * Cached Tutorials Routes
 */

/**
 * @route   GET /api/resources/cached
 * @desc    Browse cached tutorial analyses by category
 * @access  Public
 */
router.get('/cached', async (req, res) => {
  try {
    const { category, subcategory, type, page = 1, limit = 20 } = req.query;

    if (!category) {
      // Return category tree with counts
      const categoryTree = await YouTubeAnalysisCache.getCategoryTree();
      return res.json({
        success: true,
        data: categoryTree
      });
    }

    const tutorials = await YouTubeAnalysisCache.browseByCategory(category, {
      subcategory,
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: tutorials
    });
  } catch (error) {
    console.error('Browse cached tutorials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to browse cached tutorials'
    });
  }
});

/**
 * @route   GET /api/resources/cached/search
 * @desc    Search cached tutorial analyses
 * @access  Public
 */
router.get('/cached/search', async (req, res) => {
  try {
    const { q, category, type, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const results = await YouTubeAnalysisCache.search(q.trim(), {
      category,
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search cached tutorials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search tutorials'
    });
  }
});

/**
 * @route   GET /api/resources/cached/popular
 * @desc    Get popular cached tutorials
 * @access  Public
 */
router.get('/cached/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const popular = await YouTubeAnalysisCache.getPopular(parseInt(limit));
    
    res.json({
      success: true,
      data: popular
    });
  } catch (error) {
    console.error('Get popular tutorials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get popular tutorials'
    });
  }
});

/**
 * Public Routes
 */

// Get all resources with filters
router.get('/', getResources);

// Get all categories with stats
router.get('/categories', getCategories);

// Analyze a YouTube URL
router.post('/analyze', analyzeVideo);

// Get resources by category
router.get('/category/:category', getByCategory);

/**
 * Course Routes
 */

/**
 * @route   GET /api/free-resources/courses
 * @desc    Get all courses with optional category filter
 * @access  Public
 */
router.get('/courses', async (req, res) => {
  try {
    const { category, page = 1, limit = 10, featured } = req.query;
    
    const filter = { isActive: true };
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    const courses = await Course.find(filter)
      .sort({ isFeatured: -1, averageScore: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-aiOverview');

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: courses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
});

/**
 * @route   GET /api/free-resources/courses/:slug
 * @desc    Get course details with all lectures
 * @access  Public
 */
router.get('/courses/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isActive: true });
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get lectures for this course
    const lectures = await FreeResource.find({ courseId: course._id, isActive: true })
      .sort({ lectureOrder: 1 })
      .select('-aiAnalysis.weaknesses');

    res.json({
      success: true,
      data: {
        course,
        lectures,
        lectureCount: lectures.length
      }
    });
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course'
    });
  }
});

/**
 * @route   GET /api/free-resources/c-programming
 * @desc    Get C programming resources with relation tags
 * @access  Public
 */
router.get('/c-programming', async (req, res) => {
  try {
    const { relation, page = 1, limit = 20 } = req.query;
    
    const filter = { 
      isActive: true,
      $or: [
        { category: 'c-programming' },
        { cRelation: { $in: ['specifically-for-c', 'related-to-c'] } }
      ]
    };
    
    if (relation === 'specifically-for-c' || relation === 'related-to-c') {
      filter.cRelation = relation;
    }

    const resources = await FreeResource.find(filter)
      .sort({ codeLearnnScore: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('-aiAnalysis.weaknesses');

    const total = await FreeResource.countDocuments(filter);

    // Group by relation type for stats
    const stats = await FreeResource.aggregate([
      { $match: filter },
      { $group: { _id: '$cRelation', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: resources,
      stats: {
        byRelation: stats.reduce((acc, s) => ({ ...acc, [s._id || 'unspecified']: s.count }), {})
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get C programming resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get C programming resources'
    });
  }
});

/**
 * @route   GET /api/free-resources/browse
 * @desc    Browse all cached tutorials with filters (explicit route to prevent /:id conflict)
 * @access  Public
 */
router.get('/browse', async (req, res) => {
  try {
    const { category, subcategory, type, page = 1, limit = 20, sortBy = 'usageCount' } = req.query;

    // Build filter
    const filter = {};
    if (category && category !== 'all') {
      filter.category = category.toLowerCase();
    }
    if (subcategory) {
      filter.subcategory = subcategory.toLowerCase();
    }
    if (type) {
      filter.type = type;
    }

    // Get tutorials from cache
    const tutorials = await YouTubeAnalysisCache.find(filter)
      .sort({ [sortBy]: -1, createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .select('youtubeId type title channelName thumbnail category subcategory tags usageCount duration');

    const total = await YouTubeAnalysisCache.countDocuments(filter);

    res.json({
      success: true,
      data: tutorials,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Browse cached tutorials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to browse cached tutorials'
    });
  }
});

// Get single resource
router.get('/:id', getResource);

/**
 * Admin Routes (add protect middleware when ready)
 * Example: router.post('/', protect, authorize('admin'), createResource);
 */

// Create new resource
router.post('/', createResource);

// Add from analysis result
router.post('/add-from-analysis', addFromAnalysis);

// Update resource
router.put('/:id', updateResource);

// Delete resource
router.delete('/:id', deleteResource);

// Refresh statistics
router.post('/:id/refresh', refreshStatistics);

// Re-evaluate with AI
router.post('/:id/evaluate', reEvaluate);

module.exports = router;
