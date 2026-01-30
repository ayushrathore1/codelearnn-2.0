const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/async');
const SkillService = require('../services/SkillService');
const UserSkill = require('../models/UserSkill');

/**
 * @desc    Get user's skills
 * @route   GET /api/skills/me
 * @access  Private
 */
router.get('/me', protect, asyncHandler(async (req, res) => {
  const { minScore, category, limit } = req.query;
  
  const skills = await SkillService.getUserSkills(req.user.id, {
    minScore: minScore ? parseInt(minScore) : 0,
    category,
    limit: limit ? parseInt(limit) : 50
  });
  
  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills
  });
}));

/**
 * @desc    Get user's top skills (for profile/resume)
 * @route   GET /api/skills/top
 * @access  Private
 */
router.get('/top', protect, asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;
  const skills = await SkillService.getTopSkills(req.user.id, limit);
  
  res.status(200).json({
    success: true,
    count: skills.length,
    data: skills
  });
}));

/**
 * @desc    Get skill gaps for career goal
 * @route   GET /api/skills/gaps/:targetRole
 * @access  Private
 */
router.get('/gaps/:targetRole', protect, asyncHandler(async (req, res) => {
  const gaps = await SkillService.getSkillGaps(req.user.id, req.params.targetRole);
  
  res.status(200).json({
    success: true,
    count: gaps.length,
    data: gaps
  });
}));

/**
 * @desc    Get specific skill details
 * @route   GET /api/skills/:skillName
 * @access  Private
 */
router.get('/:skillName', protect, asyncHandler(async (req, res) => {
  const skill = await SkillService.getSkill(req.user.id, req.params.skillName);
  
  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found for this user'
    });
  }
  
  res.status(200).json({
    success: true,
    data: skill
  });
}));

/**
 * @desc    Get skill progression history (for charts)
 * @route   GET /api/skills/:skillName/history
 * @access  Private
 */
router.get('/:skillName/history', protect, asyncHandler(async (req, res) => {
  const EventService = require('../services/EventService');
  const history = await EventService.getSkillProgression(req.user.id, req.params.skillName);
  
  res.status(200).json({
    success: true,
    count: history.length,
    data: history
  });
}));

/**
 * @desc    Get all available skill categories
 * @route   GET /api/skills/meta/categories
 * @access  Public
 */
router.get('/meta/categories', asyncHandler(async (req, res) => {
  const categories = [
    { id: 'language', name: 'Programming Languages', icon: 'code' },
    { id: 'framework', name: 'Frameworks & Libraries', icon: 'cubes' },
    { id: 'tools', name: 'Tools & Technologies', icon: 'wrench' },
    { id: 'concepts', name: 'Core Concepts', icon: 'lightbulb' },
    { id: 'soft-skills', name: 'Soft Skills', icon: 'users' },
    { id: 'domain', name: 'Domain Knowledge', icon: 'folder' }
  ];
  
  res.status(200).json({
    success: true,
    data: categories
  });
}));

/**
 * @desc    Get popular skills (for exploration)
 * @route   GET /api/skills/meta/popular
 * @access  Public
 */
router.get('/meta/popular', asyncHandler(async (req, res) => {
  // Aggregate most common skills across all users
  const popularSkills = await UserSkill.aggregate([
    {
      $group: {
        _id: '$skillName',
        displayName: { $first: '$displayName' },
        category: { $first: '$category' },
        userCount: { $sum: 1 },
        avgScore: { $avg: '$score' }
      }
    },
    { $sort: { userCount: -1 } },
    { $limit: 20 }
  ]);
  
  res.status(200).json({
    success: true,
    data: popularSkills
  });
}));

module.exports = router;
