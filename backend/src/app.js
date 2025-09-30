require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB } = require('./config/db');
const app = express();

// Middleware
// Enhanced CORS configuration for mobile compatibility
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,https://avanceai.netlify.app';
const allowedOrigins = new Set(CORS_ORIGIN.split(',').map(s => s.trim()));

// Add Netlify domain explicitly for production
allowedOrigins.add('https://avanceai.netlify.app');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all Netlify preview deployments
    if (origin && origin.includes('netlify.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.has(origin)) return callback(null, true);
    
    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200, // For legacy browser support
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Cache-Control',
    'X-Mx-ReqToken',
    'Keep-Alive',
    'X-Csrf-Token'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Handle preflight requests for mobile browsers
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,User-Agent');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  res.sendStatus(200);
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add middleware to set security headers for mobile compatibility
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/market', require('./routes/marketData'));
app.use('/api/realtime', require('./routes/realtime'));
app.use('/api/watchlist', require('./routes/watchlist'));
app.use('/api/orders', require('./routes/orders'));

// Enhanced health check for Railway
app.get('/api/health', (req, res) => {
  const websocketService = require('./services/websocketService');
  
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    websocket: websocketService.isConnected || false,
    database: 'connected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI-Powered Trading Platform API',
    status: 'running',
    version: '1.0.0'
  });
});

// Test endpoint without auth
app.get('/api/test', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.json({ success: true, message: 'Backend is working', timestamp: new Date() });
});

// Error handling
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 === TRADING PLATFORM STARTUP ===');
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'}`);
      console.log(`📡 Dhan API Token: ${process.env.DHAN_ACCESS_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
      console.log(`💾 MongoDB URI: ${process.env.MONGODB_URI ? '✅ SET' : '❌ Using Default'}`);
      console.log(`💾 Database: ✅ MongoDB Connected`);
      console.log(`🚀 Server: ✅ Running on port ${PORT}`);

      if ((process.env.NODE_ENV === 'production') && !process.env.JWT_SECRET) {
        console.error('FATAL: JWT_SECRET is required in production.');
        process.exit(1);
      }

      try {
        const websocketService = require('./services/websocketService');
        const securityLookupService = require('./services/securityLookupService');
        
        websocketService.connect();
        console.log('⚡ WebSocket: ✅ Real-time data enabled');
        
        // Initialize security cache
        securityLookupService.initializeCache();
        console.log('🔍 Security Cache: ✅ Initializing...');
        
      } catch (error) {
        console.log('⚠️ WebSocket: ❌ Service not available');
        console.log('Error:', error.message);
      }
      
      console.log('=== STARTUP COMPLETE ===\n');
    });
  })
  .catch((err) => {
    console.error('❌ Database: Failed to connect');
    console.error('Error:', err.message);
    process.exit(1);
  });