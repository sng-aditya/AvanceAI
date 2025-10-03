/**
 * Session Monitor Service
 * - Tracks active user sessions
 * - Manages WebSocket lifecycle based on active sessions
 * - Cleans up expired sessions
 */

const { Session } = require('../models');
const Logger = require('../utils/logger');

const logger = new Logger('SessionMonitor');

class SessionMonitor {
  constructor() {
    this.checkInterval = 30000; // 30 seconds
    this.cleanupInterval = 300000; // 5 minutes
    this.inactivityCheckInterval = 120000; // 2 minutes
    this.inactivityTimeout = 30 * 60 * 1000; // 30 minutes
    this.intervalId = null;
    this.cleanupIntervalId = null;
    this.inactivityIntervalId = null;
    this.activeSessionCount = 0;
    this.websocketService = null;
    this.isWebSocketActive = false;
  }

  /**
   * Initialize the session monitor
   */
  async initialize(websocketService) {
    this.websocketService = websocketService;
    
    // Check for active sessions immediately
    await this.checkActiveSessions();
    
    // Start monitoring intervals
    this.startMonitoring();
    
    logger.info('Session monitor initialized');
  }

  /**
   * Start monitoring intervals
   */
  startMonitoring() {
    // Check active sessions regularly
    this.intervalId = setInterval(() => {
      this.checkActiveSessions();
    }, this.checkInterval);

    // Cleanup expired sessions
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupInterval);

    // Check for inactive sessions
    this.inactivityIntervalId = setInterval(() => {
      this.checkInactiveSessions();
    }, this.inactivityCheckInterval);
  }

  /**
   * Check for active sessions and manage WebSocket accordingly
   */
  async checkActiveSessions() {
    try {
      const count = await Session.countDocuments({
        revoked: false,
        expiresAt: { $gt: new Date() }
      });

      const previousCount = this.activeSessionCount;
      this.activeSessionCount = count;

      // Log only on changes in development, or periodically in production
      if (previousCount !== count) {
        logger.debug(`Active sessions: ${count}`);
      }

      // Manage WebSocket based on active sessions
      if (count > 0 && !this.isWebSocketActive) {
        this.startWebSocket();
      } else if (count === 0 && this.isWebSocketActive) {
        this.stopWebSocket();
      }
    } catch (error) {
      logger.error('Failed to check active sessions', { error: error.message });
    }
  }

  /**
   * Start WebSocket connection
   */
  startWebSocket() {
    if (!this.websocketService || this.isWebSocketActive) return;

    try {
      logger.info('Starting WebSocket - users are active');
      this.websocketService.connect();
      this.isWebSocketActive = true;
    } catch (error) {
      logger.error('Failed to start WebSocket', { error: error.message });
    }
  }

  /**
   * Stop WebSocket connection gracefully
   */
  stopWebSocket() {
    if (!this.websocketService || !this.isWebSocketActive) return;

    try {
      logger.info('Stopping WebSocket - no active users');
      this.websocketService.disconnect();
      this.isWebSocketActive = false;
    } catch (error) {
      logger.error('Failed to stop WebSocket', { error: error.message });
    }
  }

  /**
   * Check for inactive sessions and auto-revoke them
   */
  async checkInactiveSessions() {
    try {
      const inactiveThreshold = new Date(Date.now() - this.inactivityTimeout);

      const result = await Session.updateMany(
        {
          revoked: false,
          lastActivity: { $lt: inactiveThreshold }
        },
        {
          $set: { 
            revoked: true,
            revokedReason: 'inactivity'
          }
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Auto-revoked ${result.modifiedCount} inactive sessions`);
        // Re-check active sessions immediately after revoking
        await this.checkActiveSessions();
      }
    } catch (error) {
      logger.error('Failed to check inactive sessions', { error: error.message });
    }
  }

  /**
   * Clean up expired and revoked sessions from database
   */
  async cleanupExpiredSessions() {
    try {
      const result = await Session.deleteMany({
        $or: [
          { revoked: true, createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Revoked > 30 days
          { expiresAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Expired > 7 days
        ]
      });

      if (result.deletedCount > 0) {
        logger.debug(`Cleaned up ${result.deletedCount} old sessions`);
      }
    } catch (error) {
      logger.error('Failed to cleanup sessions', { error: error.message });
    }
  }

  /**
   * Get current active session count
   */
  getActiveSessionCount() {
    return this.activeSessionCount;
  }

  /**
   * Shutdown the monitor gracefully
   */
  shutdown() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    if (this.inactivityIntervalId) {
      clearInterval(this.inactivityIntervalId);
      this.inactivityIntervalId = null;
    }
    
    if (this.isWebSocketActive) {
      this.stopWebSocket();
    }
    
    logger.info('Session monitor shut down');
  }
}

module.exports = new SessionMonitor();
