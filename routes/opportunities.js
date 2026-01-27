const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getOpportunities,
  getFeatured,
  getOpportunityBySlug,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getMyOpportunities,
  getTypes
} = require('../controllers/opportunityController');

// Public routes
router.get('/', getOpportunities);
router.get('/featured', getFeatured);
router.get('/types', getTypes);
router.get('/:slug', getOpportunityBySlug);

// Protected routes
router.post('/', protect, createOpportunity);
router.get('/user/my-opportunities', protect, getMyOpportunities);
router.put('/:id', protect, updateOpportunity);
router.delete('/:id', protect, deleteOpportunity);

module.exports = router;
