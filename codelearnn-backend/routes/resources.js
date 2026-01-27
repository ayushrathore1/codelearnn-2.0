const express = require('express');
const {
  getResources,
  getResource,
  getFeatured,
  getTopicsByDomain,
  getDomains,
  addResource,
  bulkAddResources,
  updateResource,
  deleteResource,
  getCategories
} = require('../controllers/resourceController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getResources);
router.get('/featured', getFeatured);
router.get('/domains', getDomains);
router.get('/topics/:domain', getTopicsByDomain);
router.get('/categories', getCategories);
router.get('/:id', getResource);

// Protected routes (Admin)
router.post('/', protect, addResource);
router.post('/bulk', protect, bulkAddResources);
router.put('/:id', protect, updateResource);
router.delete('/:id', protect, deleteResource);

module.exports = router;
