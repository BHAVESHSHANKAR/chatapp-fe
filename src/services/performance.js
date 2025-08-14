// Performance monitoring service for chat application
class PerformanceService {
  constructor() {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      connectionDrops: 0,
      averageLatency: 0,
      lastLatency: 0
    };
    this.latencyHistory = [];
    this.maxHistorySize = 100;
  }

  // Track message send time
  trackMessageSent() {
    this.metrics.messagesSent++;
    return Date.now(); // Return timestamp for latency calculation
  }

  // Track message received and calculate latency
  trackMessageReceived(sendTimestamp) {
    this.metrics.messagesReceived++;
    
    if (sendTimestamp) {
      const latency = Date.now() - sendTimestamp;
      this.metrics.lastLatency = latency;
      
      // Update latency history
      this.latencyHistory.push(latency);
      if (this.latencyHistory.length > this.maxHistorySize) {
        this.latencyHistory.shift();
      }
      
      // Calculate average latency
      this.metrics.averageLatency = 
        this.latencyHistory.reduce((sum, lat) => sum + lat, 0) / this.latencyHistory.length;
    }
  }

  // Track connection drops
  trackConnectionDrop() {
    this.metrics.connectionDrops++;
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      connectionQuality: this.getConnectionQuality()
    };
  }

  // Determine connection quality based on metrics
  getConnectionQuality() {
    if (this.metrics.averageLatency < 100) return 'EXCELLENT';
    if (this.metrics.averageLatency < 300) return 'GOOD';
    if (this.metrics.averageLatency < 1000) return 'FAIR';
    return 'POOR';
  }

  // Reset metrics
  reset() {
    this.metrics = {
      messagesSent: 0,
      messagesReceived: 0,
      connectionDrops: 0,
      averageLatency: 0,
      lastLatency: 0
    };
    this.latencyHistory = [];
  }

  // Log performance summary
  logSummary() {
    console.log('📊 Performance Summary:', this.getMetrics());
  }
}

// Create singleton instance
const performanceService = new PerformanceService();
export default performanceService;