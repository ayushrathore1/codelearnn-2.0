const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout,
  sendOTP,
  verifyOTP
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

// Google OAuth routes
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables.'
    });
  }
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  passport.authenticate('google', { session: false }, (err, user, info) => {
    // Handle authentication errors
    if (err) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
    
    // Handle whitelist rejection - user is false with info containing redirectToWaitlist
    if (!user && info?.redirectToWaitlist) {
      return res.redirect(`${frontendUrl}/?waitlist_redirect=true#waitlist`);
    }
    
    // Handle other auth failures
    if (!user) {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
    
    // Generate JWT token for the authenticated user
    const token = user.getSignedJwtToken();
    
    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  })(req, res, next);
});

module.exports = router;

