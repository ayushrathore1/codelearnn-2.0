const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AISuggestion = require('../models/AISuggestion');
const AISuggestionService = require('../services/AISuggestionService');
const UserLearningPath = require('../models/UserLearningPath');

/**
 * @route   GET /api/ai-suggestions
 * @desc    Get pending AI suggestions for user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const suggestions = await AISuggestion.getPendingForUser(
      req.user.id,
      parseInt(limit)
    );

    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions'
    });
  }
});

/**
 * @route   GET /api/ai-suggestions/path/:pathId
 * @desc    Get pending AI suggestions for a specific path
 * @access  Private
 */
router.get('/path/:pathId', protect, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Verify ownership
    const path = await UserLearningPath.findOne({
      _id: req.params.pathId,
      userId: req.user.id,
      deletedAt: null
    });

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    const suggestions = await AISuggestion.getPendingForPath(
      req.params.pathId,
      parseInt(limit)
    );

    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Get path suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions'
    });
  }
});

/**
 * @route   POST /api/ai-suggestions/generate/:pathId
 * @desc    Generate AI suggestions for a path
 * @access  Private
 */
router.post('/generate/:pathId', protect, async (req, res) => {
  try {
    const { trigger = 'user_requested', context = {} } = req.body;

    // Verify ownership
    const path = await UserLearningPath.findOne({
      _id: req.params.pathId,
      userId: req.user.id,
      deletedAt: null
    });

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    const suggestions = await AISuggestionService.generateSuggestions(
      req.params.pathId,
      req.user.id,
      trigger,
      context
    );

    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    console.error('Generate suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions'
    });
  }
});

/**
 * @route   PUT /api/ai-suggestions/:id/accept
 * @desc    Accept an AI suggestion
 * @access  Private
 */
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const { feedback } = req.body;

    const suggestion = await AISuggestion.accept(
      req.params.id,
      req.user.id,
      feedback
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Suggestion accepted',
      data: suggestion
    });
  } catch (error) {
    console.error('Accept suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept suggestion'
    });
  }
});

/**
 * @route   PUT /api/ai-suggestions/:id/reject
 * @desc    Reject an AI suggestion
 * @access  Private
 */
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const { feedback } = req.body;

    const suggestion = await AISuggestion.reject(
      req.params.id,
      req.user.id,
      feedback
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Suggestion rejected',
      data: suggestion
    });
  } catch (error) {
    console.error('Reject suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject suggestion'
    });
  }
});

/**
 * @route   PUT /api/ai-suggestions/:id/dismiss
 * @desc    Dismiss an AI suggestion (no action taken)
 * @access  Private
 */
router.put('/:id/dismiss', protect, async (req, res) => {
  try {
    const suggestion = await AISuggestion.dismiss(
      req.params.id,
      req.user.id
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found or already processed'
      });
    }

    res.json({
      success: true,
      message: 'Suggestion dismissed',
      data: suggestion
    });
  } catch (error) {
    console.error('Dismiss suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss suggestion'
    });
  }
});

/**
 * @route   GET /api/ai-suggestions/stats
 * @desc    Get AI suggestion stats for user
 * @access  Private
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await AISuggestion.getStats(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

module.exports = router;
