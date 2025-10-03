const mongoose = require('mongoose');
const Logger = require('../utils/logger');

const logger = new Logger('Database');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-platform';

let isConnected = false;

// Reduce Mongoose logging in production
if (process.env.NODE_ENV === 'production') {
  mongoose.set('debug', false);
}

async function connectDB() {
  if (isConnected) return mongoose.connection;
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000
    });
    isConnected = true;
    logger.info('MongoDB connected successfully');
    return mongoose.connection;
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message });
    throw err;
  }
}

module.exports = { connectDB };
