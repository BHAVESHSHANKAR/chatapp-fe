import React from 'react';

const ProfileImage = ({ 
  user, 
  size = 'md', 
  className = '', 
  showOnlineStatus = false,
  onClick = null 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-16 h-16 text-2xl',
    '2xl': 'w-20 h-20 text-3xl'
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-bold transition-all duration-300 cursor-pointer ${className}`;

  if (user?.profileImageUrl) {
    return (
      <div className="relative inline-block">
        <img
          src={user.profileImageUrl}
          alt={`${user.username}'s profile`}
          className={`${baseClasses} object-cover border-2 border-white shadow-sm`}
          onClick={onClick}
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div 
          className={`${baseClasses} bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white border-2 border-white shadow-sm hidden absolute inset-0`}
          onClick={onClick}
        >
          {user.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        {showOnlineStatus && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm z-10"></div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <div 
        className={`${baseClasses} bg-gradient-to-r from-[#0F2027] to-[#2c5364] text-white border-2 border-white shadow-sm`}
        onClick={onClick}
      >
        {user?.username?.charAt(0).toUpperCase() || 'U'}
      </div>
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm z-10"></div>
      )}
    </div>
  );
};

export default ProfileImage;