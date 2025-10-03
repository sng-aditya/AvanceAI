require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const Logger = require('./utils/logger');

const { connectDB } = require('./config/db');
const app = express();
const logger = new Logger('APP');

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
// Use morgan only in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
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
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.startup('=== TRADING PLATFORM STARTUP ===');
      logger.startup(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.startup(`JWT Secret: ${process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET'}`);
      logger.startup(`Dhan API Token: ${process.env.DHAN_ACCESS_TOKEN ? '✅ SET' : '❌ NOT SET'}`);
      logger.startup(`MongoDB URI: ${process.env.MONGODB_URI ? '✅ SET' : '❌ Using Default'}`);
      logger.startup(`Database: ✅ MongoDB Connected`);
      logger.startup(`Server: ✅ Running on port ${PORT}`);

      if ((process.env.NODE_ENV === 'production') && !process.env.JWT_SECRET) {
        logger.error('FATAL: JWT_SECRET is required in production.');
        process.exit(1);
      }

      try {
        const websocketService = require('./services/websocketService');
        const securityLookupService = require('./services/securityLookupService');
        const sessionMonitor = require('./services/sessionMonitor');
        
        // Initialize security cache
        securityLookupService.initializeCache();
        logger.startup('Security Cache: ✅ Initializing...');
        
        // Initialize session monitor (will manage WebSocket lifecycle)
        sessionMonitor.initialize(websocketService);
        logger.startup('Session Monitor: ✅ Active');
        
      } catch (error) {
        logger.warn('WebSocket: ❌ Service not available', { error: error.message });
      }
      
      logger.startup('=== STARTUP COMPLETE ===\n');
    });

    // Graceful shutdown
    const shutdown = () => {
      logger.info('Shutting down gracefully...');
      const sessionMonitor = require('./services/sessionMonitor');
      sessionMonitor.shutdown();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  })
  .catch((err) => {
    logger.error('Database: Failed to connect', { error: err.message });
    process.exit(1);
  });