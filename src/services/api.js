import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// Auth services
const authService = {
  register: (userData) => {
    return api.post('/auth/signup', userData);
  },
  login: (credentials) => {
    return api.post('/auth/signin', credentials);
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// User services
const userService = {
  searchUsers: (query) => {
    return api.get(`/users/search?query=${query}`);
  }
};

// Friend services
const friendService = {
  sendFriendRequest: (receiverId) => {
    return api.post(`/friends/request/${receiverId}`);
  },
  respondToFriendRequest: (requestId, accept) => {
    return api.post(`/friends/respond/${requestId}`, { accept });
  },
  getPendingRequests: () => {
    return api.get('/friends/pending');
  },
  getSentRequests: () => {
    return api.get('/friends/sent');
  },
  getFriends: () => {
    return api.get('/friends/list');
  }
};

// Chat services
const chatService = {
  getMessages: (userId1, userId2, page = 0, size = 50) => {
    return api.get(`/chat/messages?userId1=${userId1}&userId2=${userId2}&page=${page}&size=${size}`);
  },
  markAsRead: (senderId, receiverId) => {
    return api.post(`/chat/mark-read?senderId=${senderId}&receiverId=${receiverId}`);
  },
  getUnreadCount: (userId) => {
    return api.get(`/chat/unread-count?userId=${userId}`);
  }
};

// Profile service
const profileService = {
  uploadProfileImage: (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProfileImage: () => api.delete('/profile/delete-image'),
  getCurrentUser: () => api.get('/profile/me'),
};

export { api, authService, userService, friendService, chatService, profileService };