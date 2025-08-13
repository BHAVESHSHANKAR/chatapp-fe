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
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect(username, onConnected, onError) {
    // Create STOMP client
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_API_URL_WS),
      connectHeaders: {
        username: username
      },
      debug: (str) => {
        // Uncomment for debugging
        // console.log('STOMP: ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Set up event handlers
    this.stompClient.onConnect = (frame) => {
      console.log('✅ WebSocket Connected:', frame);
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe to user-specific message queue
      this.subscribeToUserMessages(username);
      
      // Update connection status
      connectionStatusService.checkStatus();
      
      if (onConnected) {
        onConnected(frame);
      }
    };

    this.stompClient.onStompError = (frame) => {
      console.error('❌ STOMP error:', frame);
      this.connected = false;
      connectionStatusService.checkStatus();
      
      if (onError) {
        onError(frame);
      }
    };

    this.stompClient.onWebSocketError = (error) => {
      console.error('❌ WebSocket error:', error);
      this.connected = false;
      connectionStatusService.checkStatus();
      
      if (onError) {
        onError(error);
      }
    };

    this.stompClient.onDisconnect = () => {
      console.log('🔌 Disconnected from WebSocket');
      this.connected = false;
      connectionStatusService.checkStatus();
    };

    // Activate the client
    this.stompClient.activate();
  }



  subscribeToUserMessages(username) {
    if (this.stompClient && this.connected) {
      console.log('📡 Subscribing to messages for user:', username);
      
      // Subscribe to private messages
      const messageSubscription = this.stompClient.subscribe(
        `/user/${username}/queue/messages`,
        (message) => {
          console.log('📨 Received message:', message.body);
          const chatMessage = JSON.parse(message.body);
          this.handleMessage('message', chatMessage);
        }
      );

      // Subscribe to typing indicators
      const typingSubscription = this.stompClient.subscribe(
        `/user/${username}/queue/typing`,
        (message) => {
          const typingMessage = JSON.parse(message.body);
          this.handleMessage('typing', typingMessage);
        }
      );

      // Subscribe to errors
      const errorSubscription = this.stompClient.subscribe(
        `/user/${username}/queue/errors`,
        (message) => {
          const errorMessage = JSON.parse(message.body);
          this.handleMessage('error', errorMessage);
        }
      );

      this.subscriptions.set('messages', messageSubscription);
      this.subscriptions.set('typing', typingSubscription);
      this.subscriptions.set('errors', errorSubscription);
    }
  }

  sendMessage(message) {
    if (this.stompClient && this.connected) {
      console.log('📤 Sending message:', message);
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(message)
      });
      return true;
    } else {
      console.error('❌ WebSocket not connected');
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
      this.messageHandlers.get(type).forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  disconnect() {
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

  isConnected() {
    return this.connected;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;