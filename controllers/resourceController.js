const Resource = require('../models/Resource');
const ResourceCategory = require('../models/ResourceCategory');
const asyncHandler = require('../middleware/async');

/**
 * @desc    Get all resources with filters
 * @route   GET /api/resources
 * @access  Public
 */
exports.getResources = asyncHandler(async (req, res) => {
  const { 
    domain, 
    topic, 
    level, 
    sourceType, 
    search,
    page = 1, 
    limit = 20 
  } = req.query;

  let resources;

  if (search) {
    resources = await Resource.search(search, { page, limit, domain, level, sourceType });
  } else {
    const query = { isActive: true };
    if (domain && domain !== 'all') query.domain = domain;
    if (topic) query.topic = topic;
    if (level && level !== 'all') query.level = level;
    if (sourceType) query.sourceType = sourceType;

    resources = await Resource.find(query)
      .sort({ qualityScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
  }

  const total = await Resource.countDocuments({ isActive: true });

  res.status(200).json({
    success: true,
    count: resources.length,
    total,
    page: parseInt(page),
    data: resources
  });
});

/**
 * @desc    Get single resource
 * @route   GET /api/resources/:id
 * @access  Public
 */
exports.getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  res.status(200).json({
    success: true,
    data: resource
  });
});

/**
 * @desc    Get featured resources
 * @route   GET /api/resources/featured
 * @access  Public
 */
exports.getFeatured = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const resources = await Resource.getFeatured(parseInt(limit));

  res.status(200).json({
    success: true,
    count: resources.length,
    data: resources
  });
});

/**
 * @desc    Get topics for a domain
 * @route   GET /api/resources/topics/:domain
 * @access  Public
 */
exports.getTopicsByDomain = asyncHandler(async (req, res) => {
  const topics = await Resource.getTopicsByDomain(req.params.domain);

  res.status(200).json({
    success: true,
    data: topics
  });
});

/**
 * @desc    Get all domains with counts
 * @route   GET /api/resources/domains
 * @access  Public
 */
exports.getDomains = asyncHandler(async (req, res) => {
  const domains = await Resource.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$domain', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: domains
  });
});

/**
 * @desc    Add single resource
 * @route   POST /api/resources
 * @access  Private (Admin)
 */
exports.addResource = asyncHandler(async (req, res) => {
  req.body.addedBy = req.user?.id;
  
  const resource = await Resource.create(req.body);

  res.status(201).json({
    success: true,
    data: resource
  });
});

/**
 * @desc    Bulk add resources
 * @route   POST /api/resources/bulk
 * @access  Private (Admin)
 */
exports.bulkAddResources = asyncHandler(async (req, res) => {
  const { resources } = req.body;

  if (!resources || !Array.isArray(resources)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an array of resources'
    });
  }

  // Add addedBy to each resource
  const resourcesWithUser = resources.map(r => ({
    ...r,
    addedBy: req.user?.id
  }));

  const result = await Resource.bulkUpsert(resourcesWithUser);

  res.status(201).json({
    success: true,
    message: `Processed ${resources.length} resources`,
    inserted: result.upsertedCount,
    modified: result.modifiedCount
  });
});

/**
 * @desc    Update resource
 * @route   PUT /api/resources/:id
 * @access  Private (Admin)
 */
exports.updateResource = asyncHandler(async (req, res) => {
  let resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: resource
  });
});

/**
 * @desc    Delete resource
 * @route   DELETE /api/resources/:id
 * @access  Private (Admin)
 */
exports.deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }

  // Soft delete
  resource.isActive = false;
  await resource.save();

  res.status(200).json({
    success: true,
    message: 'Resource deleted'
  });
});

/**
 * @desc    Get all categories
 * @route   GET /api/resources/categories
 * @access  Public
 */
exports.getCategories = asyncHandler(async (req, res) => {
  const { domain } = req.query;
  
  let categories;
  if (domain) {
    categories = await ResourceCategory.getByDomain(domain);
  } else {
    categories = await ResourceCategory.getTree();
  }

  res.status(200).json({
    success: true,
    data: categories
  });
});
