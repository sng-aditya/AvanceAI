require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB } = require('./config/db');
const app = express();

// Middleware
// Configurable CORS origin(s)
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174';
const allowedOrigins = new Set(CORS_ORIGIN.split(',').map(s => s.trim()));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // allow server-to-server / curl
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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