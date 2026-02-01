const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const SavedVideo = require('../models/SavedVideo');
const UserLearningPath = require('../models/UserLearningPath');
const YouTubeAnalysisCache = require('../models/YouTubeAnalysisCache');
const User = require('../models/User');

/**
 * @route   GET /api/saved-videos
 * @desc    Get user's saved videos
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { limit = 20, skip = 0, careerId, inPath } = req.query;
    
    const videos = await SavedVideo.getUserVideos(req.user.id, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      careerId,
      inPath: inPath === 'true' ? true : inPath === 'false' ? false : null
    });

    const total = await SavedVideo.getCountForUser(req.user.id);

    res.json({
      success: true,
      count: videos.length,
      total,
      data: videos
    });
  } catch (error) {
    console.error('Get saved videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved videos'
    });
  }
});

/**
 * @route   GET /api/saved-videos/unassigned
 * @desc    Get videos not yet added to any path
 * @access  Private
 */
router.get('/unassigned', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const videos = await SavedVideo.getUnassignedVideos(req.user.id, parseInt(limit));

    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    console.error('Get unassigned videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unassigned videos'
    });
  }
});

/**
 * @route   GET /api/saved-videos/check/:videoId
 * @desc    Check if a video is saved by user
 * @access  Private
 */
router.get('/check/:videoId', protect, async (req, res) => {
  try {
    const isSaved = await SavedVideo.isVideoSaved(req.user.id, req.params.videoId);
    
    res.json({
      success: true,
      isSaved
    });
  } catch (error) {
    console.error('Check saved video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check video status'
    });
  }
});

/**
 * @route   GET /api/saved-videos/:videoId
 * @desc    Get a specific saved video with full analysis
 * @access  Private
 */
router.get('/:videoId', protect, async (req, res) => {
  try {
    const video = await SavedVideo.getVideoWithAnalysis(req.user.id, req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found in saved collection'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Get saved video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch saved video'
    });
  }
});

/**
 * @route   POST /api/saved-videos
 * @desc    Save a video (after analysis)
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        message: 'videoId is required'
      });
    }

    // Check if already saved
    const existing = await SavedVideo.findOne({ 
      userId: req.user.id, 
      videoId, 
      deletedAt: null 
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Video already saved',
        data: existing
      });
    }

    // Get analysis data from cache
    const cachedAnalysis = await YouTubeAnalysisCache.findOne({ youtubeId: videoId });

    if (!cachedAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Video must be analyzed first'
      });
    }

    // Check if user has an active career
    const user = await User.findById(req.user.id);
    const activeCareerId = user.activeCareerId;

    // Create saved video entry
    const savedVideo = await SavedVideo.create({
      userId: req.user.id,
      videoId,
      title: cachedAnalysis.title,
      channel: cachedAnalysis.channelName,
      duration: cachedAnalysis.duration,
      thumbnail: cachedAnalysis.thumbnail,
      analyzedData: cachedAnalysis.analysisData,
      inferredSkills: cachedAnalysis.tags || [],
      inferredCareers: activeCareerId ? [activeCareerId] : [],
      codeLearnnScore: cachedAnalysis.analysisData?.codeLearnnScore || 0,
      category: cachedAnalysis.category,
      subcategory: cachedAnalysis.subcategory
    });

    // Auto-create learning path if this is user's first save
    const savedCount = await SavedVideo.getCountForUser(req.user.id);
    let autoCreatedPath = null;

    if (savedCount === 1) {
      // First video saved - create auto path
      autoCreatedPath = await UserLearningPath.createAutoPath(
        req.user.id,
        activeCareerId,
        savedVideo
      );

      // Update saved video with path association
      savedVideo.addedToPathId = autoCreatedPath._id;
      savedVideo.pathStatus = 'in_path';
      await savedVideo.save();

      // Set as user's active learning path if they don't have one
      if (!user.activeLearningPathId) {
        user.activeLearningPathId = autoCreatedPath._id;
        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Video saved successfully',
      data: {
        savedVideo,
        autoCreatedPath
      }
    });
  } catch (error) {
    console.error('Save video error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Video already saved'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to save video'
    });
  }
});

/**
 * @route   PUT /api/saved-videos/:videoId/add-to-path/:pathId
 * @desc    Add saved video to a specific learning path
 * @access  Private
 */
router.put('/:videoId/add-to-path/:pathId', protect, async (req, res) => {
  try {
    const { videoId, pathId } = req.params;

    // Verify ownership of both video and path
    const [savedVideo, path] = await Promise.all([
      SavedVideo.findOne({ userId: req.user.id, videoId, deletedAt: null }),
      UserLearningPath.findOne({ _id: pathId, userId: req.user.id, deletedAt: null })
    ]);

    if (!savedVideo) {
      return res.status(404).json({
        success: false,
        message: 'Saved video not found'
      });
    }

    if (!path) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found'
      });
    }

    // Add video to path
    await UserLearningPath.addVideoToPath(pathId, savedVideo);

    // Update saved video association
    savedVideo.addedToPathId = path._id;
    savedVideo.pathStatus = 'in_path';
    await savedVideo.save();

    res.json({
      success: true,
      message: 'Video added to learning path',
      data: { savedVideo, path }
    });
  } catch (error) {
    console.error('Add to path error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add video to path'
    });
  }
});

/**
 * @route   DELETE /api/saved-videos/:videoId
 * @desc    Remove a saved video (soft delete)
 * @access  Private
 */
router.delete('/:videoId', protect, async (req, res) => {
  try {
    const video = await SavedVideo.softDelete(req.user.id, req.params.videoId);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      message: 'Video removed from saved collection',
      data: video
    });
  } catch (error) {
    console.error('Delete saved video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove video'
    });
  }
});

module.exports = router;
