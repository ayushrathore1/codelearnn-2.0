const UserCareerJourney = require('../models/UserCareerJourney');
const CareerRoadmap = require('../models/CareerRoadmap');
const FreeResource = require('../models/FreeResource');
const User = require('../models/User');
const { EventService } = require('../services/EventService');

/**
 * @desc    Get user's active career journey
 * @route   GET /api/journey/active
 * @access  Private
 */
exports.getActiveJourney = async (req, res) => {
  try {
    const journey = await UserCareerJourney.getActiveJourney(req.user._id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active career journey found. Start one from Career Explorer!',
        data: null
      });
    }

    res.json({
      success: true,
      data: journey
    });
  } catch (error) {
    console.error('Error fetching journey:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get journey overview/dashboard data
 * @route   GET /api/journey/overview
 * @access  Private
 */
exports.getJourneyOverview = async (req, res) => {
  try {
    const journey = await UserCareerJourney.getActiveJourney(req.user._id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active career journey',
        data: null
      });
    }

    // Get current phase details
    const currentPhase = journey.roadmap.phases.find(
      p => p.phaseId === journey.roadmap.currentPhaseId
    );

    // Calculate next actions
    const nextActions = [];
    if (currentPhase) {
      const incompleteResources = currentPhase.resources
        .filter(r => !r.isCompleted)
        .slice(0, 3);
      
      incompleteResources.forEach((resource, idx) => {
        nextActions.push({
          type: 'resource',
          title: resource.title,
          resourceType: resource.type,
          resourceId: resource.resourceId || resource.externalResourceId,
          phaseId: currentPhase.phaseId,
          duration: resource.duration,
          priority: idx === 0 ? 'high' : 'medium'
        });
      });

      // Check for projects
      if (currentPhase.progress >= 50) {
        const readyProjects = currentPhase.projects.filter(p => !p.isStarted);
        if (readyProjects.length > 0) {
          nextActions.push({
            type: 'project',
            title: readyProjects[0].title,
            projectId: readyProjects[0].projectId,
            phaseId: currentPhase.phaseId,
            priority: 'medium'
          });
        }
      }
    }

    // Calculate estimated time remaining
    const totalPhases = journey.roadmap.phases.length;
    const completedPhases = journey.stats.phasesCompleted;
    const avgWeeksPerPhase = journey.roadmap.estimatedWeeks / totalPhases;
    const remainingWeeks = Math.round((totalPhases - completedPhases) * avgWeeksPerPhase);

    res.json({
      success: true,
      data: {
        career: journey.career,
        currentPhase: currentPhase ? {
          phaseId: currentPhase.phaseId,
          phaseNumber: currentPhase.phaseNumber,
          title: currentPhase.title,
          progress: currentPhase.progress,
          resourcesRemaining: currentPhase.resources.filter(r => !r.isCompleted).length
        } : null,
        stats: journey.stats,
        nextActions,
        timeline: {
          startedAt: journey.startedAt,
          estimatedWeeks: journey.roadmap.estimatedWeeks,
          remainingWeeks,
          targetDate: journey.targetDate
        },
        totalPhases: totalPhases,
        preferences: journey.preferences
      }
    });
  } catch (error) {
    console.error('Error fetching journey overview:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get full roadmap for the journey
 * @route   GET /api/journey/roadmap
 * @access  Private
 */
exports.getJourneyRoadmap = async (req, res) => {
  try {
    const journey = await UserCareerJourney.getActiveJourney(req.user._id);
    
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active career journey'
      });
    }

    res.json({
      success: true,
      data: {
        career: journey.career,
        phases: journey.roadmap.phases,
        currentPhaseId: journey.roadmap.currentPhaseId,
        estimatedWeeks: journey.roadmap.estimatedWeeks,
        stats: journey.stats
      }
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Start a new career journey
 * @route   POST /api/journey/start
 * @access  Private
 */
exports.startJourney = async (req, res) => {
  try {
    const { career, preferences } = req.body;
    
    if (!career || !career.title) {
      return res.status(400).json({
        success: false,
        message: 'Career data is required'
      });
    }

    // Generate roadmap (could call AI service here in future)
    const roadmap = await generateDefaultRoadmap(career, preferences);

    // Create the journey
    const journey = await UserCareerJourney.startJourney(
      req.user._id,
      {
        careerId: career.careerId || career.name?.toLowerCase().replace(/\s+/g, '-'),
        title: career.name || career.title,
        description: career.description,
        icon: career.icon,
        demandLevel: career.demandLevel,
        avgSalary: career.avgSalaryUSD || career.avgSalary,
        growthRate: career.growthRate
      },
      {
        weeklyHours: preferences?.weeklyHours || 10,
        experienceLevel: preferences?.experienceLevel || 'beginner',
        learningStyle: preferences?.learningStyle || 'mixed'
      },
      roadmap
    );

    // Update user's career goal
    await User.findByIdAndUpdate(req.user._id, {
      $set: { careerGoal: career.name || career.title }
    });

    // Record event
    if (EventService) {
      await EventService.recordEvent(req.user._id, 'CAREER_SELECTED', {
        careerId: journey.career.careerId,
        careerTitle: journey.career.title
      });
    }

    res.status(201).json({
      success: true,
      message: 'Career journey started successfully!',
      data: journey
    });
  } catch (error) {
    console.error('Error starting journey:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start journey',
      error: error.message
    });
  }
};

/**
 * @desc    Complete a resource in the journey
 * @route   POST /api/journey/resource/complete
 * @access  Private
 */
exports.completeResource = async (req, res) => {
  try {
    const { phaseId, resourceId } = req.body;
    
    if (!phaseId || !resourceId) {
      return res.status(400).json({
        success: false,
        message: 'phaseId and resourceId are required'
      });
    }

    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey found'
      });
    }

    await journey.completeResource(phaseId, resourceId);

    // Record event
    if (EventService) {
      await EventService.recordEvent(req.user._id, 'VIDEO_COMPLETED', {
        resourceId,
        source: 'career_journey',
        phaseId
      });
    }

    res.json({
      success: true,
      message: 'Resource completed!',
      data: {
        phaseProgress: journey.roadmap.phases.find(p => p.phaseId === phaseId)?.progress,
        overallProgress: journey.stats.overallProgress,
        xpEarned: 10
      }
    });
  } catch (error) {
    console.error('Error completing resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete resource',
      error: error.message
    });
  }
};

/**
 * @desc    Get next recommended actions
 * @route   GET /api/journey/next-actions
 * @access  Private
 */
exports.getNextActions = async (req, res) => {
  try {
    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: 'active'
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey'
      });
    }

    const actions = journey.getNextActions();

    res.json({
      success: true,
      data: actions
    });
  } catch (error) {
    console.error('Error getting next actions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Get journey history/timeline
 * @route   GET /api/journey/history
 * @access  Private
 */
exports.getJourneyHistory = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: 'active'
    }).select('history career startedAt').lean();

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No active journey'
      });
    }

    // Get recent history
    const history = journey.history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: {
        career: journey.career,
        startedAt: journey.startedAt,
        events: history
      }
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Pause/Resume journey
 * @route   POST /api/journey/toggle-pause
 * @access  Private
 */
exports.togglePauseJourney = async (req, res) => {
  try {
    const journey = await UserCareerJourney.findOne({
      user: req.user._id,
      status: { $in: ['active', 'paused'] }
    });

    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'No journey found'
      });
    }

    const wasPaused = journey.status === 'paused';
    
    journey.status = wasPaused ? 'active' : 'paused';
    if (wasPaused) {
      journey.history.push({
        eventType: 'JOURNEY_RESUMED',
        timestamp: new Date()
      });
    } else {
      journey.pausedAt = new Date();
      journey.history.push({
        eventType: 'JOURNEY_PAUSED',
        timestamp: new Date()
      });
    }

    await journey.save();

    res.json({
      success: true,
      message: wasPaused ? 'Journey resumed!' : 'Journey paused',
      data: { status: journey.status }
    });
  } catch (error) {
    console.error('Error toggling pause:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// ============= Helper Functions =============

/**
 * Generate default roadmap phases based on career
 */
async function generateDefaultRoadmap(career, preferences) {
  const careerName = career.name || career.title || 'Developer';
  const weeklyHours = preferences?.weeklyHours || 10;
  const experienceLevel = preferences?.experienceLevel || 'beginner';

  // Try to get existing resources from vault
  let vaultResources = [];
  try {
    vaultResources = await FreeResource.find({
      $or: [
        { category: { $regex: careerName, $options: 'i' } },
        { tags: { $in: careerName.toLowerCase().split(' ') } },
        { title: { $regex: careerName.split(' ')[0], $options: 'i' } }
      ],
      isActive: true
    })
    .sort({ codeLearnnScore: -1 })
    .limit(20)
    .select('_id title type duration category tags')
    .lean();
  } catch (e) {
    console.log('Could not fetch vault resources:', e.message);
  }

  // Distribute resources across phases
  const resourcesPerPhase = Math.max(3, Math.ceil(vaultResources.length / 5));

  // Default phases structure
  const phases = [
    {
      phaseId: 'phase-1',
      phaseNumber: 1,
      title: 'Fundamentals & Setup',
      description: `Build the foundational knowledge required for ${careerName}`,
      status: 'in_progress',
      progress: 0,
      priority: 'critical',
      startedAt: new Date(),
      durationWeeks: experienceLevel === 'beginner' ? 4 : 2,
      skills: [
        { skillName: 'Programming Basics', targetScore: 80, currentScore: 0 },
        { skillName: 'Version Control', targetScore: 70, currentScore: 0 },
        { skillName: 'Problem Solving', targetScore: 75, currentScore: 0 }
      ],
      resources: vaultResources.slice(0, resourcesPerPhase).map((r, i) => ({
        resourceId: r._id,
        type: r.type || 'video',
        title: r.title,
        duration: r.duration || 60,
        isCompleted: false,
        progress: 0,
        order: i + 1
      })),
      projects: [
        { projectId: 'p1-1', title: 'Setup Development Portfolio', difficulty: 'beginner', estimatedHours: 4, isStarted: false, isCompleted: false }
      ],
      milestones: [
        { milestoneId: 'm1-1', title: 'Complete fundamentals', xpReward: 50, isAchieved: false }
      ]
    },
    {
      phaseId: 'phase-2',
      phaseNumber: 2,
      title: 'Core Technical Skills',
      description: `Master the essential technical skills for ${careerName}`,
      status: 'locked',
      progress: 0,
      priority: 'critical',
      durationWeeks: 5,
      skills: [
        { skillName: 'Core Technology', targetScore: 85, currentScore: 0 },
        { skillName: 'Data Structures', targetScore: 70, currentScore: 0 },
        { skillName: 'Algorithms', targetScore: 65, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase, resourcesPerPhase * 2).map((r, i) => ({
        resourceId: r._id,
        type: r.type || 'video',
        title: r.title,
        duration: r.duration || 90,
        isCompleted: false,
        progress: 0,
        order: i + 1
      })),
      projects: [
        { projectId: 'p2-1', title: 'Build Your First Application', difficulty: 'beginner', estimatedHours: 8, isStarted: false, isCompleted: false }
      ],
      milestones: [
        { milestoneId: 'm2-1', title: 'Complete first project', xpReward: 100, isAchieved: false }
      ]
    },
    {
      phaseId: 'phase-3',
      phaseNumber: 3,
      title: 'Intermediate Concepts',
      description: 'Level up with intermediate concepts and practices',
      status: 'locked',
      progress: 0,
      priority: 'high',
      durationWeeks: 5,
      skills: [
        { skillName: 'Frameworks', targetScore: 80, currentScore: 0 },
        { skillName: 'Database', targetScore: 75, currentScore: 0 },
        { skillName: 'APIs', targetScore: 80, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase * 2, resourcesPerPhase * 3).map((r, i) => ({
        resourceId: r._id,
        type: r.type || 'video',
        title: r.title,
        duration: r.duration || 120,
        isCompleted: false,
        progress: 0,
        order: i + 1
      })),
      projects: [
        { projectId: 'p3-1', title: 'Full-Featured Application', difficulty: 'intermediate', estimatedHours: 16, isStarted: false, isCompleted: false }
      ]
    },
    {
      phaseId: 'phase-4',
      phaseNumber: 4,
      title: 'Advanced & Professional Skills',
      description: 'Master advanced concepts and professional practices',
      status: 'locked',
      progress: 0,
      priority: 'high',
      durationWeeks: 5,
      skills: [
        { skillName: 'System Design', targetScore: 70, currentScore: 0 },
        { skillName: 'Testing', targetScore: 75, currentScore: 0 },
        { skillName: 'Security', targetScore: 70, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase * 3, resourcesPerPhase * 4).map((r, i) => ({
        resourceId: r._id,
        type: r.type || 'video',
        title: r.title,
        duration: r.duration || 120,
        isCompleted: false,
        progress: 0,
        order: i + 1
      })),
      projects: [
        { projectId: 'p4-1', title: 'Production-Ready Project', difficulty: 'advanced', estimatedHours: 24, isStarted: false, isCompleted: false }
      ]
    },
    {
      phaseId: 'phase-5',
      phaseNumber: 5,
      title: 'Capstone & Career Prep',
      description: 'Complete capstone project and prepare for job applications',
      status: 'locked',
      progress: 0,
      priority: 'medium',
      durationWeeks: 4,
      skills: [
        { skillName: 'Portfolio', targetScore: 85, currentScore: 0 },
        { skillName: 'Interview Prep', targetScore: 80, currentScore: 0 }
      ],
      resources: vaultResources.slice(resourcesPerPhase * 4).map((r, i) => ({
        resourceId: r._id,
        type: r.type || 'video',
        title: r.title,
        duration: r.duration || 60,
        isCompleted: false,
        progress: 0,
        order: i + 1
      })),
      projects: [
        { projectId: 'p5-1', title: 'Capstone Project', difficulty: 'advanced', estimatedHours: 40, isStarted: false, isCompleted: false }
      ],
      milestones: [
        { milestoneId: 'm5-1', title: 'Portfolio complete', xpReward: 200, isAchieved: false },
        { milestoneId: 'm5-2', title: 'Career ready!', xpReward: 500, isAchieved: false }
      ]
    }
  ];

  // Add placeholder resources if no vault resources found
  phases.forEach(phase => {
    if (phase.resources.length === 0) {
      phase.resources = [
        { externalResourceId: `${phase.phaseId}-r1`, type: 'video', title: `${phase.title} - Introduction`, duration: 30, isCompleted: false, order: 1 },
        { externalResourceId: `${phase.phaseId}-r2`, type: 'article', title: `${phase.title} - Deep Dive`, duration: 20, isCompleted: false, order: 2 },
        { externalResourceId: `${phase.phaseId}-r3`, type: 'practice', title: `${phase.title} - Practice`, duration: 45, isCompleted: false, order: 3 }
      ];
    }
  });

  // Calculate estimated weeks based on commitment
  const baseWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
  const adjustedWeeks = Math.round(baseWeeks * (15 / weeklyHours)); // 15 hrs is baseline

  return {
    phases,
    currentPhaseId: 'phase-1',
    currentPhaseNumber: 1,
    estimatedWeeks: adjustedWeeks,
    generatedAt: new Date(),
    generatedBy: 'default'
  };
}

module.exports = exports;
