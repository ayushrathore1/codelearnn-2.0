const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const CareerReadinessService = require('../services/CareerReadinessService');

/**
 * @route   GET /api/readiness
 * @desc    Get career readiness score for user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { careerId } = req.query;

    const readiness = await CareerReadinessService.calculateReadiness(
      req.user.id,
      careerId
    );

    res.json({
      success: true,
      data: readiness
    });
  } catch (error) {
    console.error('Get readiness error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate readiness'
    });
  }
});

/**
 * @route   GET /api/readiness/skills-gap
 * @desc    Get skills gap analysis for user
 * @access  Private
 */
router.get('/skills-gap', protect, async (req, res) => {
  try {
    const { careerId } = req.query;

    const skillsGap = await CareerReadinessService.getSkillsGap(
      req.user.id,
      careerId
    );

    res.json({
      success: true,
      data: skillsGap
    });
  } catch (error) {
    console.error('Get skills gap error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skills gap'
    });
  }
});

/**
 * @route   PUT /api/readiness/refresh/:pathId
 * @desc    Refresh readiness score for a path
 * @access  Private
 */
router.put('/refresh/:pathId', protect, async (req, res) => {
  try {
    const readiness = await CareerReadinessService.updatePathReadiness(
      req.params.pathId,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Readiness score updated',
      data: readiness
    });
  } catch (error) {
    console.error('Refresh readiness error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh readiness'
    });
  }
});

module.exports = router;
