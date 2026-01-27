const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Whitelist of allowed emails (admin access only during beta)
const ALLOWED_EMAILS = [
  'engineeratcodelearnn@gmail.com',
  'rathoreayush512@gmail.com'
];

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy - only initialize if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0]?.value?.toLowerCase();
        
        // Check if email is in whitelist
        if (!ALLOWED_EMAILS.includes(email)) {
          // Return error with special flag for frontend to handle
          return done(null, false, { 
            message: 'Access is currently invite-only. Join the waitlist!',
            redirectToWaitlist: true 
          });
        }
        
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
          return done(null, user);
        }
        
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.avatarUrl = profile.photos[0]?.value;
          await user.save();
          return done(null, user);
        }
        
        // Create new user
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatarUrl: profile.photos[0]?.value,
          password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
        });
        
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  ));
  console.log('✅ Google OAuth: Configured');
} else {
  console.log('⚠️ Google OAuth: Not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}

module.exports = passport;
