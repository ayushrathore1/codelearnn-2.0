const express = require('express');
const router = express.Router();
const LearningPath = require('../models/LearningPath');
const { protect, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/learning-paths
 * @desc    Get all published learning paths with optional filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      domain, 
      level, 
      search, 
      isPro,
      sortBy = 'enrolledCount',
      sortOrder = 'desc',
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter
    const filter = { isPublished: true };
    
    if (domain && domain !== 'all') {
      filter.domain = domain;
    }
    
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    if (isPro !== undefined) {
      filter.isPro = isPro === 'true';
    }

    // Search in title, description, tags
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [paths, total] = await Promise.all([
      LearningPath.find(filter)
        .select('title slug description domain level tags duration isPro rating enrolledCount thumbnail moduleCount')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      LearningPath.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: paths,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + paths.length < total
      }
    });
  } catch (error) {
    console.error('Get learning paths error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning paths'
    });
  }
});

/**
 * @route   GET /api/learning-paths/domains
 * @desc    Get all domains with counts
 * @access  Public
 */
router.get('/domains', async (req, res) => {
  try {
    const domains = await LearningPath.aggregate([
      { $match: { isPublished: true } },
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
 * @route   GET /api/learning-paths/:idOrSlug
 * @desc    Get single learning path by ID or slug
 * @access  Public
 */
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    
    let path;
    
    // Check if it's a valid MongoDB ObjectId
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      path = await LearningPath.findById(idOrSlug);
    } else {
      path = await LearningPath.findOne({ slug: idOrSlug, isPublished: true });
    }

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.json({
      success: true,
      data: path
    });
  } catch (error) {
    console.error('Get learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch learning path'
    });
  }
});

/**
 * @route   POST /api/learning-paths
 * @desc    Create a new learning path
 * @access  Private/Admin
 */
router.post('/', protect, async (req, res) => {
  try {
    const pathData = {
      ...req.body,
      createdBy: req.user._id
    };

    const path = await LearningPath.create(pathData);

    res.status(201).json({
      success: true,
      data: path
    });
  } catch (error) {
    console.error('Create learning path error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create learning path'
    });
  }
});

/**
 * @route   PUT /api/learning-paths/:id
 * @desc    Update a learning path
 * @access  Private/Admin
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const path = await LearningPath.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.json({
      success: true,
      data: path
    });
  } catch (error) {
    console.error('Update learning path error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update learning path'
    });
  }
});

/**
 * @route   DELETE /api/learning-paths/:id
 * @desc    Delete a learning path
 * @access  Private/Admin
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const path = await LearningPath.findByIdAndDelete(req.params.id);

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.json({
      success: true,
      message: 'Learning path deleted'
    });
  } catch (error) {
    console.error('Delete learning path error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete learning path'
    });
  }
});

/**
 * @route   POST /api/learning-paths/:id/enroll
 * @desc    Increment enrolled count (for tracking)
 * @access  Public
 */
router.post('/:id/enroll', async (req, res) => {
  try {
    const path = await LearningPath.findByIdAndUpdate(
      req.params.id,
      { $inc: { enrolledCount: 1 } },
      { new: true }
    );

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    res.json({
      success: true,
      enrolledCount: path.enrolledCount
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll'
    });
  }
});

module.exports = router;
