import React from 'react';
import { useNavigate } from 'react-router-dom';

interface UserDisplayProps {
  user: {
    id: string | number;
    name: string;
    username?: string;
    avatar?: string | null;
  };
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showClickable?: boolean;
  onClick?: () => void;
}

const UserDisplay: React.FC<UserDisplayProps> = ({ 
  user, 
  subtitle, 
  badge, 
  actions, 
  size = 'md', 
  showClickable = true,
  onClick 
}) => {
  const navigate = useNavigate();
  
  const avatarSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10', 
    lg: 'w-12 h-12'
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (showClickable) {
      navigate(`/profile/${user.id}`);
    }
  };
  
  return (
    <div className="flex items-center space-x-3">
      <img
        src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`}
        alt={user.name}
        className={`${avatarSizes[size]} rounded-full object-cover ${showClickable ? 'cursor-pointer hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 transition-all' : ''}`}
        onClick={handleClick}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`;
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 
            className={`font-semibold text-gray-900 truncate ${showClickable ? 'cursor-pointer hover:text-purple-600 transition-colors' : ''}`}
            onClick={handleClick}
          >
            {user.name}
          </h3>
          {badge}
        </div>
        {(user.username || subtitle) && (
          <p className="text-sm text-gray-600 truncate">
            {user.username && `@${user.username}`}
            {user.username && subtitle && ' • '}
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default UserDisplay;