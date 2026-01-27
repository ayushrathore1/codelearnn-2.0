const freeResourceService = require('../services/FreeResourceService');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Get all free resources with filters
 * @route   GET /api/free-resources
 * @access  Public
 */
exports.getResources = asyncHandler(async (req, res) => {
  const result = await freeResourceService.getResources(req.query);
  res.status(200).json(result);
});

/**
 * @desc    Get resources by category
 * @route   GET /api/free-resources/category/:category
 * @access  Public
 */
exports.getByCategory = asyncHandler(async (req, res) => {
  const result = await freeResourceService.getByCategory(
    req.params.category,
    req.query
  );
  res.status(200).json(result);
});

/**
 * @desc    Get single resource by ID
 * @route   GET /api/free-resources/:id
 * @access  Public
 */
exports.getResource = asyncHandler(async (req, res) => {
  const result = await freeResourceService.getById(req.params.id);
  res.status(200).json(result);
});

/**
 * @desc    Analyze a YouTube video URL
 * @route   POST /api/free-resources/analyze
 * @access  Public
 */
exports.analyzeVideo = asyncHandler(async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a YouTube URL'
    });
  }

  const result = await freeResourceService.analyzeVideo(url);
  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Get available categories
 * @route   GET /api/free-resources/categories
 * @access  Public
 */
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = freeResourceService.getCategories();
  const stats = await freeResourceService.getCategoryStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Create new resource (Admin)
 * @route   POST /api/free-resources
 * @access  Private/Admin
 */
exports.createResource = asyncHandler(async (req, res) => {
  const result = await freeResourceService.createResource(req.body);
  res.status(201).json(result);
});

/**
 * @desc    Add resource from analysis (Admin)
 * @route   POST /api/free-resources/add-from-analysis
 * @access  Private/Admin
 */
exports.addFromAnalysis = asyncHandler(async (req, res) => {
  const { analysisResult, category, additionalData } = req.body;

  if (!analysisResult || !category) {
    return res.status(400).json({
      success: false,
      message: 'Please provide analysisResult and category'
    });
  }

  const result = await freeResourceService.addFromAnalysis(
    analysisResult,
    category,
    additionalData || {}
  );
  res.status(201).json(result);
});

/**
 * @desc    Update resource (Admin)
 * @route   PUT /api/free-resources/:id
 * @access  Private/Admin
 */
exports.updateResource = asyncHandler(async (req, res) => {
  const result = await freeResourceService.updateResource(req.params.id, req.body);
  res.status(200).json(result);
});

/**
 * @desc    Delete resource (Admin)
 * @route   DELETE /api/free-resources/:id
 * @access  Private/Admin
 */
exports.deleteResource = asyncHandler(async (req, res) => {
  const result = await freeResourceService.deleteResource(req.params.id);
  res.status(200).json(result);
});

/**
 * @desc    Refresh resource statistics (Admin)
 * @route   POST /api/free-resources/:id/refresh
 * @access  Private/Admin
 */
exports.refreshStatistics = asyncHandler(async (req, res) => {
  const result = await freeResourceService.refreshStatistics(req.params.id);
  res.status(200).json(result);
});

/**
 * @desc    Re-evaluate resource with AI (Admin)
 * @route   POST /api/free-resources/:id/evaluate
 * @access  Private/Admin
 */
exports.reEvaluate = asyncHandler(async (req, res) => {
  const result = await freeResourceService.reEvaluate(req.params.id);
  res.status(200).json(result);
});
