/**
 * Event Service
 * Handles recording user events to the event store
 * Provides a clean API for event recording throughout the application
 */

const UserEvent = require('../models/UserEvent');
const cacheService = require('./CacheService');

class EventService {
  /**
   * Record a learning event
   */
  static async recordLearningEvent(userId, eventType, data = {}) {
    try {
      const event = await UserEvent.record(userId, eventType, 'learning', {
        ...data,
        source: data.source || 'web'
      });
      
      // Invalidate user progress cache on significant events
      if (['resource_completed', 'path_completed', 'path_milestone_completed'].includes(eventType)) {
        await cacheService.invalidateUserProgress(userId);
      }
      
      return event;
    } catch (error) {
      console.error('Error recording learning event:', error.message);
      // Don't throw - event recording shouldn't break the main flow
      return null;
    }
  }

  /**
   * Record when user starts a resource
   */
  static async resourceStarted(userId, resourceId, resourceTitle, resourceType, pathId = null) {
    return this.recordLearningEvent(userId, 'resource_started', {
      resourceId,
      resourceTitle,
      resourceType,
      pathId
    });
  }

  /**
   * Record resource progress update
   */
  static async resourceProgress(userId, resourceId, progressBefore, progressAfter, timeSpent = 0) {
    return this.recordLearningEvent(userId, 'resource_progress', {
      resourceId,
      progressBefore,
      progressAfter,
      timeSpent
    });
  }

  /**
   * Record when user completes a resource
   */
  static async resourceCompleted(userId, resourceId, resourceTitle, resourceType, timeSpent = 0, pathId = null) {
    return this.recordLearningEvent(userId, 'resource_completed', {
      resourceId,
      resourceTitle,
      resourceType,
      timeSpent,
      pathId
    });
  }

  /**
   * Record path enrollment
   */
  static async pathEnrolled(userId, pathId, pathTitle) {
    return this.recordLearningEvent(userId, 'path_enrolled', {
      pathId,
      pathTitle
    });
  }

  /**
   * Record milestone completion
   */
  static async pathMilestoneCompleted(userId, pathId, pathTitle, milestoneIndex, milestoneTitle) {
    return this.recordLearningEvent(userId, 'path_milestone_completed', {
      pathId,
      pathTitle,
      milestoneIndex,
      milestoneTitle
    });
  }

  /**
   * Record path completion
   */
  static async pathCompleted(userId, pathId, pathTitle, completionRate = 100) {
    return this.recordLearningEvent(userId, 'path_completed', {
      pathId,
      pathTitle,
      completionRate
    });
  }

  // ==================== ASSESSMENT EVENTS ====================

  /**
   * Record an assessment event
   */
  static async recordAssessmentEvent(userId, eventType, data = {}) {
    try {
      return await UserEvent.record(userId, eventType, 'assessment', data);
    } catch (error) {
      console.error('Error recording assessment event:', error.message);
      return null;
    }
  }

  /**
   * Record quiz completion
   */
  static async quizCompleted(userId, quizId, score, maxScore, passingScore, timeTaken, passed) {
    return this.recordAssessmentEvent(userId, passed ? 'quiz_passed' : 'quiz_failed', {
      quizId,
      score,
      maxScore,
      passingScore,
      timeTaken
    });
  }

  /**
   * Record coding challenge submission
   */
  static async challengeSubmitted(userId, challengeId, passed, timeTaken) {
    return this.recordAssessmentEvent(userId, passed ? 'challenge_passed' : 'challenge_failed', {
      challengeId,
      timeTaken
    });
  }

  // ==================== SKILL EVENTS ====================

  /**
   * Record a skill event
   */
  static async recordSkillEvent(userId, eventType, data = {}) {
    try {
      const event = await UserEvent.record(userId, eventType, 'skill', data);
      
      // Invalidate skills cache
      await cacheService.invalidateUserSkills(userId);
      
      return event;
    } catch (error) {
      console.error('Error recording skill event:', error.message);
      return null;
    }
  }

  /**
   * Record skill update
   */
  static async skillUpdated(userId, skillName, skillBefore, skillAfter, skillLevel, xpEarned = 0) {
    return this.recordSkillEvent(userId, 'skill_updated', {
      skillName,
      skillBefore,
      skillAfter,
      skillLevel,
      xpEarned
    });
  }

  /**
   * Record skill level up
   */
  static async skillLevelUp(userId, skillName, skillAfter, newLevel) {
    return this.recordSkillEvent(userId, 'skill_level_up', {
      skillName,
      skillAfter,
      skillLevel: newLevel
    });
  }

  // ==================== ENGAGEMENT EVENTS ====================

  /**
   * Record an engagement event
   */
  static async recordEngagementEvent(userId, eventType, data = {}) {
    try {
      return await UserEvent.record(userId, eventType, 'engagement', data);
    } catch (error) {
      console.error('Error recording engagement event:', error.message);
      return null;
    }
  }

  /**
   * Record daily login
   */
  static async dailyLogin(userId, streakCount) {
    return this.recordEngagementEvent(userId, 'daily_login', {
      streakCount
    });
  }

  /**
   * Record streak achievement
   */
  static async streakAchieved(userId, streakCount) {
    return this.recordEngagementEvent(userId, 'streak_achieved', {
      streakCount
    });
  }

  /**
   * Record XP earned
   */
  static async xpEarned(userId, xpEarned, source) {
    return this.recordEngagementEvent(userId, 'xp_earned', {
      xpEarned,
      source
    });
  }

  /**
   * Record achievement unlocked
   */
  static async achievementUnlocked(userId, achievementId, achievementName) {
    return this.recordEngagementEvent(userId, 'achievement_unlocked', {
      achievementId,
      achievementName
    });
  }

  // ==================== SUBSCRIPTION EVENTS ====================

  /**
   * Record a subscription event
   */
  static async recordSubscriptionEvent(userId, eventType, data = {}) {
    try {
      return await UserEvent.record(userId, eventType, 'subscription', data);
    } catch (error) {
      console.error('Error recording subscription event:', error.message);
      return null;
    }
  }

  /**
   * Record subscription started
   */
  static async subscriptionStarted(userId, tierAfter, subscriptionId) {
    return this.recordSubscriptionEvent(userId, 'subscription_started', {
      tierBefore: 'free',
      tierAfter,
      subscriptionId
    });
  }

  /**
   * Record subscription upgraded
   */
  static async subscriptionUpgraded(userId, tierBefore, tierAfter) {
    return this.recordSubscriptionEvent(userId, 'subscription_upgraded', {
      tierBefore,
      tierAfter
    });
  }

  /**
   * Record subscription cancelled
   */
  static async subscriptionCancelled(userId, tier) {
    return this.recordSubscriptionEvent(userId, 'subscription_cancelled', {
      tierBefore: tier,
      tierAfter: 'free'
    });
  }

  // ==================== SYSTEM EVENTS ====================

  /**
   * Record a system event
   */
  static async recordSystemEvent(userId, eventType, data = {}) {
    try {
      return await UserEvent.record(userId, eventType, 'system', data);
    } catch (error) {
      console.error('Error recording system event:', error.message);
      return null;
    }
  }

  /**
   * Record account creation
   */
  static async accountCreated(userId, source = 'email') {
    return this.recordSystemEvent(userId, 'account_created', {
      source
    });
  }

  /**
   * Record AI recommendation shown
   */
  static async aiRecommendationShown(userId, recommendationType, recommendedItems) {
    return this.recordSystemEvent(userId, 'ai_recommendation_shown', {
      recommendationType,
      recommendedItems
    });
  }

  /**
   * Record AI recommendation clicked
   */
  static async aiRecommendationClicked(userId, recommendationType, clickedItemId) {
    return this.recordSystemEvent(userId, 'ai_recommendation_clicked', {
      recommendationType,
      resourceId: clickedItemId
    });
  }

  // ==================== ANALYTICS QUERIES ====================

  /**
   * Get user's learning statistics
   */
  static async getLearningStats(userId) {
    return UserEvent.getLearningStats(userId);
  }

  /**
   * Get user's recent activity
   */
  static async getRecentActivity(userId, limit = 20) {
    return UserEvent.getRecentEvents(userId, limit);
  }

  /**
   * Get activity summary for date range
   */
  static async getActivitySummary(userId, startDate, endDate) {
    return UserEvent.getActivitySummary(userId, startDate, endDate);
  }

  /**
   * Get skill progression history
   */
  static async getSkillProgression(userId, skillName) {
    return UserEvent.getSkillProgression(userId, skillName);
  }
}

module.exports = EventService;
