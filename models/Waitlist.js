const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  source: {
    type: String,
    enum: ['homepage', 'pro-modal', 'navbar'],
    default: 'homepage'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate email errors from crashing the app
waitlistSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);
