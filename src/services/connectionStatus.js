import { api } from './api';

class ConnectionStatusService {
  constructor() {
    this.listeners = new Set();
    this.status = {
      server: 'CHECKING',
      database: 'CHECKING',
      websocket: 'CHECKING',
      overall: 'CHECKING'
    };
    this.checkInterval = null;
  }

  startMonitoring(intervalMs = 30000) {
    // Initial check
    this.checkStatus();
    
    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.checkStatus();
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async checkStatus() {
    try {
      const response = await api.get('/status');
      const newStatus = {
        server: response.data.server || 'UNKNOWN',
        database: response.data.database?.status || 'UNKNOWN',
        websocket: response.data.websocket?.status || 'UNKNOWN',
        overall: response.data.overall || 'UNKNOWN',
        details: response.data
      };
      
      this.updateStatus(newStatus);
    } catch (error) {
      const errorStatus = {
        server: 'DISCONNECTED',
        database: 'DISCONNECTED',
        websocket: 'DISCONNECTED',
        overall: 'ERROR',
        error: error.message
      };
      
      this.updateStatus(errorStatus);
    }
  }

  updateStatus(newStatus) {
    const hasChanged = JSON.stringify(this.status) !== JSON.stringify(newStatus);
    this.status = newStatus;
    
    if (hasChanged) {
      this.notifyListeners(this.status);
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.status);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  getStatus() {
    return this.status;
  }

  isHealthy() {
    return this.status.overall === 'HEALTHY';
  }
}

// Create singleton instance
const connectionStatusService = new ConnectionStatusService();
export default connectionStatusService;