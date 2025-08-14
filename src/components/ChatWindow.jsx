import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../services/api';
import webSocketService from '../services/websocket';
import connectionStatusService from '../services/connectionStatus';
import userActivityService from '../services/userActivity';
import ProfileImage from './ProfileImage';
import TypingIndicator from './TypingIndicator';
import { getRelativeTime, getActivityStatus, formatMessageTime } from '../utils/timeUtils';

const ChatWindow = ({ currentUser, selectedFriend, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [friendTyping, setFriendTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('HEALTHY'); // Start optimistic
  const [userStatus, setUserStatus] = useState({ status: 'offline', lastSeen: null });

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);
  const activityUpdateRef = useRef(null);

  useEffect(() => {
    if (selectedFriend && currentUser) {
      // Clear previous messages and load fresh
      setMessages([]);
      setSending(false);
      setFriendTyping(false);
      setIsTyping(false);
      
      loadMessages();
      markMessagesAsRead();
      
      // Get user activity status
      const status = userActivityService.getUserStatus(selectedFriend.id);
      setUserStatus(status);
      
      // Focus input field when chat opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }

    // Monitor connection status
    const handleStatusChange = (status) => {
      // Use WebSocket connection status if available, otherwise use overall status
      const wsConnected = webSocketService.isConnected();
      setConnectionStatus(wsConnected ? 'HEALTHY' : (status.overall || 'CHECKING'));
    };

    connectionStatusService.addListener(handleStatusChange);
    
    // Also check WebSocket status directly
    const checkWebSocketStatus = () => {
      const wsConnected = webSocketService.isConnected();
      setConnectionStatus(wsConnected ? 'HEALTHY' : 'CHECKING');
    };
    
    // Check WebSocket status periodically
    const wsCheckInterval = setInterval(checkWebSocketStatus, 5000);
    
    return () => {
      connectionStatusService.removeListener(handleStatusChange);
      clearInterval(wsCheckInterval);
      
      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (activityUpdateRef.current) {
        clearInterval(activityUpdateRef.current);
      }
    };
  }, [selectedFriend, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, friendTyping]);

  // Listen for user activity status changes
  useEffect(() => {
    if (selectedFriend) {
      const handleStatusChange = (statusData) => {
        setUserStatus(statusData);
      };

      userActivityService.addStatusListener(selectedFriend.id, handleStatusChange);

      return () => {
        userActivityService.removeStatusListener(selectedFriend.id, handleStatusChange);
      };
    }
  }, [selectedFriend]);

  useEffect(() => {
    // Set up WebSocket message handlers with optimized processing
    const handleNewMessage = (message) => {
      // Only process messages between current user and selected friend
      if (
        (message.senderId === currentUser.id && message.receiverId === selectedFriend.id) ||
        (message.senderId === selectedFriend.id && message.receiverId === currentUser.id)
      ) {
        setMessages(prev => {
          // Check if message already exists to prevent duplicates
          const existingIndex = prev.findIndex(m => 
            (m.id && m.id === message.id) || 
            (m.tempId && m.content === message.content && m.senderId === message.senderId)
          );
          
          if (existingIndex !== -1) {
            // Update existing message (replace optimistic with real)
            const updatedMessages = [...prev];
            updatedMessages[existingIndex] = {
              ...message,
              timestamp: new Date(message.timestamp),
              pending: false
            };
            setSending(false);
            return updatedMessages;
          } else {
            // Add new message
            return [...prev, { 
              ...message, 
              timestamp: new Date(message.timestamp),
              pending: false 
            }];
          }
        });
        
        // Mark as read if message is from friend (debounced)
        if (message.senderId === selectedFriend.id) {
          setTimeout(() => {
            chatService.markAsRead(selectedFriend.id, currentUser.id).catch(console.error);
          }, 100);
        }
      }
    };

    const handleMessageUpdate = (message) => {
      // Handle database sync updates
      setMessages(prev => {
        const existingIndex = prev.findIndex(m => 
          m.tempId && m.content === message.content && m.senderId === message.senderId
        );
        
        if (existingIndex !== -1) {
          const updatedMessages = [...prev];
          updatedMessages[existingIndex] = {
            ...message,
            timestamp: new Date(message.timestamp),
            pending: false
          };
          return updatedMessages;
        }
        return prev;
      });
    };

    const handleTyping = (typingMessage) => {
      if (typingMessage.senderUsername === selectedFriend.username) {
        const isTypingNow = typingMessage.type === 'TYPING';
        setFriendTyping(isTypingNow);
        
        // Update online status when user is typing
        if (isTypingNow) {
          setUserStatus({ status: 'online', lastSeen: new Date() });
        }
        
        // Clear typing indicator after 3 seconds of inactivity
        if (isTypingNow) {
          setTimeout(() => setFriendTyping(false), 3000);
        }
      }
    };

    const handleError = (errorMessage) => {
      // Silent error handling - could show toast notification here
    };

    webSocketService.addMessageHandler('message', handleNewMessage);
    webSocketService.addMessageHandler('message-update', handleMessageUpdate);
    webSocketService.addMessageHandler('typing', handleTyping);
    webSocketService.addMessageHandler('error', handleError);

    return () => {
      webSocketService.removeMessageHandler('message', handleNewMessage);
      webSocketService.removeMessageHandler('message-update', handleMessageUpdate);
      webSocketService.removeMessageHandler('typing', handleTyping);
      webSocketService.removeMessageHandler('error', handleError);
    };
  }, [currentUser, selectedFriend]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      if (!currentUser?.id || !selectedFriend?.id) {
        return;
      }
      
      const response = await chatService.getMessages(currentUser.id, selectedFriend.id);
      // Process messages and ensure proper timestamp handling
      const processedMessages = response.data.reverse().map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        pending: false
      }));
      setMessages(processedMessages);
    } catch (error) {
      // Silent error handling
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      if (!currentUser?.id || !selectedFriend?.id) {
        return;
      }
      
      await chatService.markAsRead(selectedFriend.id, currentUser.id);
    } catch (error) {
      // Silent error handling
    }
  };

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !currentUser || !selectedFriend) return;

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    // Create optimistic message for instant UI update
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      senderUsername: currentUser.username,
      receiverUsername: selectedFriend.username,
      senderId: currentUser.id,
      receiverId: selectedFriend.id,
      messageType: 'TEXT',
      timestamp: new Date(),
      isRead: false,
      pending: true,
      tempId: tempId
    };

    // Add optimistic message immediately for instant feedback
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setSending(true);

    try {
      if (webSocketService.isConnected()) {
        const message = {
          content: messageContent,
          senderUsername: currentUser.username,
          receiverUsername: selectedFriend.username,
          senderId: currentUser.id,
          receiverId: selectedFriend.id,
          messageType: 'TEXT',
          type: 'CHAT',
          tempId: tempId
        };

        const success = webSocketService.sendMessage(message);
        
        if (success) {
          // Set shorter timeout for better UX
          setTimeout(() => {
            setMessages(prev => prev.map(msg => 
              msg.tempId === tempId ? { ...msg, pending: false } : msg
            ));
            setSending(false);
          }, 1000);
        } else {
          throw new Error('Failed to send via WebSocket');
        }
        
      } else {
        throw new Error('WebSocket not connected');
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      setSending(false);
      
      // Show user-friendly error
      const errorMsg = connectionStatus === 'HEALTHY' ? 
        'Failed to send message. Please try again.' : 
        'Connection lost. Please wait for reconnection.';
      alert(errorMsg);
    }
    
    // Stop typing indicator
    if (isTyping) {
      webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, false);
      setIsTyping(false);
    }
  }, [newMessage, sending, currentUser, selectedFriend, connectionStatus, isTyping]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === 'Escape') {
      // Clear input on escape
      setNewMessage('');
      if (isTyping) {
        setIsTyping(false);
        webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, false);
      }
    }
  }, [sendMessage, isTyping, currentUser, selectedFriend]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Handle typing indicator
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, true);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, false);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, false);
        }
      }, 1500);
    }
  }, [isTyping, currentUser, selectedFriend]);

  const handleInputFocus = useCallback(() => {
    // Mark messages as read when user focuses on input
    markMessagesAsRead();
  }, [currentUser, selectedFriend]);

  const handleInputBlur = useCallback(() => {
    // Stop typing indicator when input loses focus
    if (isTyping) {
      setIsTyping(false);
      webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, false);
    }
  }, [isTyping, currentUser, selectedFriend]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return formatMessageTime(timestamp);
  };

  const formatDate = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = (currentMessage.timestamp instanceof Date ? 
      currentMessage.timestamp : new Date(currentMessage.timestamp)).toDateString();
    const previousDate = (previousMessage.timestamp instanceof Date ? 
      previousMessage.timestamp : new Date(previousMessage.timestamp)).toDateString();
    
    return currentDate !== previousDate;
  };

  if (!selectedFriend) return null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md max-h-[calc(100vh-8rem)]">
      {/* Chat Header - Fixed */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 border-b bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white rounded-t-lg">
        <div className="flex items-center">
          <div className="mr-3">
            <ProfileImage 
              user={selectedFriend} 
              size="md" 
              className="bg-white bg-opacity-20"
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">{selectedFriend.username}</h3>
            <p className="text-xs opacity-75 flex items-center text-white">
              {friendTyping ? (
                <>
                  <span className="animate-pulse mr-1">●</span>
                  typing...
                </>
              ) : (
                <>
                  <span className={`w-2 h-2 rounded-full mr-1 ${
                    userStatus.status === 'online' && connectionStatus === 'HEALTHY' ? 'bg-green-400' : 'bg-gray-400'
                  }`}></span>
                  {connectionStatus === 'HEALTHY' ? 
                    (userStatus.status === 'online' ? 'online' : 'offline') : 
                    connectionStatus === 'CHECKING' ? 'connecting...' : 'offline'}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Activity Status Indicator */}
          <div className={`w-3 h-3 rounded-full ${
            userStatus.status === 'online' && connectionStatus === 'HEALTHY' ? 'bg-green-400' : 'bg-gray-400'
          }`} title={userStatus.status === 'online' ? 'Online' : 'Offline'}></div>
          
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ scrollBehavior: 'smooth' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2c5364]"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser.id;
            const showDateSeparator = shouldShowDateSeparator(message, messages[index - 1]);
            
            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}
                
                <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
                  {!isOwnMessage && (
                    <div className="mr-2 flex-shrink-0">
                      <ProfileImage 
                        user={{
                          username: message.senderUsername,
                          profileImageUrl: message.senderProfileImageUrl
                        }}
                        size="sm"
                      />
                    </div>
                  )}
                  <div className={`max-w-[70%] px-3 py-2 rounded-2xl transition-all duration-300 ${
                    isOwnMessage 
                      ? message.pending 
                        ? 'bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white opacity-70 rounded-br-md transform scale-95' 
                        : 'bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white rounded-br-md transform scale-100'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md hover:bg-gray-200'
                  } shadow-sm hover:shadow-md`}>
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    <div className={`flex items-center justify-between mt-1 ${
                      isOwnMessage ? 'text-gray-200' : 'text-gray-500'
                    }`}>
                      <span className="text-xs" title={getRelativeTime(message.timestamp)}>
                        {formatTime(message.timestamp)}
                      </span>
                      {isOwnMessage && (
                        <span className="ml-2 flex items-center">
                          {message.pending ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className={`text-xs transition-colors duration-200 ${
                              message.isRead ? 'text-blue-300' : 'text-gray-300'
                            }`}>
                              {message.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOwnMessage && (
                    <div className="ml-2 flex-shrink-0">
                      <ProfileImage 
                        user={{
                          username: currentUser.username,
                          profileImageUrl: currentUser.profileImageUrl
                        }}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        <TypingIndicator username={selectedFriend.username} isVisible={friendTyping} />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={connectionStatus === 'HEALTHY' ? "Type a message..." : "Connecting..."}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c5364] focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            disabled={connectionStatus !== 'HEALTHY'}
            autoComplete="off"
            spellCheck="true"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending || connectionStatus !== 'HEALTHY'}
            className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
        {/* Connection Status and Typing Indicator */}
        <div className="flex items-center justify-between mt-1">
          {connectionStatus !== 'HEALTHY' && (
            <p className={`text-xs flex items-center ${
              connectionStatus === 'CHECKING' ? 'text-yellow-500' : 'text-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-1 ${
                connectionStatus === 'CHECKING' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
              }`}></div>
              {connectionStatus === 'CHECKING' ? 'Connecting...' : 'Connection lost. Trying to reconnect...'}
            </p>
          )}
          
          {isTyping && connectionStatus === 'HEALTHY' && (
            <p className="text-xs text-gray-500 flex items-center">
              <span className="animate-pulse mr-1">●</span>
              You are typing...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;