import React from 'react';
import { X, MessageCircle, UserPlus, Mail, MapPin, Calendar, Star, Users, Heart, Award } from 'lucide-react';
import type { ProfessionalUser } from '../../../api/services/messaging';

interface ExtendedUser extends ProfessionalUser {
  full_name?: string;
  email?: string;
  bio?: string;
  location?: string;
  joined_date?: string;
  review_count?: number;
  follower_count?: number;
  following_count?: number;
  level?: number;
  points?: number;
  is_verified?: boolean;
  is_premium?: boolean;
  last_active?: string;
}

interface UserProfileModalProps {
  user: ExtendedUser;
  isOpen: boolean;
  onClose: () => void;
  onStartConversation?: (user: ProfessionalUser) => void;
  onFollowUser?: (userId: number) => void;
  onUnfollowUser?: (userId: number) => void;
  isFollowing?: boolean;
  currentUserId?: number;
  showActions?: boolean; // Control whether to show action buttons
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onStartConversation,
  onFollowUser,
  onUnfollowUser,
  isFollowing = false,
  currentUserId,
  showActions = true
}) => {
  if (!isOpen) return null;

  const getAvatarUrl = () => {
    return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=128&background=random`;
  };

  const handleStartConversation = () => {
    onStartConversation?.(user);
    onClose();
  };

  const handleFollowToggle = () => {
    if (isFollowing) {
      onUnfollowUser?.(user.user_id);
    } else {
      onFollowUser?.(user.user_id);
    }
  };

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return 'Unknown';
    try {
      const date = new Date(lastActive);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 5) return 'Active now';
      if (diffMins < 60) return `Active ${diffMins}m ago`;
      if (diffHours < 24) return `Active ${diffHours}h ago`;
      if (diffDays < 7) return `Active ${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        {/* Header with close button */}
        <div className="relative p-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">User Profile</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
              title="Close"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          
          {/* Avatar and basic info */}
          <div className="flex items-center space-x-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100 shadow-sm">
                <img
                  src={getAvatarUrl()}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {user.is_verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Award size={8} className="text-white" />
                </div>
              )}
              {user.is_premium && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Star size={6} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-lg font-bold text-gray-900">
                  {user.full_name || user.name}
                </h2>
                {user.level && user.level > 1 && (
                  <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-semibold">
                    Level {user.level}
                  </span>
                )}
              </div>
              
              <div className="space-y-0.5">
                <p className="text-gray-600 text-sm">@{user.username}</p>
                {user.last_active && (
                  <p className="text-xs text-gray-500">{formatLastActive(user.last_active)}</p>
                )}
              </div>
            </div>
          </div>
          
          {user.bio && (
            <p className="text-gray-700 text-sm mt-3 leading-relaxed">{user.bio}</p>
          )}

          {user.points && user.points > 0 && (
            <div className="mt-2 inline-flex items-center space-x-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
              <Heart size={10} />
              <span>{user.points.toLocaleString()} points</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-2 text-center">
            {user.review_count !== undefined && (
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-base font-bold text-blue-600">{user.review_count.toLocaleString()}</div>
                <div className="text-xs text-blue-600">Reviews</div>
              </div>
            )}
            {user.follower_count !== undefined && (
              <div className="bg-purple-50 rounded-lg p-2">
                <div className="text-base font-bold text-purple-600">{user.follower_count.toLocaleString()}</div>
                <div className="text-xs text-purple-600">Followers</div>
              </div>
            )}
            {user.following_count !== undefined && (
              <div className="bg-green-50 rounded-lg p-2">
                <div className="text-base font-bold text-green-600">{user.following_count.toLocaleString()}</div>
                <div className="text-xs text-green-600">Following</div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        {(user.location || user.email || user.joined_date) && (
          <div className="px-6 py-4 border-t border-gray-100 space-y-3">
            {user.location && (
              <div className="flex items-center space-x-3 text-gray-600">
                <MapPin size={16} />
                <span className="text-sm">{user.location}</span>
              </div>
            )}
            
            {user.email && (
              <div className="flex items-center space-x-3 text-gray-600">
                <Mail size={16} />
                <span className="text-sm">{user.email}</span>
              </div>
            )}
            
            {user.joined_date && (
              <div className="flex items-center space-x-3 text-gray-600">
                <Calendar size={16} />
                <span className="text-sm">Joined {user.joined_date}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {showActions && currentUserId !== user.user_id && (
          <div className="p-6 pt-4 border-t border-gray-100 flex space-x-3">
            {onStartConversation && (
              <button
                onClick={handleStartConversation}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
              >
                <MessageCircle size={16} />
                <span>Message</span>
              </button>
            )}
            
            {(onFollowUser || onUnfollowUser) && (
              <button 
                onClick={handleFollowToggle}
                className={`flex-1 py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 font-medium ${
                  isFollowing 
                    ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {isFollowing ? (
                  <>
                    <Users size={16} />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* View Profile Link */}
        {!showActions && (
          <div className="p-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">Click outside to close</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;