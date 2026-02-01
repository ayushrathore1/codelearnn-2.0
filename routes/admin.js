const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const jobQueue = require('../services/JobQueue');
const caches = require('../services/CacheService');

/**
 * Admin routes for system monitoring and management
 * These endpoints should be protected with additional admin checks in production
 */

/**
 * @route   GET /api/admin/stats
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get('/stats', protect, async (req, res) => {
  try {
    // In production, add admin role check here
    // if (!req.user.isAdmin) return res.status(403).json({ success: false });

    const stats = {
      jobQueue: jobQueue.getStats(),
      cache: {
        videoAnalysis: caches.videoAnalysis.getStats(),
        readiness: caches.readiness.getStats(),
        careerData: caches.careerData.getStats(),
        general: caches.general.getStats()
      },
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

/**
 * @route   POST /api/admin/cache/clear
 * @desc    Clear a specific cache or all caches
 * @access  Private (Admin)
 */
router.post('/cache/clear', protect, async (req, res) => {
  try {
    const { namespace } = req.body;

    if (namespace && caches[namespace]) {
      caches[namespace].clear();
      res.json({
        success: true,
        message: `${namespace} cache cleared`
      });
    } else if (!namespace) {
      // Clear all caches
      Object.values(caches).forEach(cache => {
        if (typeof cache.clear === 'function') {
          cache.clear();
        }
      });
      res.json({
        success: true,
        message: 'All caches cleared'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid cache namespace'
      });
    }
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

/**
 * @route   POST /api/admin/jobs/cleanup
 * @desc    Cleanup completed/failed jobs
 * @access  Private (Admin)
 */
router.post('/jobs/cleanup', protect, async (req, res) => {
  try {
    const { maxAgeHours = 1 } = req.body;
    const removed = jobQueue.cleanup(maxAgeHours * 3600000);

    res.json({
      success: true,
      message: `Removed ${removed} old jobs`
    });
  } catch (error) {
    console.error('Job cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup jobs'
    });
  }
});

/**
 * @route   GET /api/admin/health
 * @desc    Detailed health check
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        jobQueue: {
          status: 'running',
          pending: jobQueue.getStats().total.pending
        },
        cache: {
          status: 'running',
          totalSize: Object.values(caches).reduce((sum, c) => 
            sum + (c.getStats?.()?.size || 0), 0
          )
        }
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message
      }
    });
  }
});

module.exports = router;
