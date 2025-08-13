import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, friendService, userService } from '../services/api';
import Lottie from 'lottie-react';
import chatAnimation from '../assets/animations/Chat.json';
import webSocketService from '../services/websocket';
import ChatWindow from '../components/ChatWindow';
import connectionStatusService from '../services/connectionStatus';
import ProfileImage from '../components/ProfileImage';
import ProfileEditModal from '../components/ProfileEditModal';

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard'); // 'dashboard', 'friends', or 'chats'
  const [connectionStatus, setConnectionStatus] = useState('CHECKING');
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    // Get current user from local storage
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      
      // Connect to WebSocket
      webSocketService.connect(
        currentUser.username,
        () => {
          console.log('WebSocket connected successfully');
        },
        (error) => {
          console.error('WebSocket connection failed:', error);
        }
      );
    }

    // Load friends list and pending requests
    const loadData = async () => {
      try {
        const [friendsResponse, pendingResponse] = await Promise.all([
          friendService.getFriends(),
          friendService.getPendingRequests()
        ]);
        
        setFriends(friendsResponse.data);
        setPendingRequests(pendingResponse.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Start connection monitoring
    connectionStatusService.startMonitoring();
    
    // Monitor connection status
    const handleStatusChange = (status) => {
      setConnectionStatus(status.overall);
    };

    connectionStatusService.addListener(handleStatusChange);

    // Cleanup WebSocket connection on unmount
    return () => {
      webSocketService.disconnect();
      connectionStatusService.stopMonitoring();
      connectionStatusService.removeListener(handleStatusChange);
    };
  }, []);

  // Handle click outside to close profile popup and chat
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile popup when clicking outside
      if (showProfilePopup && !event.target.closest('.profile-popup-container')) {
        setShowProfilePopup(false);
      }
      
      // Close chat when clicking outside the chat area (only in friends section)
      if (activeSection === 'friends' && selectedFriend && event.target.closest('.main-content-area') && 
          !event.target.closest('.chat-area') && !event.target.closest('.friends-list-item')) {
        setSelectedFriend(null);
      }
    };

    // Add event listener to handle clicks outside the popup
    document.addEventListener('mousedown', handleClickOutside);
    
    // Add escape key handler to close popup or chat
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
         if (showProfilePopup) {
           setShowProfilePopup(false);
         } else if (activeSection === 'friends' && selectedFriend) {
           setSelectedFriend(null);
         }
       }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    // Cleanup event listeners on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showProfilePopup, selectedFriend, activeSection]);

  const handleLogout = () => {
    webSocketService.disconnect();
    authService.logout();
    navigate('/auth');
  };

  const handleEditProfile = () => {
    // Close the profile popup and open edit modal
    setShowProfilePopup(false);
    setShowProfileEditModal(true);
  };

  const handleProfileUpdate = (updatedUser) => {
    // Update user state with new profile data
    setUser(updatedUser);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await userService.searchUsers(searchQuery);
      setSearchResults(response.data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendService.sendFriendRequest(userId);
      // Remove user from search results after sending request
      setSearchResults(prevResults => 
        prevResults.filter(user => user.id !== userId)
      );
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };
  
  const handleRespondToRequest = async (requestId, accept) => {
    try {
      await friendService.respondToFriendRequest(requestId, accept);
      // Remove the request from pending list
      setPendingRequests(prevRequests => 
        prevRequests.filter(request => request.id !== requestId)
      );
      
      // If accepted, refresh friends list
      if (accept) {
        const response = await friendService.getFriends();
        setFriends(response.data);
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  const handleSelectFriend = (friend) => {
    const friendId = friend.sender?.username !== user?.username ? friend.sender?.id : friend.receiver?.id;
    const friendName = friend.sender?.username !== user?.username ? friend.sender?.username : friend.receiver?.username;
    const friendProfileImageUrl = friend.sender?.username !== user?.username ? friend.sender?.profileImageUrl : friend.receiver?.profileImageUrl;
    
    setSelectedFriend({
      id: friendId,
      username: friendName,
      profileImageUrl: friendProfileImageUrl
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2c5364]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      {/* Mobile Header with Hamburger Menu */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 rounded-lg bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent">
            PlayChat
          </h1>
        </div>
        <ProfileImage user={user} size="sm" onClick={() => setShowProfilePopup(!showProfilePopup)} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-white bg-opacity-70 backdrop-filter backdrop-blur-md z-40"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: Floating Vertical Pill, Mobile: Slide-in */}
      <div className={`
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:w-20 w-64 bg-white shadow-lg fixed h-full lg:h-auto flex flex-col items-center py-6 
        lg:rounded-full lg:mx-4 lg:my-8 lg:left-0 lg:top-0 lg:bottom-0
        transition-transform duration-300 ease-in-out z-50
        ${isMobileSidebarOpen ? 'left-0 top-0' : 'left-0 top-0'}
      `}>
        {/* Mobile: Close button and branding */}
        <div className="lg:hidden w-full flex items-center justify-between mb-6 px-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent">
            PlayChat
          </h2>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Profile at Top */}
        <div className="mb-8 lg:mb-8">
          <button 
            onClick={() => {
              setShowProfilePopup(!showProfilePopup);
              setIsMobileSidebarOpen(false);
            }}
            className="transition-all duration-300 transform hover:scale-105 flex lg:flex-col items-center lg:items-center space-x-3 lg:space-x-0 w-full lg:w-auto px-4 lg:px-0"
            title={user?.username || 'User Profile'}
          >
            <ProfileImage user={user} size="lg" />
            <div className="lg:hidden text-left">
              <p className="font-semibold text-gray-900">{user?.username}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </button>
        </div>
        
        <div className="flex-1 flex lg:flex-col lg:items-center lg:space-y-8 flex-col space-y-2 w-full lg:w-auto">
          {/* Dashboard Icon */}
          <button 
            onClick={() => {
              setActiveSection('dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className={`
              lg:w-14 lg:h-14 w-full lg:rounded-full rounded-lg px-4 py-3 lg:px-0 lg:py-0
              ${activeSection === 'dashboard' 
                ? 'lg:bg-gradient-to-r lg:from-[#0F2027] lg:to-[#2c5364] lg:ring-2 lg:ring-blue-400 bg-gray-100' 
                : 'lg:bg-gradient-to-r lg:from-[#0F2027] lg:to-[#2c5364] bg-white'} 
              flex lg:items-center lg:justify-center items-center lg:space-x-0 space-x-3 lg:text-white text-gray-800 lg:shadow-md hover:shadow-lg transition-all duration-300 lg:transform lg:hover:scale-110
            `} 
            title="Dashboard"
          >
            <svg className="w-6 h-6 lg:w-6 lg:h-6 lg:text-white text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            <span className="lg:hidden font-medium">Dashboard</span>
          </button>
          
          {/* Friends Icon */}
          <button 
            onClick={() => {
              setActiveSection('friends');
              setIsMobileSidebarOpen(false);
            }}
            className={`
              lg:w-14 lg:h-14 w-full lg:rounded-full rounded-lg px-4 py-3 lg:px-0 lg:py-0
              ${activeSection === 'friends' 
                ? 'lg:bg-gradient-to-r lg:from-[#0F2027] lg:to-[#2c5364] lg:ring-2 lg:ring-blue-400 bg-gray-100' 
                : 'lg:bg-gradient-to-r lg:from-[#0F2027] lg:to-[#2c5364] bg-white'} 
              flex lg:items-center lg:justify-center items-center lg:space-x-0 space-x-3 lg:text-white text-gray-800 lg:shadow-md hover:shadow-lg transition-all duration-300 lg:transform lg:hover:scale-110
            `}
            title="Friends"
          >
            <svg className="w-6 h-6 lg:text-white text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="lg:hidden font-medium">Friends</span>
          </button>
          
          {/* Chats Icon */}
          <button 
            onClick={() => {
              setActiveSection('chats');
              setIsMobileSidebarOpen(false);
            }}
            className={`
              lg:w-14 lg:h-14 w-full lg:rounded-full rounded-lg px-4 py-3 lg:px-0 lg:py-0
              ${activeSection === 'chats' 
                ? 'lg:bg-gradient-to-r lg:from-[#0F2027] lg:to-[#2c5364] lg:ring-2 lg:ring-blue-400 bg-gray-100' 
                : 'lg:bg-gradient-to-r lg:from-[#0F2027] lg:to-[#2c5364] bg-white'} 
              flex lg:items-center lg:justify-center items-center lg:space-x-0 space-x-3 lg:text-white text-gray-800 lg:shadow-md hover:shadow-lg transition-all duration-300 lg:transform lg:hover:scale-110
            `}
            title="Chats"
          >
            <svg className="w-6 h-6 lg:text-white text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
            <span className="lg:hidden font-medium">Chats</span>
          </button>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="mt-4">
          <div 
            className={`w-14 h-3 rounded-full ${
              connectionStatus === 'HEALTHY' ? 'bg-green-400' : 
              connectionStatus === 'CHECKING' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
            }`}
            title={`Server Status: ${connectionStatus}`}
          ></div>
        </div>

        {/* Logout Button at Bottom */}
        <div className="mt-4">
          <button 
            onClick={handleLogout}
            className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-110 hover:bg-gray-300"
            title="Logout"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm1 2h10v10H4V5zm4.293 2.293a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414-1.414L9.586 10 8.293 8.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Profile Popup - Centered with Glass Effect */}
      {showProfilePopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-filter backdrop-blur-md">
          <div className="bg-white bg-opacity-90 backdrop-filter backdrop-blur-xl rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 profile-popup-container">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
              <button 
                onClick={() => setShowProfilePopup(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="mr-4">
                <ProfileImage user={user} size="xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user?.username}</h3>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-700">Status</span>
                <span className="text-green-600 font-medium flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                  Online
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-700">Friends</span>
                <span className="text-gray-900 font-medium">{friends.length}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-700">Pending Requests</span>
                <span className="text-gray-900 font-medium">{pendingRequests.length}</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={handleEditProfile}
                className="flex-1 bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white py-2 rounded-lg font-medium hover:shadow-lg transition-all duration-300"
              >
                Edit Profile
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-medium hover:bg-gray-300 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <ProfileEditModal
        user={user}
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        onProfileUpdate={handleProfileUpdate}
      />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-28 ml-0 p-4 lg:p-6 pt-20 lg:pt-6 main-content-area">
        <div className="container mx-auto">
          {activeSection === 'dashboard' ? (
            // Dashboard Section
            <div className="w-full p-2 lg:p-6 flex items-center justify-center min-h-[calc(100vh-64px)]">
              <div className="bg-white rounded-lg shadow-md p-4 lg:p-8 max-w-2xl w-full text-center">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4 lg:mb-6">
                  Welcome to <span className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] bg-clip-text text-transparent">PlayChat</span>, {user?.username}!
                </h1>
                
                <div className="chat-animation w-48 h-48 lg:w-64 lg:h-64 mx-auto mb-6 lg:mb-8">
                  <Lottie 
                    animationData={chatAnimation} 
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                
                <p className="text-gray-600 mb-6 lg:mb-8 text-sm lg:text-base">Connect with friends and start chatting!</p>
                
                <button 
                  onClick={() => setActiveSection('friends')}
                  className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-300 text-sm lg:text-base"
                >
                  Connect with Friends
                </button>
              </div>
            </div>
          ) : (activeSection === 'friends' || activeSection === 'chats') ? (
            // Friends/Chats Section - Responsive Layout
            <div className="w-full flex flex-col xl:flex-row gap-4 lg:gap-6 h-[calc(100vh-8rem)]">
              {/* Left Column - Friends List */}
              <div className="xl:w-1/3 w-full flex flex-col">
                <div className="bg-white rounded-lg shadow-md p-6 h-full max-h-full overflow-hidden flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">My Friends</h2>
                  
                  {friends.length > 0 ? (
                    <div className="flex-1 overflow-y-auto">
                      <ul className="divide-y divide-gray-100">
                        {friends.map((friend) => {
                        const friendName = friend.sender?.username !== user?.username 
                          ? friend.sender?.username 
                          : friend.receiver?.username;
                        
                        return (
                          <li key={friend.id} className="py-4 flex items-center justify-between hover:bg-gray-50 rounded-lg px-3 transition-colors friends-list-item">
                            <div className="flex items-center">
                              <ProfileImage 
                                user={{ 
                                  username: friendName, 
                                  profileImageUrl: friend.sender?.username !== user?.username ? friend.sender?.profileImageUrl : friend.receiver?.profileImageUrl 
                                }} 
                                size="md" 
                                showOnlineStatus={true}
                              />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{friendName}</p>
                                <p className="text-xs text-gray-500">Online</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleSelectFriend(friend)}
                              className="text-sm bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-3 py-1.5 rounded-lg hover:shadow-md transition-all duration-300"
                            >
                              Message
                            </button>
                          </li>
                        );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-3">You don't have any friends yet.</p>
                      <button 
                        onClick={() => setActiveSection('friends')}
                        className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-300"
                      >
                        Find Friends
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column - Search, Pending Requests, and Selected Friend Chat */}
              <div className="xl:w-2/3 w-full flex flex-col h-full">
                {!selectedFriend && activeSection === 'friends' && (
                  <div className="h-full">
                    <div className="bg-white rounded-lg shadow-md p-6 h-full overflow-y-auto flex flex-col">
                      {/* Search Form */}
                      <form onSubmit={handleSearch} className="mb-4 lg:mb-6">
                        <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 lg:mb-4">Find Friends</h2>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="Search by username or email"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 lg:px-4 py-2 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-[#2c5364] focus:border-transparent"
                          />
                          <button 
                            type="submit"
                            disabled={isSearching}
                            className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-3 lg:px-4 py-2 rounded-lg font-medium transition-all hover:shadow-lg disabled:opacity-70 text-sm lg:text-base whitespace-nowrap"
                          >
                            {isSearching ? 'Searching...' : 'Search'}
                          </button>
                        </div>
                      </form>
                      
                      {/* Search Results */}
                      {showSearchResults && (
                        <div className="mb-8">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-gray-900">Search Results</h3>
                            <button 
                              onClick={() => setShowSearchResults(false)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              Close
                            </button>
                          </div>
                          
                          {searchResults.length > 0 ? (
                            <ul className="divide-y divide-gray-100 bg-gray-50 rounded-lg overflow-hidden">
                              {searchResults.map((user) => (
                                <li key={user.id} className="py-3 px-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                  <div className="flex items-center">
                                    <ProfileImage 
                                      user={user} 
                                      size="md"
                                    />
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                                      <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleSendFriendRequest(user.id)}
                                    className="text-sm bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-3 py-1.5 rounded-lg hover:shadow-md transition-all duration-300"
                                  >
                                    Add Friend
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="text-center py-6 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">No users found matching your search.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pending Friend Requests */}
                      <div className="mt-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Friend Requests</h2>
                        
                        {pendingRequests.length > 0 ? (
                          <ul className="divide-y divide-gray-100 bg-gray-50 rounded-lg overflow-hidden">
                            {pendingRequests.map((request) => (
                              <li key={request.id} className="py-3 px-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                                <div className="flex items-center">
                                  <ProfileImage 
                                    user={request.sender} 
                                    size="md"
                                  />
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{request.sender?.username}</p>
                                    <p className="text-xs text-gray-500">{request.sender?.email}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleRespondToRequest(request.id, true)}
                                    className="bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white px-3 py-1.5 rounded-lg text-xs hover:shadow-md transition-all duration-300"
                                  >
                                    Accept
                                  </button>
                                  <button 
                                    onClick={() => handleRespondToRequest(request.id, false)}
                                    className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-300 transition-all duration-300"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No pending friend requests.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {!selectedFriend && activeSection === 'chats' && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-32 h-32 mx-auto mb-4 opacity-50">
                        <Lottie 
                          animationData={chatAnimation} 
                          loop={true}
                          autoplay={true}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a friend to start chatting</h3>
                      <p className="text-gray-500">Choose someone from your friends list to begin a conversation</p>
                    </div>
                  </div>
                )}
                
                {/* Chat area - Only shows when a friend is selected */}
                {selectedFriend && (
                  <div className="w-full h-full max-h-[calc(100vh-8rem)] chat-area">
                    <ChatWindow
                      key={`${selectedFriend.id}-${activeSection}`}
                      currentUser={user}
                      selectedFriend={selectedFriend}
                      onClose={() => setSelectedFriend(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Home;