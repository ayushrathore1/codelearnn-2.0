const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const cacheService = require('./services/CacheService');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize cache service (Redis via Upstash)
cacheService.initialize().then(connected => {
  if (connected) {
    console.log('🚀 Cache layer ready');
  }
});

const app = express();

// Check if production environment
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for accurate IP detection behind Nginx/Load Balancer (Hostinger)
if (isProduction) {
  app.set('trust proxy', 1);
}

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

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://codelearnn.com', 'https://www.codelearnn.com', 'http://localhost:5173', 'https://codelearnn.com/', 'https://www.codelearnn.com/', 'https://charcha.codelearnn.com/', 'https://www.charcha.codelearnn.com/', 'https://charcha.codelearnn.com', 'https://www.charcha.codelearnn.com', 'https://charcha.codelearnn.com/', 'https://www.charcha.codelearnn.com/'];

console.log('CORS Allowed Origins:', allowedOrigins);

// CORS configuration - must be before routes
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // In production, log blocked origins but still allow for debugging
    console.log('CORS request from origin:', origin);
    // Allow all origins during debugging - comment this line to enforce strict CORS
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ALSO add explicit headers as backup (some proxies strip cors package headers)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  next();
});

// Handle preflight OPTIONS requests explicitly for all routes
// Note: Express 5.x requires named wildcard parameters
app.options('/{*path}', cors(corsOptions));

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
const skillsRoutes = require('./routes/skills');
const eventsRoutes = require('./routes/events');
const journeyRoutes = require('./routes/journey');

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
app.use('/api/skills', skillsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/journey', journeyRoutes);

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

// Health check at root level for hosting providers (Hostinger)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
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
