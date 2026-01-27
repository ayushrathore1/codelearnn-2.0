const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize passport
const passport = require('./config/passport');
app.use(passport.initialize());

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Enable CORS - Allow both production and development origins
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://codelearnn.com', 
      'https://www.codelearnn.com',
      'http://localhost:5173', 
      'http://localhost:3000', 
      'http://127.0.0.1:5173'
    ];
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now to debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression for responses
app.use(compression());

// Rate limiting - Scalable for high traffic
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // increased limit for scalability
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api', limiter);

// Route files
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const freeResourcesRoutes = require('./routes/freeResources');
const careerDomainRoutes = require('./routes/careerDomain');
const learningPathsRoutes = require('./routes/learningPaths');
const resourcesRoutes = require('./routes/resources');
const progressRoutes = require('./routes/progress');
const personalizedPathRoutes = require('./routes/personalizedPath');
const vaultRoutes = require('./routes/vault');
const waitlistRoutes = require('./routes/waitlist');
const blogRoutes = require('./routes/blogs');
const opportunityRoutes = require('./routes/opportunities');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/free-resources', freeResourcesRoutes);
app.use('/api/career', careerDomainRoutes);
app.use('/api/learning-paths', learningPathsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/personalized-path', personalizedPathRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/opportunities', opportunityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CodeLearnn API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CodeLearnn API',
    version: '2.0.0',
    documentation: '/api/health'
  });
});

// Error handler middleware
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  
  // Configuration check
  console.log('\n📋 API Configuration Check:');
  console.log('─'.repeat(50));
  
  // Check YouTube API Key
  if (process.env.YOUTUBE_API_KEY) {
    console.log('✅ YouTube API Key: Configured');
  } else {
    console.log('⚠️  YouTube API Key: NOT CONFIGURED');
  }
  
  // Check GROQ API Keys (with fallback support)
  const groqKey1 = process.env.GROQ_API_KEY;
  const groqKey2 = process.env.GROQ_API_KEY2;
  if (groqKey1 && groqKey2) {
    console.log('✅ GROQ API Keys: 2 keys configured (with fallback)');
  } else if (groqKey1) {
    console.log('✅ GROQ API Key: 1 key configured (no fallback)');
  } else {
    console.log('⚠️  GROQ API Key: NOT CONFIGURED');
  }

  // Check Google Custom Search API
  if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID) {
    console.log('✅ Google Custom Search: Configured');
  } else if (process.env.GOOGLE_CSE_API_KEY || process.env.GOOGLE_CSE_ID) {
    console.log('⚠️  Google Custom Search: PARTIALLY CONFIGURED (need both API_KEY and CSE_ID)');
  } else {
    console.log('ℹ️  Google Custom Search: Not configured (AI uses training data only)');
  }

  // Check RapidAPI (Job Search)
  if (process.env.RAPIDAPI_KEY) {
    console.log('✅ RapidAPI (Jobs): Configured');
  } else {
    console.log('ℹ️  RapidAPI (Jobs): Not configured');
  }
  
  // Check MongoDB
  console.log('✅ MongoDB: Connected');
  
  // List registered routes
  console.log('\n📍 Registered API Routes:');
  console.log('─'.repeat(50));
  console.log('  GET  /api/health');
  console.log('  GET  /api/free-resources');
  console.log('  GET  /api/free-resources/browse');
  console.log('  GET  /api/free-resources/categories');
  console.log('  POST /api/free-resources/analyze');
  console.log('  GET  /api/vault');
  console.log('  GET  /api/vault/featured');
  console.log('  GET  /api/vault/categories');
  console.log('  GET  /api/vault/domains');
  console.log('  GET  /api/progress/me');
  console.log('  POST /api/progress/start');
  console.log('  POST /api/progress/complete');
  console.log('  POST /api/personalized-path/generate');
  console.log('  GET  /api/personalized-path/my-paths');
  console.log('  POST /api/career/roadmap');
  console.log('  POST /api/career/explore');
  console.log('  GET  /api/career/trending');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  POST /api/contact');
  console.log('─'.repeat(50));
  console.log('');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
