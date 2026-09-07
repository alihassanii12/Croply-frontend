/**
 * Keep-Alive Service for Model API
 * Prevents Render free tier from sleeping
 */

const MODEL_API_URL = 'https://croply-model-training.onrender.com';
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
const HEALTH_ENDPOINT = '/health';

class KeepAliveService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start pinging the model API to keep it awake
   */
  start() {
    if (this.isRunning) return;

    console.log('🔄 Starting keep-alive service for model API...');
    
    // Ping immediately
    this.pingServer();
    
    // Then ping every 10 minutes
    this.intervalId = setInterval(() => {
      this.pingServer();
    }, PING_INTERVAL);
    
    this.isRunning = true;
  }

  /**
   * Stop the keep-alive service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Keep-alive service stopped');
  }

  /**
   * Ping the model server to keep it awake
   */
  private async pingServer() {
    try {
      const response = await fetch(`${MODEL_API_URL}${HEALTH_ENDPOINT}`, {
        method: 'GET',
        // Set a timeout to avoid hanging
        signal: AbortSignal.timeout(30000), // 30 seconds
      });

      if (response.ok) {
        console.log('✅ Keep-alive ping successful - server is awake');
      } else {
        console.warn(`⚠️ Keep-alive ping failed - Status: ${response.status}`);
      }
    } catch (error) {
      // Don't spam console with errors - server might be starting up
      console.log('⏳ Keep-alive ping failed - server might be starting...');
    }
  }

  /**
   * Check if the service is running
   */
  isActive() {
    return this.isRunning;
  }
}

// Create singleton instance
export const keepAliveService = new KeepAliveService();

// Auto-start in browser environment
if (typeof window !== 'undefined') {
  // Start after page load
  window.addEventListener('load', () => {
    keepAliveService.start();
  });

  // Stop when page unloads
  window.addEventListener('beforeunload', () => {
    keepAliveService.stop();
  });
}

export default keepAliveService;