/**
 * Cache Service - Redis wrapper using Upstash
 * Serverless Redis for caching user progress, video analysis, and rate limiting
 * 
 * Setup:
 * 1. Create free account at https://upstash.com
 * 2. Create a Redis database
 * 3. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env
 */

const { Redis } = require('@upstash/redis');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.fallbackCache = new Map(); // In-memory fallback
    this.fallbackTTLs = new Map();
  }

  /**
   * Initialize Redis connection
   * Call this once on server startup
   */
  async initialize() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn('⚠️  Redis (Upstash) not configured. Using in-memory fallback cache.');
      console.warn('   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env');
      return false;
    }

    try {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
      });

      // Test connection
      await this.redis.ping();
      this.isConnected = true;
      console.log('✅ Redis (Upstash) connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      console.warn('   Falling back to in-memory cache');
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace, identifier) {
    return `codelearnn:${namespace}:${identifier}`;
  }

  // ==================== CORE CACHE OPERATIONS ====================

  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (this.isConnected && this.redis) {
        const value = await this.redis.get(key);
        return value;
      }
      
      // Fallback: Check in-memory cache with TTL
      if (this.fallbackCache.has(key)) {
        const ttl = this.fallbackTTLs.get(key);
        if (!ttl || Date.now() < ttl) {
          return this.fallbackCache.get(key);
        }
        // Expired
        this.fallbackCache.delete(key);
        this.fallbackTTLs.delete(key);
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key, value, ttlSeconds = null) {
    try {
      if (this.isConnected && this.redis) {
        if (ttlSeconds) {
          await this.redis.set(key, value, { ex: ttlSeconds });
        } else {
          await this.redis.set(key, value);
        }
        return true;
      }
      
      // Fallback: In-memory cache
      this.fallbackCache.set(key, value);
      if (ttlSeconds) {
        this.fallbackTTLs.set(key, Date.now() + (ttlSeconds * 1000));
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key) {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(key);
      }
      this.fallbackCache.delete(key);
      this.fallbackTTLs.delete(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error.message);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      if (this.isConnected && this.redis) {
        return await this.redis.exists(key);
      }
      return this.fallbackCache.has(key);
    } catch (error) {
      console.error('Cache exists error:', error.message);
      return false;
    }
  }

  // ==================== SPECIALIZED CACHE METHODS ====================

  /**
   * Cache user progress snapshot
   * TTL: 1 hour (frequently accessed, updated on changes)
   */
  async cacheUserProgress(userId, progressData) {
    const key = this.generateKey('progress', userId);
    return this.set(key, progressData, 3600); // 1 hour
  }

  async getUserProgress(userId) {
    const key = this.generateKey('progress', userId);
    return this.get(key);
  }

  async invalidateUserProgress(userId) {
    const key = this.generateKey('progress', userId);
    return this.delete(key);
  }

  /**
   * Cache video analysis results
   * TTL: 7 days (expensive AI operation, rarely changes)
   */
  async cacheVideoAnalysis(videoId, analysisData) {
    const key = this.generateKey('video-analysis', videoId);
    return this.set(key, analysisData, 604800); // 7 days
  }

  async getVideoAnalysis(videoId) {
    const key = this.generateKey('video-analysis', videoId);
    return this.get(key);
  }

  /**
   * Cache learning path metadata
   * TTL: 24 hours (admin updated, not frequently changed)
   */
  async cacheLearningPath(pathId, pathData) {
    const key = this.generateKey('path', pathId);
    return this.set(key, pathData, 86400); // 24 hours
  }

  async getLearningPath(pathId) {
    const key = this.generateKey('path', pathId);
    return this.get(key);
  }

  /**
   * Cache course data
   * TTL: 24 hours
   */
  async cacheCourse(courseId, courseData) {
    const key = this.generateKey('course', courseId);
    return this.set(key, courseData, 86400);
  }

  async getCourse(courseId) {
    const key = this.generateKey('course', courseId);
    return this.get(key);
  }

  /**
   * Cache user skills summary
   * TTL: 2 hours
   */
  async cacheUserSkills(userId, skillsData) {
    const key = this.generateKey('skills', userId);
    return this.set(key, skillsData, 7200); // 2 hours
  }

  async getUserSkills(userId) {
    const key = this.generateKey('skills', userId);
    return this.get(key);
  }

  async invalidateUserSkills(userId) {
    const key = this.generateKey('skills', userId);
    return this.delete(key);
  }

  // ==================== RATE LIMITING ====================

  /**
   * Rate limit check and increment
   * Returns { allowed: boolean, remaining: number, resetAt: Date }
   */
  async checkRateLimit(identifier, limit, windowSeconds) {
    const key = this.generateKey('ratelimit', identifier);
    
    try {
      if (this.isConnected && this.redis) {
        const current = await this.redis.incr(key);
        
        // Set expiry on first request
        if (current === 1) {
          await this.redis.expire(key, windowSeconds);
        }
        
        const ttl = await this.redis.ttl(key);
        
        return {
          allowed: current <= limit,
          current: current,
          remaining: Math.max(0, limit - current),
          resetAt: new Date(Date.now() + (ttl * 1000))
        };
      }
      
      // Fallback rate limiting
      const now = Date.now();
      const data = this.fallbackCache.get(key) || { count: 0, resetAt: now + (windowSeconds * 1000) };
      
      if (now > data.resetAt) {
        data.count = 1;
        data.resetAt = now + (windowSeconds * 1000);
      } else {
        data.count++;
      }
      
      this.fallbackCache.set(key, data);
      
      return {
        allowed: data.count <= limit,
        current: data.count,
        remaining: Math.max(0, limit - data.count),
        resetAt: new Date(data.resetAt)
      };
    } catch (error) {
      console.error('Rate limit error:', error.message);
      return { allowed: true, remaining: limit, resetAt: new Date() };
    }
  }

  // ==================== SESSION MANAGEMENT ====================

  /**
   * Store session data (for real-time features later)
   */
  async setSession(sessionId, data, ttlSeconds = 3600) {
    const key = this.generateKey('session', sessionId);
    return this.set(key, data, ttlSeconds);
  }

  async getSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return this.get(key);
  }

  async deleteSession(sessionId) {
    const key = this.generateKey('session', sessionId);
    return this.delete(key);
  }

  // ==================== LEADERBOARD (for gamification) ====================

  /**
   * Update leaderboard score
   */
  async updateLeaderboardScore(leaderboardName, userId, score) {
    if (!this.isConnected || !this.redis) return false;
    
    const key = this.generateKey('leaderboard', leaderboardName);
    try {
      await this.redis.zadd(key, { score, member: userId });
      return true;
    } catch (error) {
      console.error('Leaderboard update error:', error.message);
      return false;
    }
  }

  /**
   * Get top scores from leaderboard
   */
  async getLeaderboard(leaderboardName, limit = 10) {
    if (!this.isConnected || !this.redis) return [];
    
    const key = this.generateKey('leaderboard', leaderboardName);
    try {
      const results = await this.redis.zrange(key, 0, limit - 1, { rev: true, withScores: true });
      return results;
    } catch (error) {
      console.error('Leaderboard get error:', error.message);
      return [];
    }
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(leaderboardName, userId) {
    if (!this.isConnected || !this.redis) return null;
    
    const key = this.generateKey('leaderboard', leaderboardName);
    try {
      const rank = await this.redis.zrevrank(key, userId);
      return rank !== null ? rank + 1 : null; // 1-indexed
    } catch (error) {
      console.error('Leaderboard rank error:', error.message);
      return null;
    }
  }

  // ==================== UTILITY ====================

  /**
   * Clear all caches for a user (on significant changes or logout)
   */
  async clearUserCache(userId) {
    await Promise.all([
      this.invalidateUserProgress(userId),
      this.invalidateUserSkills(userId),
      this.deleteSession(userId)
    ]);
  }

  /**
   * Get cache statistics (for monitoring)
   */
  getStats() {
    return {
      isConnected: this.isConnected,
      fallbackCacheSize: this.fallbackCache.size
    };
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;
