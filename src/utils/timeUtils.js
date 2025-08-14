// Advanced time utilities for chat application
export const getRelativeTime = (timestamp) => {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  return date.toLocaleDateString();
};

export const getActivityStatus = (lastSeen) => {
  if (!lastSeen) return { status: 'offline', text: 'offline' };
  
  const now = new Date();
  const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
  const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
  
  if (diffInMinutes < 5) {
    return { status: 'online', text: 'online' };
  } else if (diffInMinutes < 60) {
    return { status: 'away', text: `active ${diffInMinutes} min ago` };
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60);
    return { status: 'away', text: `active ${hours} hour${hours > 1 ? 's' : ''} ago` };
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return { status: 'offline', text: `active ${days} day${days > 1 ? 's' : ''} ago` };
  }
};

export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffInDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Today - show only time
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } else if (diffInDays === 1) {
    // Yesterday
    return `Yesterday ${date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  } else if (diffInDays < 7) {
    // This week - show day and time
    return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  } else {
    // Older - show date and time
    return `${date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    })} ${date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  }
};