/**
 * BaseService - Abstract base class for all services
 * Implements common patterns for error handling, logging, and caching
 * @abstract
 */
class BaseService {
  constructor(serviceName) {
    if (new.target === BaseService) {
      throw new Error('BaseService is abstract and cannot be instantiated directly');
    }
    this.serviceName = serviceName;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Log a message with service context
   * @param {string} level - Log level (info, warn, error)
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.serviceName}] ${level.toUpperCase()}: ${message}`;
    
    if (data) {
      console[level](logMessage, data);
    } else {
      console[level](logMessage);
    }
  }

  /**
   * Get item from cache if not expired
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      this.log('info', `Cache hit for key: ${key}`);
      return cached.value;
    }
    return null;
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   */
  setCache(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    this.log('info', `Cached value for key: ${key}`);
  }

  /**
   * Clear all cache or specific key
   * @param {string} [key] - Specific key to clear, or clear all if not provided
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Handle errors consistently across services
   * @param {Error} error - The error to handle
   * @param {string} operation - The operation that failed
   * @throws {Error} Re-throws with enhanced error information
   */
  handleError(error, operation) {
    const enhancedError = new Error(
      `[${this.serviceName}] ${operation} failed: ${error.message}`
    );
    enhancedError.originalError = error;
    enhancedError.service = this.serviceName;
    enhancedError.operation = operation;
    
    this.log('error', `${operation} failed`, { error: error.message });
    throw enhancedError;
  }

  /**
   * Validate required parameters
   * @param {Object} params - Parameters to validate
   * @param {string[]} required - Required parameter names
   * @throws {Error} If any required parameter is missing
   */
  validateParams(params, required) {
    const missing = required.filter(key => !params[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Retry an operation with exponential backoff
   * @param {Function} operation - Async operation to retry
   * @param {number} [maxRetries=3] - Maximum number of retries
   * @param {number} [baseDelay=1000] - Base delay in ms
   * @returns {Promise<*>} Result of the operation
   */
  async withRetry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          this.log('warn', `Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }
}

module.exports = BaseService;
