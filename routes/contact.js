const express = require('express');
const {
  submitContact,
  getContacts,
  markAsRead
} = require('../controllers/contactController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/', submitContact);

// Protected routes (Admin only - for now just protected)
router.get('/', protect, getContacts);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
