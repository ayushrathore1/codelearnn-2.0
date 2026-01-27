const PersonalizedPath = require('../models/PersonalizedPath');
const Resource = require('../models/Resource');
const asyncHandler = require('../middleware/async');
const groqService = require('../services/GroqService');

/**
 * @desc    Generate personalized learning path
 * @route   POST /api/learning-path/generate
 * @access  Private
 */
exports.generatePath = asyncHandler(async (req, res) => {
  const { 
    goal, 
    currentLevel, 
    priorKnowledge, 
    timeAvailable, 
    preferredContentType,
    targetTimeframe,
    domain 
  } = req.body;

  if (!goal) {
    return res.status(400).json({
      success: false,
      message: 'Learning goal is required'
    });
  }

  // Get available resources for the domain
  const query = { isActive: true };
  if (domain) query.domain = domain;
  
  const availableResources = await Resource.find(query)
    .select('title url sourceType topic subtopic level duration qualityScore tags')
    .sort({ qualityScore: -1 })
    .limit(100); // Top 100 resources

  if (availableResources.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No resources available for this domain yet'
    });
  }

  // Format resources for AI
  const resourceList = availableResources.map((r, i) => ({
    id: r._id.toString(),
    index: i,
    title: r.title,
    topic: r.topic,
    subtopic: r.subtopic,
    level: r.level,
    duration: r.duration,
    type: r.sourceType,
    quality: r.qualityScore
  }));

  // Generate path using Groq AI
  const prompt = `You are a learning path architect. Create a personalized learning path based on the following:

USER GOAL: ${goal}
CURRENT LEVEL: ${currentLevel || 'beginner'}
PRIOR KNOWLEDGE: ${priorKnowledge?.join(', ') || 'None specified'}
TIME AVAILABLE: ${timeAvailable || 'Not specified'}
PREFERRED CONTENT: ${preferredContentType?.join(', ') || 'Any'}
TARGET TIMEFRAME: ${targetTimeframe || 'Not specified'}

AVAILABLE RESOURCES (use resource index numbers):
${JSON.stringify(resourceList, null, 2)}

Create a structured learning path with 3-6 milestones. For each milestone, select the most appropriate resources from the available list.

Respond ONLY with valid JSON in this exact format:
{
  "title": "Path title",
  "description": "Brief description of this learning path",
  "estimatedDuration": "e.g., 40 hours",
  "milestones": [
    {
      "title": "Milestone title",
      "description": "What learner will achieve",
      "estimatedDuration": "e.g., 2 weeks",
      "resourceIndices": [0, 2, 5]
    }
  ]
}`;

  try {
    const aiResponse = await groqService.chat([
      { role: 'system', content: 'You are an expert learning path designer. Respond only with valid JSON.' },
      { role: 'user', content: prompt }
    ], { temperature: 0.7, maxTokens: 2000 });

    // Parse AI response
    let pathData;
    try {
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        pathData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate learning path. Please try again.'
      });
    }

    // Build milestones with resource references
    const milestones = pathData.milestones.map((m, index) => ({
      title: m.title,
      description: m.description,
      order: index,
      estimatedDuration: m.estimatedDuration,
      resources: (m.resourceIndices || []).map((resourceIndex, rIndex) => {
        const resource = availableResources[resourceIndex];
        return resource ? {
          resource: resource._id,
          order: rIndex,
          isRequired: true,
          isCompleted: false
        } : null;
      }).filter(Boolean)
    }));

    // Calculate total resources
    const totalResources = milestones.reduce((sum, m) => sum + m.resources.length, 0);

    // Create personalized path
    const personalizedPath = await PersonalizedPath.create({
      user: req.user.id,
      title: pathData.title,
      description: pathData.description,
      goal,
      userContext: {
        currentLevel,
        priorKnowledge,
        timeAvailable,
        preferredContentType,
        targetTimeframe
      },
      milestones,
      generation: {
        model: 'groq-llama',
        prompt: goal,
        resourcesConsidered: availableResources.length,
        generatedAt: new Date()
      },
      estimatedDuration: pathData.estimatedDuration,
      totalResources
    });

    // Populate resources for response
    await personalizedPath.populate('milestones.resources.resource', 'title url sourceType thumbnail duration topic');

    res.status(201).json({
      success: true,
      data: personalizedPath
    });

  } catch (error) {
    console.error('Path generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate learning path'
    });
  }
});

/**
 * @desc    Get user's learning paths
 * @route   GET /api/learning-path/my-paths
 * @access  Private
 */
exports.getMyPaths = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const paths = await PersonalizedPath.getUserPaths(req.user.id, status);

  res.status(200).json({
    success: true,
    count: paths.length,
    data: paths
  });
});

/**
 * @desc    Get single path with details
 * @route   GET /api/learning-path/:id
 * @access  Private
 */
exports.getPath = asyncHandler(async (req, res) => {
  const path = await PersonalizedPath.findById(req.params.id)
    .populate('milestones.resources.resource', 'title url sourceType thumbnail duration topic level');

  if (!path) {
    return res.status(404).json({
      success: false,
      message: 'Path not found'
    });
  }

  // Verify ownership
  if (path.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  // Update last accessed
  path.lastAccessedAt = new Date();
  await path.save();

  res.status(200).json({
    success: true,
    data: path
  });
});

/**
 * @desc    Complete resource in path
 * @route   POST /api/learning-path/:id/complete-resource
 * @access  Private
 */
exports.completePathResource = asyncHandler(async (req, res) => {
  const { milestoneIndex, resourceId } = req.body;

  const path = await PersonalizedPath.findById(req.params.id);

  if (!path) {
    return res.status(404).json({
      success: false,
      message: 'Path not found'
    });
  }

  if (path.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  await path.completeResource(milestoneIndex, resourceId);

  res.status(200).json({
    success: true,
    progress: path.progress,
    message: 'Resource marked as complete'
  });
});

/**
 * @desc    Update path status
 * @route   PUT /api/learning-path/:id/status
 * @access  Private
 */
exports.updatePathStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const path = await PersonalizedPath.findById(req.params.id);

  if (!path) {
    return res.status(404).json({
      success: false,
      message: 'Path not found'
    });
  }

  if (path.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  path.status = status;
  if (status === 'completed') {
    path.completedAt = new Date();
  }
  await path.save();

  res.status(200).json({
    success: true,
    data: path
  });
});

/**
 * @desc    Delete path
 * @route   DELETE /api/learning-path/:id
 * @access  Private
 */
exports.deletePath = asyncHandler(async (req, res) => {
  const path = await PersonalizedPath.findById(req.params.id);

  if (!path) {
    return res.status(404).json({
      success: false,
      message: 'Path not found'
    });
  }

  if (path.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized'
    });
  }

  await path.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Path deleted'
  });
});
