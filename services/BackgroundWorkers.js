/**
 * Background Job Workers
 * 
 * Registers job processors for async tasks:
 * - Video analysis
 * - AI suggestions
 * - Readiness calculation
 * - Path inference updates
 */

const jobQueue = require('./JobQueue');
const caches = require('./CacheService');

// Initialize workers when module loads
const initializeWorkers = () => {
  console.log('Initializing background job workers...');

  /**
   * Video Analysis Worker
   * Analyzes video content and extracts skills/career info
   */
  jobQueue.register('video_analysis', async (data, job) => {
    const { videoId, userId, videoUrl, forceRefresh = false } = data;
    
    // Check cache first (skip if force refresh)
    if (!forceRefresh) {
      const cached = caches.videoAnalysis.get('analysis', videoId);
      if (cached) {
        console.log(`Video analysis cache hit for ${videoId}`);
        return cached;
      }
    }
    
    try {
      // Import services lazily to avoid circular deps
      const SavedVideo = require('../models/SavedVideo');
      
      // Get video from database
      const video = await SavedVideo.findOne({ videoId, userId });
      
      if (!video) {
        throw new Error(`Video ${videoId} not found`);
      }
      
      // If already analyzed and not forcing refresh, return existing
      if (video.codelearnnScore && video.inferredSkills?.length > 0 && !forceRefresh) {
        caches.videoAnalysis.set('analysis', videoId, {
          skills: video.inferredSkills,
          careers: video.inferredCareers,
          score: video.codelearnnScore
        });
        return video;
      }
      
      // Perform analysis using GroqService
      const GroqService = require('./GroqService');
      const analysis = await GroqService.analyzeVideo({
        title: video.title,
        description: video.description || '',
        channelTitle: video.channelTitle
      });
      
      // Update video with analysis results
      video.inferredSkills = analysis.skills || [];
      video.inferredCareers = analysis.careers || [];
      video.codelearnnScore = analysis.score || 0;
      video.analysisUpdatedAt = new Date();
      
      await video.save();
      
      // Cache the result
      caches.videoAnalysis.set('analysis', videoId, {
        skills: video.inferredSkills,
        careers: video.inferredCareers,
        score: video.codelearnnScore
      });
      
      console.log(`Video ${videoId} analyzed successfully`);
      return video;
      
    } catch (error) {
      console.error(`Video analysis failed for ${videoId}:`, error.message);
      throw error;
    }
  });

  /**
   * AI Suggestion Generation Worker
   */
  jobQueue.register('ai_suggestions', async (data, job) => {
    const { pathId, userId, trigger, context } = data;
    
    try {
      const AISuggestionService = require('./AISuggestionService');
      
      const suggestions = await AISuggestionService.generateSuggestions(
        pathId,
        userId,
        trigger,
        context
      );
      
      console.log(`Generated ${suggestions.length} suggestions for path ${pathId}`);
      return suggestions;
      
    } catch (error) {
      console.error(`AI suggestion generation failed for ${pathId}:`, error.message);
      throw error;
    }
  });

  /**
   * Readiness Calculation Worker
   */
  jobQueue.register('readiness_calc', async (data, job) => {
    const { userId, careerId, pathId } = data;
    
    // Check cache
    const cacheKey = `${userId}_${careerId || 'default'}`;
    const cached = caches.readiness.get('score', cacheKey);
    
    if (cached) {
      return cached;
    }
    
    try {
      const CareerReadinessService = require('./CareerReadinessService');
      
      const readiness = await CareerReadinessService.calculateReadiness(
        userId,
        careerId
      );
      
      // Update path if provided
      if (pathId) {
        await CareerReadinessService.updatePathReadiness(pathId, userId);
      }
      
      // Cache result
      caches.readiness.set('score', cacheKey, readiness);
      
      console.log(`Readiness calculated for user ${userId}: ${readiness.score}%`);
      return readiness;
      
    } catch (error) {
      console.error(`Readiness calculation failed for ${userId}:`, error.message);
      throw error;
    }
  });

  /**
   * Path Inference Update Worker
   * Updates inferred skills/careers based on path content
   */
  jobQueue.register('path_inference', async (data, job) => {
    const { pathId, userId, mode = 'diff' } = data;
    
    try {
      const UserLearningPath = require('../models/UserLearningPath');
      
      const path = await UserLearningPath.findById(pathId);
      if (!path) {
        throw new Error(`Path ${pathId} not found`);
      }
      
      // Collect skills/careers from all nodes
      const allSkills = new Set();
      const allCareers = new Set();
      
      for (const node of path.structureGraph.nodes) {
        if (node.skills) {
          node.skills.forEach(s => allSkills.add(s));
        }
        if (node.careers) {
          node.careers.forEach(c => allCareers.add(c));
        }
      }
      
      // Only update if there are changes (diff mode)
      const currentSkills = new Set(path.inferredSkills);
      const currentCareers = new Set(path.inferredCareers);
      
      const skillsChanged = 
        allSkills.size !== currentSkills.size ||
        [...allSkills].some(s => !currentSkills.has(s));
      
      const careersChanged = 
        allCareers.size !== currentCareers.size ||
        [...allCareers].some(c => !currentCareers.has(c));
      
      if (skillsChanged || careersChanged || mode === 'full') {
        path.inferredSkills = [...allSkills];
        path.inferredCareers = [...allCareers];
        await path.save();
        
        // Invalidate readiness cache for user
        caches.readiness.deleteNamespace('score');
        
        console.log(`Path ${pathId} inference updated`);
      } else {
        console.log(`Path ${pathId} inference unchanged (skipped)`);
      }
      
      return {
        skills: [...allSkills],
        careers: [...allCareers],
        changed: skillsChanged || careersChanged
      };
      
    } catch (error) {
      console.error(`Path inference update failed for ${pathId}:`, error.message);
      throw error;
    }
  });

  /**
   * Batch Video Analysis Worker
   */
  jobQueue.register('batch_video_analysis', async (data, job) => {
    const { videoIds, userId, delayBetween = 1000 } = data;
    
    const results = {
      successful: [],
      failed: []
    };
    
    for (const videoId of videoIds) {
      try {
        // Add individual job with delay
        await jobQueue.add('video_analysis', {
          videoId,
          userId,
          forceRefresh: false
        }, { delay: delayBetween });
        
        results.successful.push(videoId);
      } catch (error) {
        results.failed.push({ videoId, error: error.message });
      }
    }
    
    console.log(`Batch analysis queued: ${results.successful.length} videos`);
    return results;
  });

  console.log('Background job workers initialized');
};

// Helper to queue common jobs
const queueJobs = {
  analyzeVideo: (videoId, userId, options = {}) => 
    jobQueue.add('video_analysis', { videoId, userId, ...options }),
  
  generateSuggestions: (pathId, userId, trigger, context = {}) =>
    jobQueue.add('ai_suggestions', { pathId, userId, trigger, context }),
  
  calculateReadiness: (userId, careerId = null, pathId = null) =>
    jobQueue.add('readiness_calc', { userId, careerId, pathId }),
  
  updatePathInference: (pathId, userId, mode = 'diff') =>
    jobQueue.add('path_inference', { pathId, userId, mode }),
  
  batchAnalyzeVideos: (videoIds, userId, options = {}) =>
    jobQueue.add('batch_video_analysis', { videoIds, userId, ...options }, { priority: 'low' })
};

module.exports = {
  initializeWorkers,
  queueJobs,
  jobQueue
};
