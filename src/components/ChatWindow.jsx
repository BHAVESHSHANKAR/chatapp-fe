import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/api';
import webSocketService from '../services/websocket';
import connectionStatusService from '../services/connectionStatus';
import ProfileImage from './ProfileImage';

const ChatWindow = ({ currentUser, selectedFriend, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [friendTyping, setFriendTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CHECKING');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedFriend && currentUser) {
      // Clear previous messages and load fresh
      setMessages([]);
      setSending(false);
      loadMessages();
      markMessagesAsRead();
    }

    // Monitor connection status
    const handleStatusChange = (status) => {
      setConnectionStatus(status.overall);
    };

    connectionStatusService.addListener(handleStatusChange);
    return () => {
      connectionStatusService.removeListener(handleStatusChange);
    };
  }, [selectedFriend, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set up WebSocket message handlers
    const handleNewMessage = (message) => {
      // Only add message if it's between current user and selected friend
      if (
        (message.senderId === currentUser.id && message.receiverId === selectedFriend.id) ||
        (message.senderId === selectedFriend.id && message.receiverId === currentUser.id)
      ) {
        setMessages(prev => {
          // If it's our own message, replace the optimistic message
          if (message.senderId === currentUser.id) {
            const updatedMessages = prev.map(msg => {
              if (msg.pending && msg.content === message.content && msg.senderId === currentUser.id) {
                // Replace optimistic message with real message
                return {
                  ...message,
                  timestamp: new Date(message.timestamp),
                  pending: false
                };
              }
              return msg;
            });
            
            // If no optimistic message was found, add the new message
            const hasOptimistic = prev.some(msg => 
              msg.pending && msg.content === message.content && msg.senderId === currentUser.id
            );
            
            if (!hasOptimistic) {
              const exists = prev.some(m => m.id === message.id);
              if (!exists) {
                return [...prev, { ...message, timestamp: new Date(message.timestamp) }];
              }
            }
            
            setSending(false);
            return updatedMessages;
          } else {
            // For friend's messages, just add if not exists
            const exists = prev.some(m => m.id === message.id);
            if (!exists) {
              return [...prev, { ...message, timestamp: new Date(message.timestamp) }];
            }
          }
          return prev;
        });
        
        // Mark as read if message is from friend
        if (message.senderId === selectedFriend.id) {
          chatService.markAsRead(selectedFriend.id, currentUser.id);
        }
      }
    };

    const handleTyping = (typingMessage) => {
      if (typingMessage.senderUsername === selectedFriend.username) {
        setFriendTyping(typingMessage.type === 'TYPING');
        
        // Clear typing indicator after 3 seconds
        if (typingMessage.type === 'TYPING') {
          setTimeout(() => setFriendTyping(false), 3000);
        }
      }
    };

    const handleError = (errorMessage) => {
      console.error('Chat error:', errorMessage);
      // You could show a toast notification here
    };

    webSocketService.addMessageHandler('message', handleNewMessage);
    webSocketService.addMessageHandler('typing', handleTyping);
    webSocketService.addMessageHandler('error', handleError);

    return () => {
      webSocketService.removeMessageHandler('message', handleNewMessage);
      webSocketService.removeMessageHandler('typing', handleTyping);
      webSocketService.removeMessageHandler('error', handleError);
    };
  }, [currentUser, selectedFriend]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('Loading messages for:', { currentUser, selectedFriend });
      
      if (!currentUser?.id || !selectedFriend?.id) {
        console.error('Missing user IDs:', { currentUser, selectedFriend });
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
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      console.log('Marking messages as read for:', { currentUser, selectedFriend });
      
      if (!currentUser?.id || !selectedFriend?.id) {
        console.error('Missing user IDs for mark as read:', { currentUser, selectedFriend });
        return;
      }
      
      await chatService.markAsRead(selectedFriend.id, currentUser.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    
    // Create optimistic message
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

    // Add optimistic message immediately to messages array
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
          type: 'CHAT'
        };

        webSocketService.sendMessage(message);
        
        // Set timeout to remove pending state if no response
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.tempId === tempId ? { ...msg, pending: false } : msg
          ));
          setSending(false);
        }, 3000);
        
      } else {
        throw new Error('WebSocket not connected');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.tempId !== tempId));
      setSending(false);
      alert('Failed to send message. Please check your connection.');
    }
    
    // Stop typing indicator
    if (isTyping) {
      webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Handle typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        webSocketService.sendTypingIndicator(currentUser.username, selectedFriend.username, false);
      }
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      return date.toLocaleDateString();
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
                    connectionStatus === 'HEALTHY' ? 'bg-green-400' : 
                    connectionStatus === 'CHECKING' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></span>
                  {connectionStatus === 'HEALTHY' ? 'Online' : 
                   connectionStatus === 'CHECKING' ? 'Connecting...' : 'Offline'}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Connection Status Indicator */}
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'HEALTHY' ? 'bg-green-400' : 
            connectionStatus === 'CHECKING' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
          }`} title={`Connection: ${connectionStatus}`}></div>
          
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
                  <div className={`max-w-[70%] px-3 py-2 rounded-2xl ${
                    isOwnMessage 
                      ? message.pending 
                        ? 'bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white opacity-70 rounded-br-md' 
                        : 'bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  } shadow-sm`}>
                    <p className="text-sm leading-relaxed break-words">{message.content}</p>
                    <div className={`flex items-center justify-between mt-1 ${
                      isOwnMessage ? 'text-gray-200' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                      {isOwnMessage && (
                        <span className="ml-2 flex items-center">
                          {message.pending ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span className="text-xs">{message.isRead ? '✓✓' : '✓'}</span>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c5364] focus:border-transparent"
            disabled={!webSocketService.isConnected()}
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
        {connectionStatus !== 'HEALTHY' && (
          <p className={`text-xs mt-1 flex items-center ${
            connectionStatus === 'CHECKING' ? 'text-yellow-500' : 'text-red-500'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-1 ${
              connectionStatus === 'CHECKING' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            }`}></div>
            {connectionStatus === 'CHECKING' ? 'Connecting...' : 'Connection lost. Trying to reconnect...'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;