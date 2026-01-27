const User = require('../models/User');
const Otp = require('../models/Otp');
const asyncHandler = require('../middleware/async');
const { sendOTPEmail, generateOTP } = require('../services/emailService');

// Whitelist of allowed emails (admin access only during beta)
const ALLOWED_EMAILS = [
  'engineeratcodelearnn@gmail.com',
  'rathoreayush512@gmail.com'
];

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (restricted to whitelist)
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, subscribedNewsletter } = req.body;

  // Check if email is in whitelist
  if (!ALLOWED_EMAILS.includes(email?.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Registration is currently invite-only. Join the waitlist to get notified when we launch!',
      redirectToWaitlist: true
    });
  }

  // Check if user exists with this email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Check if user signed up via OAuth
    if (existingUser.googleId) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in with Google.',
        authMethod: 'google'
      });
    }
    if (existingUser.githubId) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in with GitHub.',
        authMethod: 'github'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    subscribedNewsletter: subscribedNewsletter || false
  });

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public (restricted to whitelist)
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email and password'
    });
  }

  // Check if email is in whitelist
  if (!ALLOWED_EMAILS.includes(email?.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Access is currently invite-only. Join the waitlist to get notified when we launch!',
      redirectToWaitlist: true
    });
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user only has OAuth authentication (no password set with email/password)
  if (user.googleId && !user.password) {
    return res.status(400).json({
      success: false,
      message: 'This account was created with Google. Please sign in with Google.',
      authMethod: 'google'
    });
  }
  if (user.githubId && !user.password) {
    return res.status(400).json({
      success: false,
      message: 'This account was created with GitHub. Please sign in with GitHub.',
      authMethod: 'github'
    });
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    avatarIndex: req.body.avatarIndex,
    subscribedNewsletter: req.body.subscribedNewsletter
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(
    key => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
  );

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return res.status(401).json({
      success: false,
      message: 'Password is incorrect'
    });
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Send OTP for email login
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOTP = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email'
    });
  }

  // Check if email is in whitelist
  if (!ALLOWED_EMAILS.includes(email?.toLowerCase())) {
    return res.status(403).json({
      success: false,
      message: 'Access is currently invite-only. Join the waitlist to get notified when we launch!',
      redirectToWaitlist: true
    });
  }

  // Check if user exists
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email'
    });
  }

  // Rate limiting: Check if OTP was sent in last 60 seconds
  const recentOtp = await Otp.findOne({
    email: email.toLowerCase(),
    createdAt: { $gt: new Date(Date.now() - 60000) } // Within last 60 seconds
  });

  if (recentOtp) {
    const waitTime = Math.ceil((60000 - (Date.now() - recentOtp.createdAt.getTime())) / 1000);
    return res.status(429).json({
      success: false,
      message: `Please wait ${waitTime} seconds before requesting another OTP`,
      waitTime
    });
  }

  // Delete any existing OTPs for this email
  await Otp.deleteMany({ email: email.toLowerCase() });

  // Generate new OTP
  const otp = generateOTP();

  // Store OTP in database
  await Otp.create({
    email: email.toLowerCase(),
    otp
  });

  // Send OTP email
  try {
    await sendOTPEmail(email, otp);
    
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: email.toLowerCase()
    });
  } catch (error) {
    // Delete OTP if email fails
    await Otp.deleteMany({ email: email.toLowerCase() });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email. Please try again.'
    });
  }
});

// @desc    Verify OTP and login
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and verification code'
    });
  }

  // Find OTP record
  const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: 'Verification code expired. Please request a new one.'
    });
  }

  // Check max attempts (5 attempts allowed)
  if (otpRecord.attempts >= 5) {
    await Otp.deleteMany({ email: email.toLowerCase() });
    return res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Please request a new verification code.'
    });
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    // Increment attempts
    otpRecord.attempts += 1;
    await otpRecord.save();
    
    return res.status(400).json({
      success: false,
      message: 'Invalid verification code',
      attemptsRemaining: 5 - otpRecord.attempts
    });
  }

  // OTP is valid - delete it
  await Otp.deleteMany({ email: email.toLowerCase() });

  // Get user and generate token
  const user = await User.findOne({ email: email.toLowerCase() });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
    message: 'Logged out successfully'
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatarIndex: user.avatarIndex,
      subscribedNewsletter: user.subscribedNewsletter
    }
  });
};
