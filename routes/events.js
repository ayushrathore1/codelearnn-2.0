const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const EventService = require('../services/EventService');
const UserEvent = require('../models/UserEvent');

/**
 * @desc    Get user's recent activity
 * @route   GET /api/events/recent
 * @access  Private
 */
router.get('/recent', protect, asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 20;
  const events = await EventService.getRecentActivity(req.user.id, limit);
  
  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
}));

/**
 * @desc    Get user's learning statistics
 * @route   GET /api/events/stats/learning
 * @access  Private
 */
router.get('/stats/learning', protect, asyncHandler(async (req, res) => {
  const stats = await EventService.getLearningStats(req.user.id);
  
  res.status(200).json({
    success: true,
    data: stats
  });
}));

/**
 * @desc    Get activity summary for date range
 * @route   GET /api/events/summary
 * @access  Private
 */
router.get('/summary', protect, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Default to last 30 days if not specified
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const summary = await EventService.getActivitySummary(req.user.id, start, end);
  
  res.status(200).json({
    success: true,
    dateRange: { start, end },
    data: summary
  });
}));

/**
 * @desc    Get events by type
 * @route   GET /api/events/type/:eventType
 * @access  Private
 */
router.get('/type/:eventType', protect, asyncHandler(async (req, res) => {
  const { limit, startDate, endDate } = req.query;
  
  const events = await UserEvent.getEventsByType(req.user.id, req.params.eventType, {
    limit: limit ? parseInt(limit) : 50,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  });
  
  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
}));

/**
 * @desc    Get events by category
 * @route   GET /api/events/category/:category
 * @access  Private
 */
router.get('/category/:category', protect, asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const validCategories = ['learning', 'assessment', 'skill', 'project', 'team', 'engagement', 'profile', 'subscription', 'system'];
  
  if (!validCategories.includes(req.params.category)) {
    return res.status(400).json({
      success: false,
      message: `Invalid category. Valid categories: ${validCategories.join(', ')}`
    });
  }
  
  const events = await UserEvent.find({ 
    user: req.user.id, 
    category: req.params.category 
  })
    .sort({ timestamp: -1 })
    .limit(limit ? parseInt(limit) : 50)
    .lean();
  
  res.status(200).json({
    success: true,
    count: events.length,
    data: events
  });
}));

/**
 * @desc    Get activity heatmap data (for visualization)
 * @route   GET /api/events/heatmap
 * @access  Private
 */
router.get('/heatmap', protect, asyncHandler(async (req, res) => {
  const { days = 365 } = req.query;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
  
  const heatmapData = await UserEvent.aggregate([
    {
      $match: {
        user: req.user._id,
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 },
        categories: { $addToSet: '$category' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    dateRange: { start: startDate, end: endDate },
    data: heatmapData
  });
}));

module.exports = router;
