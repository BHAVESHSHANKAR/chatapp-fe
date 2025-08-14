import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import connectionStatusService from './connectionStatus';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.connected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;  // More reconnect attempts
    this.reconnectDelay = 1000;
    this.healthCheckInterval = null;
    this.username = null;
  }

  connect(username, onConnected, onError) {
    this.username = username;

    // Create STOMP client with mobile-optimized settings
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_API_URL_WS, null, {
        timeout: 15000, // Longer timeout for mobile networks
        info: {
          websocket: true,
          cookie_needed: false
        }
      }),
      connectHeaders: {
        username: username
      },
      debug: () => {
        // Disabled for cleaner console
      },
      reconnectDelay: 2000,  // Slightly longer for mobile stability
      heartbeatIncoming: 10000,   // Longer heartbeat for mobile networks
      heartbeatOutgoing: 10000,
      connectionTimeout: 10000,   // Longer timeout for mobile
      maxWebSocketChunkSize: 8 * 1024,  // Smaller chunks for mobile compatibility
    });

    // Set up event handlers
    this.stompClient.onConnect = (frame) => {
      this.connected = true;
      this.reconnectAttempts = 0;

      // Subscribe to user-specific message queue immediately
      this.subscribeToUserMessages(username);

      // Start health check for real-time reliability
      this.startHealthCheck();

      // Update connection status
      connectionStatusService.checkStatus();

      if (onConnected) {
        onConnected(frame);
      }
    };

    this.stompClient.onStompError = (frame) => {
      this.connected = false;
      connectionStatusService.checkStatus();

      if (onError) {
        onError(frame);
      }
    };

    this.stompClient.onWebSocketError = (error) => {
      this.connected = false;
      connectionStatusService.checkStatus();

      if (onError) {
        onError(error);
      }
    };

    this.stompClient.onDisconnect = () => {
      this.connected = false;
      this.stopHealthCheck();
      connectionStatusService.checkStatus();

      // Auto-reconnect for real-time reliability
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect(this.username, null, null);
        }, this.reconnectDelay);
      }
    };

    // Activate the client
    this.stompClient.activate();
  }



  subscribeToUserMessages(username) {
    if (this.stompClient && this.connected) {
      // Subscribe to private messages with real-time optimized handling
      const messageSubscription = this.stompClient.subscribe(
        `/user/${username}/queue/messages`,
        (message) => {
          try {
            const chatMessage = JSON.parse(message.body);
            // Process message immediately for real-time feel
            this.handleMessage('message', chatMessage);

            // Acknowledge message receipt for reliability
            if (message.ack) {
              message.ack();
            }
          } catch (error) {
            console.error('Error processing message:', error);
          }
        }
      );

      // Subscribe to message updates (for database sync)
      const updateSubscription = this.stompClient.subscribe(
        `/user/${username}/queue/message-update`,
        (message) => {
          try {
            const chatMessage = JSON.parse(message.body);
            this.handleMessage('message-update', chatMessage);
          } catch (error) {
            // Silent error handling
          }
        }
      );

      // Subscribe to typing indicators
      const typingSubscription = this.stompClient.subscribe(
        `/user/${username}/queue/typing`,
        (message) => {
          try {
            const typingMessage = JSON.parse(message.body);
            this.handleMessage('typing', typingMessage);
          } catch (error) {
            // Silent error handling
          }
        }
      );

      // Subscribe to errors
      const errorSubscription = this.stompClient.subscribe(
        `/user/${username}/queue/errors`,
        (message) => {
          try {
            const errorMessage = JSON.parse(message.body);
            this.handleMessage('error', errorMessage);
          } catch (error) {
            // Silent error handling
          }
        }
      );

      this.subscriptions.set('messages', messageSubscription);
      this.subscriptions.set('message-updates', updateSubscription);
      this.subscriptions.set('typing', typingSubscription);
      this.subscriptions.set('errors', errorSubscription);
    }
  }

  sendMessage(message) {
    if (this.stompClient && this.connected) {
      try {
        // Validate message before sending
        if (!message || !message.content || !message.content.trim()) {
          console.error('Cannot send empty message');
          return false;
        }

        if (!message.senderUsername || !message.receiverUsername) {
          console.error('Missing sender or receiver username');
          return false;
        }

        // Add timestamp for immediate processing
        message.timestamp = new Date().toISOString();

        this.stompClient.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(message),
          headers: {
            'content-type': 'application/json',
            'priority': '9'  // High priority for real-time messaging
          }
        });

        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        return false;
      }
    } else {
      console.error('WebSocket not connected');
      return false;
    }
  }

  sendTypingIndicator(senderUsername, receiverUsername, isTyping) {
    if (this.stompClient && this.connected) {
      const typingMessage = {
        senderUsername,
        receiverUsername,
        type: isTyping ? 'TYPING' : 'STOP_TYPING',
        timestamp: new Date().toISOString()
      };

      this.stompClient.publish({
        destination: '/app/chat.typing',
        body: JSON.stringify(typingMessage)
      });
    }
  }

  addMessageHandler(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type).push(handler);
  }

  removeMessageHandler(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  handleMessage(type, message) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type);
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  disconnect() {
    this.stopHealthCheck();

    if (this.stompClient) {
      // Unsubscribe from all subscriptions
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();

      // Deactivate the client
      this.stompClient.deactivate();

      this.connected = false;
      this.stompClient = null;
    }
  }

  startHealthCheck() {
    // Check connection health every 10 seconds for real-time reliability
    this.healthCheckInterval = setInterval(() => {
      if (this.stompClient && this.connected) {
        try {
          // Send a ping to keep connection alive
          this.stompClient.publish({
            destination: '/app/ping',
            body: JSON.stringify({ type: 'ping', timestamp: Date.now() })
          });
        } catch (error) {
          // Silent health check failure
        }
      }
    }, 10000);
  }

  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  isConnected() {
    return this.connected && this.stompClient && this.stompClient.connected;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;