/**
 * Background Job Queue Service
 * 
 * Manages async processing for:
 * - Video analysis
 * - AI suggestion generation
 * - Readiness score recalculation
 * - Path inference updates
 * 
 * Uses in-memory queue with optional Bull/Redis for production
 */

class JobQueue {
  constructor() {
    this.queues = new Map();
    this.workers = new Map();
    this.isProcessing = false;
    this.concurrency = 3;
    this.retryAttempts = 3;
    this.retryDelay = 5000;
  }

  /**
   * Register a job type with its processor
   */
  register(jobType, processor) {
    if (!this.queues.has(jobType)) {
      this.queues.set(jobType, []);
    }
    this.workers.set(jobType, processor);
    console.log(`Job type "${jobType}" registered`);
  }

  /**
   * Add a job to the queue
   */
  async add(jobType, data, options = {}) {
    const job = {
      id: `${jobType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: jobType,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || this.retryAttempts,
      priority: options.priority || 'normal',
      delay: options.delay || 0,
      createdAt: new Date(),
      status: 'pending'
    };

    const queue = this.queues.get(jobType);
    if (!queue) {
      throw new Error(`Unknown job type: ${jobType}`);
    }

    // Insert based on priority
    if (job.priority === 'high') {
      queue.unshift(job);
    } else {
      queue.push(job);
    }

    console.log(`Job ${job.id} added to queue`);
    
    // Start processing if not already running
    this._startProcessing();
    
    return job.id;
  }

  /**
   * Add multiple jobs in bulk
   */
  async addBulk(jobType, items, options = {}) {
    const jobIds = [];
    for (const item of items) {
      const id = await this.add(jobType, item, options);
      jobIds.push(id);
    }
    return jobIds;
  }

  /**
   * Start processing queue
   */
  async _startProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this._hasJobs()) {
      const jobs = this._getNextJobs(this.concurrency);
      
      await Promise.all(
        jobs.map(job => this._processJob(job))
      );
    }

    this.isProcessing = false;
  }

  /**
   * Process a single job
   */
  async _processJob(job) {
    const worker = this.workers.get(job.type);
    if (!worker) {
      console.error(`No worker for job type: ${job.type}`);
      return;
    }

    // Apply delay if specified
    if (job.delay > 0 && job.attempts === 0) {
      await this._sleep(job.delay);
    }

    job.status = 'processing';
    job.startedAt = new Date();
    job.attempts++;

    try {
      const result = await worker(job.data, job);
      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();
      console.log(`Job ${job.id} completed`);
    } catch (error) {
      job.error = error.message;
      
      if (job.attempts < job.maxAttempts) {
        // Retry with exponential backoff
        job.status = 'pending';
        const delay = this.retryDelay * Math.pow(2, job.attempts - 1);
        const queue = this.queues.get(job.type);
        
        setTimeout(() => {
          queue.push(job);
          this._startProcessing();
        }, delay);
        
        console.log(`Job ${job.id} failed, retrying in ${delay}ms (attempt ${job.attempts}/${job.maxAttempts})`);
      } else {
        job.status = 'failed';
        job.failedAt = new Date();
        console.error(`Job ${job.id} failed permanently:`, error.message);
      }
    }
  }

  /**
   * Check if any queue has jobs
   */
  _hasJobs() {
    for (const queue of this.queues.values()) {
      if (queue.some(j => j.status === 'pending')) return true;
    }
    return false;
  }

  /**
   * Get next jobs to process
   */
  _getNextJobs(count) {
    const jobs = [];
    
    for (const queue of this.queues.values()) {
      for (const job of queue) {
        if (job.status === 'pending' && jobs.length < count) {
          jobs.push(job);
        }
      }
    }
    
    return jobs;
  }

  /**
   * Get queue stats
   */
  getStats() {
    const stats = {
      queues: {},
      total: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }
    };

    for (const [type, queue] of this.queues.entries()) {
      stats.queues[type] = {
        pending: queue.filter(j => j.status === 'pending').length,
        processing: queue.filter(j => j.status === 'processing').length,
        completed: queue.filter(j => j.status === 'completed').length,
        failed: queue.filter(j => j.status === 'failed').length
      };
      
      Object.keys(stats.queues[type]).forEach(status => {
        stats.total[status] += stats.queues[type][status];
      });
    }

    return stats;
  }

  /**
   * Clear completed/failed jobs older than specified age
   */
  cleanup(maxAgeMs = 3600000) {
    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;

    for (const queue of this.queues.values()) {
      for (let i = queue.length - 1; i >= 0; i--) {
        const job = queue[i];
        if (
          ['completed', 'failed'].includes(job.status) &&
          new Date(job.completedAt || job.failedAt).getTime() < cutoff
        ) {
          queue.splice(i, 1);
          removed++;
        }
      }
    }

    return removed;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
const jobQueue = new JobQueue();

// Export singleton
module.exports = jobQueue;

// Also export class for testing
module.exports.JobQueue = JobQueue;
