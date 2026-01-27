const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // TTL: Auto-delete after 10 minutes (600 seconds)
  }
});

// Compound index for efficient lookups (email already indexed by field definition)
otpSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Otp', otpSchema);
