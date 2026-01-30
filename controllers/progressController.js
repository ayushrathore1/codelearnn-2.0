const UserProgress = require('../models/UserProgress');
const Resource = require('../models/Resource');
const asyncHandler = require('../middleware/async');
const EventService = require('../services/EventService');
const SkillService = require('../services/SkillService');
const cacheService = require('../services/CacheService');

/**
 * @desc    Get user's progress
 * @route   GET /api/progress/me
 * @access  Private
 */
exports.getMyProgress = asyncHandler(async (req, res) => {
  const progress = await UserProgress.getOrCreate(req.user.id);
  
  await progress.populate([
    { path: 'completedResources.resource', select: 'title thumbnail url sourceType topic' },
    { path: 'inProgressResources.resource', select: 'title thumbnail url sourceType topic' },
    { path: 'savedResources', select: 'title thumbnail url sourceType topic' }
  ]);

  res.status(200).json({
    success: true,
    data: progress
  });
});

/**
 * @desc    Get progress stats
 * @route   GET /api/progress/stats
 * @access  Private
 */
exports.getStats = asyncHandler(async (req, res) => {
  const progress = await UserProgress.getOrCreate(req.user.id);
  const stats = progress.getSummary();

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Start a resource
 * @route   POST /api/progress/start
 * @access  Private
 */
exports.startResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.body;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      message: 'Resource ID is required'
    });
  }

  // Verify resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  const progress = await UserProgress.getOrCreate(req.user.id);
  await progress.startResource(resourceId);

  // Record event
  await EventService.resourceStarted(
    req.user.id,
    resourceId,
    resource.title,
    resource.sourceType
  );

  res.status(200).json({
    success: true,
    message: 'Resource started'
  });
});

/**
 * @desc    Update resource progress
 * @route   PUT /api/progress/update
 * @access  Private
 */
exports.updateProgress = asyncHandler(async (req, res) => {
  const { resourceId, progress: progressPercent, timeSpent } = req.body;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      message: 'Resource ID is required'
    });
  }

  const userProgress = await UserProgress.getOrCreate(req.user.id);
  await userProgress.updateResourceProgress(resourceId, progressPercent, timeSpent);

  res.status(200).json({
    success: true,
    message: 'Progress updated'
  });
});

/**
 * @desc    Complete a resource
 * @route   POST /api/progress/complete
 * @access  Private
 */
exports.completeResource = asyncHandler(async (req, res) => {
  const { resourceId, rating, notes, timeSpent } = req.body;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      message: 'Resource ID is required'
    });
  }

  // Verify resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  const progress = await UserProgress.getOrCreate(req.user.id);
  await progress.completeResource(resourceId, rating, notes, timeSpent);

  // Update resource completion count
  resource.stats.completions = (resource.stats.completions || 0) + 1;
  if (rating) {
    const totalRatings = resource.stats.ratingCount + 1;
    resource.stats.avgRating = ((resource.stats.avgRating * resource.stats.ratingCount) + rating) / totalRatings;
    resource.stats.ratingCount = totalRatings;
  }
  await resource.save();

  // Record completion event
  await EventService.resourceCompleted(
    req.user.id,
    resourceId,
    resource.title,
    resource.sourceType,
    timeSpent || 0
  );

  // Update skills based on resource tags
  let skillUpdates = [];
  if (resource.tags && resource.tags.length > 0) {
    skillUpdates = await SkillService.updateFromVideoCompletion(req.user.id, resource.tags);
  }

  // Invalidate progress cache
  await cacheService.invalidateUserProgress(req.user.id);

  res.status(200).json({
    success: true,
    message: 'Resource completed',
    xpEarned: 50,
    skillUpdates: skillUpdates.length > 0 ? skillUpdates : undefined
  });
});

/**
 * @desc    Save/bookmark resource
 * @route   POST /api/progress/save
 * @access  Private
 */
exports.saveResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.body;

  if (!resourceId) {
    return res.status(400).json({
      success: false,
      message: 'Resource ID is required'
    });
  }

  const progress = await UserProgress.getOrCreate(req.user.id);
  await progress.saveResource(resourceId);

  res.status(200).json({
    success: true,
    message: 'Resource saved'
  });
});

/**
 * @desc    Unsave resource
 * @route   DELETE /api/progress/save/:resourceId
 * @access  Private
 */
exports.unsaveResource = asyncHandler(async (req, res) => {
  const progress = await UserProgress.getOrCreate(req.user.id);
  await progress.unsaveResource(req.params.resourceId);

  res.status(200).json({
    success: true,
    message: 'Resource removed from saved'
  });
});

/**
 * @desc    Get completed resources
 * @route   GET /api/progress/completed
 * @access  Private
 */
exports.getCompleted = asyncHandler(async (req, res) => {
  const progress = await UserProgress.getOrCreate(req.user.id);
  await progress.populate('completedResources.resource', 'title thumbnail url sourceType topic domain');

  res.status(200).json({
    success: true,
    count: progress.completedResources.length,
    data: progress.completedResources
  });
});

/**
 * @desc    Get saved resources
 * @route   GET /api/progress/saved
 * @access  Private
 */
exports.getSaved = asyncHandler(async (req, res) => {
  const progress = await UserProgress.getOrCreate(req.user.id);
  await progress.populate('savedResources', 'title thumbnail url sourceType topic domain level');

  res.status(200).json({
    success: true,
    count: progress.savedResources.length,
    data: progress.savedResources
  });
});
