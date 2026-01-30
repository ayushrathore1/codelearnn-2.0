const express = require('express');
const router = express.Router();
const Waitlist = require('../models/Waitlist');
const { sendWaitlistEmail } = require('../services/emailService');

const crypto = require('crypto');

// POST /api/waitlist - Add email to waitlist
router.post('/', async (req, res) => {
  try {
    const { email, source = 'homepage', refCode } = req.body;

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
        alreadyExists: true,
        data: { referralCode: existing.referralCode }
      });
    }

    // Handle referral
    let referredBy = null;
    if (refCode) {
      const referrer = await Waitlist.findOne({ referralCode: refCode });
      if (referrer) {
        referredBy = referrer._id;
        // Increment referral count
        referrer.referrals += 1;
        await referrer.save();
      }
    }

    // Generate unique referral code
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = crypto.randomBytes(4).toString('hex');
      const existingCode = await Waitlist.findOne({ referralCode });
      if (!existingCode) isUnique = true;
    }

    // Create new waitlist entry
    const entry = await Waitlist.create({ 
      email: email.toLowerCase(), 
      source,
      referralCode,
      referredBy
    });

    // Send welcome email (fire and forget)
    sendWaitlistEmail(email.toLowerCase(), referralCode).catch(err => console.error('Failed to send waitlist email:', err));
    
    // Notify admin (fire and forget)
    const { sendAdminNotification } = require('../services/emailService');
    sendAdminNotification(email.toLowerCase()).catch(err => console.error('Failed to send admin notification:', err));

    res.status(201).json({ 
      success: true, 
      message: 'Successfully added to the waitlist! We\'ll be in touch soon.',
      data: { id: entry._id, referralCode }
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
