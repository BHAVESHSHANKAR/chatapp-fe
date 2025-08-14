// User activity tracking service
class UserActivityService {
  constructor() {
    this.userStatuses = new Map();
    this.listeners = new Map();
    this.heartbeatInterval = null;
    this.updateInterval = 30000; // Update every 30 seconds
  }

  // Initialize activity tracking
  initialize() {
    this.startHeartbeat();
    this.setupVisibilityHandlers();
  }

  // Start heartbeat to track user activity
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.updateUserStatuses();
    }, this.updateInterval);
  }

  // Setup page visibility handlers
  setupVisibilityHandlers() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.setUserAway();
      } else {
        this.setUserOnline();
      }
    });

    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        this.setUserOnline();
      }, { passive: true });
    });
  }

  // Set user as online
  setUserOnline() {
    const now = new Date();
    this.updateUserStatus('online', now);
  }

  // Set user as away (treat as offline for simplicity)
  setUserAway() {
    const now = new Date();
    this.updateUserStatus('offline', now);
  }

  // Update user status
  updateUserStatus(status, lastSeen) {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.userStatuses.set(currentUser.id, {
        status,
        lastSeen,
        username: currentUser.username
      });
      
      this.notifyListeners(currentUser.id, { status, lastSeen });
    }
  }

  // Get current user from localStorage
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  // Simulate getting user status (in real app, this would be from backend)
  getUserStatus(userId) {
    // Check if we have cached status
    if (this.userStatuses.has(userId)) {
      return this.userStatuses.get(userId);
    }

    // Most users should be offline by default (more realistic)
    const statuses = ['offline', 'offline', 'offline', 'offline', 'online']; // 80% offline, 20% online
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Generate realistic last seen times
    const randomLastSeen = randomStatus === 'online' ? new Date() : new Date(Date.now() - Math.random() * 86400000);

    const status = {
      status: randomStatus,
      lastSeen: randomLastSeen
    };

    this.userStatuses.set(userId, status);
    return status;
  }

  // Update all user statuses (simulate backend sync)
  updateUserStatuses() {
    // In a real app, this would fetch from backend
    // For demo, we'll simulate some status changes (rare)
    this.userStatuses.forEach((status, userId) => {
      if (Math.random() > 0.97) { // 3% chance of status change (very rare)
        // Simple online/offline toggle
        const newStatus = status.status === 'online' ? 'offline' : 'online';
        const newLastSeen = newStatus === 'online' ? new Date() : status.lastSeen;
        
        this.userStatuses.set(userId, {
          ...status,
          status: newStatus,
          lastSeen: newLastSeen
        });
        
        this.notifyListeners(userId, { status: newStatus, lastSeen: newLastSeen });
      }
    });
  }

  // Add listener for user status changes
  addStatusListener(userId, callback) {
    if (!this.listeners.has(userId)) {
      this.listeners.set(userId, []);
    }
    this.listeners.get(userId).push(callback);
  }

  // Remove status listener
  removeStatusListener(userId, callback) {
    if (this.listeners.has(userId)) {
      const callbacks = this.listeners.get(userId);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify listeners of status changes
  notifyListeners(userId, statusData) {
    if (this.listeners.has(userId)) {
      this.listeners.get(userId).forEach(callback => {
        try {
          callback(statusData);
        } catch (error) {
          console.error('Error in status listener:', error);
        }
      });
    }
  }

  // Get activity text for display - simplified to just online/offline
  getActivityText(status, lastSeen) {
    return status === 'online' ? 'online' : 'offline';
  }

  // Cleanup
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.listeners.clear();
    this.userStatuses.clear();
  }
}

// Create singleton instance
const userActivityService = new UserActivityService();
export default userActivityService;