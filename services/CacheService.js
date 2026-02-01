/**
 * Cache Service
 * 
 * In-memory cache with TTL support for:
 * - Video analysis results
 * - Readiness scores
 * - Skills data
 * - Career information
 * 
 * For production, extend to use Redis
 */

class CacheService {
  constructor(options = {}) {
    this.cache = new Map();
    this.defaultTTL = options.defaultTTL || 300000; // 5 minutes
    this.maxSize = options.maxSize || 1000;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this._cleanup();
    }, 60000); // Every minute
  }

  /**
   * Get cache key with namespace
   */
  _key(namespace, key) {
    return `${namespace}:${key}`;
  }

  /**
   * Get value from cache
   */
  get(namespace, key) {
    const cacheKey = this._key(namespace, key);
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check expiration
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }

  /**
   * Set value in cache
   */
  set(namespace, key, value, ttl = null) {
    const cacheKey = this._key(namespace, key);
    
    // Enforce max size
    if (this.cache.size >= this.maxSize) {
      this._evict();
    }
    
    this.cache.set(cacheKey, {
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl || this.defaultTTL),
      accessCount: 0
    });
    
    this.stats.sets++;
  }

  /**
   * Delete from cache
   */
  delete(namespace, key) {
    const cacheKey = this._key(namespace, key);
    const deleted = this.cache.delete(cacheKey);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  /**
   * Delete all keys in a namespace
   */
  deleteNamespace(namespace) {
    let deleted = 0;
    const prefix = `${namespace}:`;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    this.stats.deletes += deleted;
    return deleted;
  }

  /**
   * Get or set with callback
   */
  async getOrSet(namespace, key, callback, ttl = null) {
    let value = this.get(namespace, key);
    
    if (value === null) {
      value = await callback();
      this.set(namespace, key, value, ttl);
    }
    
    return value;
  }

  /**
   * Invalidate cache on data change
   */
  invalidate(patterns) {
    let invalidated = 0;
    
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        // Wildcard pattern
        const regex = new RegExp(
          '^' + pattern.replace(/\*/g, '.*') + '$'
        );
        
        for (const key of this.cache.keys()) {
          if (regex.test(key)) {
            this.cache.delete(key);
            invalidated++;
          }
        }
      } else {
        // Exact key
        if (this.cache.delete(pattern)) {
          invalidated++;
        }
      }
    }
    
    return invalidated;
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? Math.round((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100)
        : 0
    };
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Cleanup expired entries
   */
  _cleanup() {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`Cache cleanup: removed ${removed} expired entries`);
    }
  }

  /**
   * Evict oldest entries when at capacity
   */
  _evict() {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
    
    // Remove oldest 10%
    const toRemove = Math.ceil(this.maxSize * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Destroy cache (cleanup interval)
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Pre-configured cache instances
const caches = {
  // Video analysis cache (1 hour TTL)
  videoAnalysis: new CacheService({ defaultTTL: 3600000 }),
  
  // User readiness cache (5 minutes TTL)
  readiness: new CacheService({ defaultTTL: 300000 }),
  
  // Skills/Career data cache (30 minutes TTL)
  careerData: new CacheService({ defaultTTL: 1800000 }),
  
  // General purpose cache
  general: new CacheService()
};

module.exports = caches;
module.exports.CacheService = CacheService;
