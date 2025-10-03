/**
 * Heartbeat Service for Frontend
 * Keeps user session alive by pinging the backend periodically
 * 
 * Usage:
 * import heartbeatService from './services/heartbeat';
 * 
 * // Start when user logs in
 * heartbeatService.start();
 * 
 * // Stop when user logs out
 * heartbeatService.stop();
 */

class HeartbeatService {
  constructor() {
    this.interval = null;
    this.heartbeatFrequency = 5 * 60 * 1000; // 5 minutes
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.isRunning = false;
    
    // Bind methods
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  /**
   * Start sending heartbeats
   */
  start() {
    if (this.isRunning) {
      console.log('Heartbeat service already running');
      return;
    }

    console.log('Starting heartbeat service...');
    this.isRunning = true;

    // Send initial heartbeat
    this.sendHeartbeat();

    // Set up periodic heartbeat
    this.interval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatFrequency);

    // Listen for tab visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    console.log(`Heartbeat service started (${this.heartbeatFrequency / 1000}s interval)`);
  }

  /**
   * Stop sending heartbeats
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping heartbeat service...');
    this.isRunning = false;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    console.log('Heartbeat service stopped');
  }

  /**
   * Send heartbeat to backend
   */
  async sendHeartbeat() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No token found, stopping heartbeat');
        this.stop();
        return;
      }

      const response = await fetch(`${this.apiUrl}/api/auth/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Heartbeat sent successfully', {
          expiresAt: data.expiresAt,
          lastActivity: data.lastActivity
        });
      } else if (response.status === 401) {
        console.warn('Heartbeat failed: Session expired or invalid');
        this.stop();
        
        // Notify the app that session expired
        window.dispatchEvent(new CustomEvent('sessionExpired', {
          detail: { reason: 'Session expired or invalid' }
        }));
      } else {
        console.error('Heartbeat failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
      // Don't stop on network errors - might be temporary
    }
  }

  /**
   * Handle tab visibility changes
   */
  handleVisibilityChange() {
    if (!document.hidden && this.isRunning) {
      // Tab became visible, send heartbeat immediately
      console.log('Tab became visible, sending heartbeat');
      this.sendHeartbeat();
    }
  }

  /**
   * Check if service is running
   */
  isActive() {
    return this.isRunning;
  }

  /**
   * Update heartbeat frequency (in milliseconds)
   */
  setFrequency(milliseconds) {
    this.heartbeatFrequency = milliseconds;
    
    if (this.isRunning) {
      // Restart with new frequency
      this.stop();
      this.start();
    }
  }
}

// Export singleton instance
const heartbeatService = new HeartbeatService();
export default heartbeatService;
