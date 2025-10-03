/**
 * Production-ready logging utility
 * - Uses different log levels based on environment
 * - Reduces verbose logs in production
 * - Provides structured logging
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const isProduction = process.env.NODE_ENV === 'production';
const currentLevel = isProduction ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;

class Logger {
  constructor(module = 'APP') {
    this.module = module;
  }

  _log(level, message, meta = {}) {
    if (LOG_LEVELS[level] > currentLevel) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module: this.module,
      message,
      ...meta
    };

    // In production, use JSON format for log aggregation
    if (isProduction) {
      console.log(JSON.stringify(logEntry));
    } else {
      // Development: pretty print with emojis
      const emoji = {
        ERROR: '❌',
        WARN: '⚠️',
        INFO: 'ℹ️',
        DEBUG: '🔍'
      }[level] || '📝';
      
      console.log(`${emoji} [${this.module}] ${message}`, Object.keys(meta).length ? meta : '');
    }
  }

  error(message, meta) {
    this._log('ERROR', message, meta);
  }

  warn(message, meta) {
    this._log('WARN', message, meta);
  }

  info(message, meta) {
    this._log('INFO', message, meta);
  }

  debug(message, meta) {
    this._log('DEBUG', message, meta);
  }

  // Special startup logging (always shown)
  startup(message) {
    console.log(`🚀 ${message}`);
  }
}

module.exports = Logger;
