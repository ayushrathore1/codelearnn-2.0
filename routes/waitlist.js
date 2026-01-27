const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');

// POST /api/waitlist - Add email to waitlist
router.post('/', async (req, res) => {
  try {
    const { email, source = 'homepage' } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check if email already exists
    const existing = await Waitlist.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(200).json({ 
        success: true, 
        message: 'You\'re already on the waitlist! We\'ll notify you soon.',
        alreadyExists: true
      });
    }

    // Create new waitlist entry
    const entry = await Waitlist.create({ 
      email: email.toLowerCase(), 
      source 
    });

    res.status(201).json({ 
      success: true, 
      message: 'Successfully added to the waitlist! We\'ll be in touch soon.',
      data: { id: entry._id }
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(200).json({ 
        success: true, 
        message: 'You\'re already on the waitlist!',
        alreadyExists: true
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Failed to join waitlist. Please try again.' 
    });
  }
});

// GET /api/waitlist/count - Get waitlist count (admin only, no auth for now)
router.get('/count', async (req, res) => {
  try {
    const count = await Waitlist.countDocuments();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching count' });
  }
});

module.exports = router;
