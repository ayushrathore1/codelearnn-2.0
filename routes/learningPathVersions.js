const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LearningPathVersion = require('../models/LearningPathVersion');
const UserLearningPath = require('../models/UserLearningPath');

/**
 * @route   GET /api/user/learning-paths/:pathId/versions
 * @desc    Get version history for a learning path
 * @access  Private
 */
router.get('/:pathId/versions', protect, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

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

    const versions = await LearningPathVersion.getHistory(req.params.pathId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      count: versions.length,
      data: versions
    });
  } catch (error) {
    console.error('Get version history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch version history'
    });
  }
});

/**
 * @route   GET /api/user/learning-paths/:pathId/versions/:versionNumber
 * @desc    Get a specific version
 * @access  Private
 */
router.get('/:pathId/versions/:versionNumber', protect, async (req, res) => {
  try {
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

    const version = await LearningPathVersion.getVersion(
      req.params.pathId,
      parseInt(req.params.versionNumber)
    );

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch version'
    });
  }
});

/**
 * @route   GET /api/user/learning-paths/:pathId/versions/compare
 * @desc    Compare two versions
 * @access  Private
 */
router.get('/:pathId/versions/compare', protect, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Both from and to version numbers are required'
      });
    }

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

    const comparison = await LearningPathVersion.compare(
      req.params.pathId,
      parseInt(from),
      parseInt(to)
    );

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Compare versions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to compare versions'
    });
  }
});

/**
 * @route   POST /api/user/learning-paths/:pathId/versions/restore/:versionNumber
 * @desc    Restore a path to a specific version
 * @access  Private
 */
router.post('/:pathId/versions/restore/:versionNumber', protect, async (req, res) => {
  try {
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

    // Get the version to restore
    const version = await LearningPathVersion.getVersion(
      req.params.pathId,
      parseInt(req.params.versionNumber)
    );

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Create a version of current state before restoring
    await LearningPathVersion.createVersion(
      path._id,
      req.user.id,
      'user_edit',
      {
        title: path.title,
        description: path.description,
        careerId: path.careerId,
        status: path.status,
        structureGraph: path.structureGraph,
        inferredSkills: path.inferredSkills,
        inferredCareers: path.inferredCareers,
        readinessScore: path.readinessScore,
        visibility: path.visibility
      },
      {
        changeDescription: `State before restoring to version ${version.versionNumber}`
      }
    );

    // Restore the path to the version snapshot
    path.title = version.snapshot.title;
    path.description = version.snapshot.description;
    path.careerId = version.snapshot.careerId;
    path.status = version.snapshot.status || 'draft';
    path.structureGraph = version.snapshot.structureGraph;
    path.inferredSkills = version.snapshot.inferredSkills || [];
    path.inferredCareers = version.snapshot.inferredCareers || [];
    path.readinessScore = version.snapshot.readinessScore || 0;
    path.visibility = version.snapshot.visibility || 'private';

    await path.save();

    // Create a new version for the restoration
    const newVersion = await LearningPathVersion.createVersion(
      path._id,
      req.user.id,
      'user_edit',
      version.snapshot,
      {
        changeDescription: `Restored to version ${version.versionNumber}`
      }
    );

    res.json({
      success: true,
      message: `Restored to version ${version.versionNumber}`,
      data: {
        path,
        restoredFromVersion: version.versionNumber,
        newVersion: newVersion.versionNumber
      }
    });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore version'
    });
  }
});

/**
 * @route   GET /api/user/learning-paths/ai-suggestion-stats
 * @desc    Get AI suggestion acceptance stats for user
 * @access  Private
 */
router.get('/ai-suggestion-stats', protect, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const stats = await LearningPathVersion.getAISuggestionStats(
      req.user.id,
      parseInt(days)
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get AI stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI suggestion stats'
    });
  }
});

module.exports = router;
