import React from 'react';
import { X, MessageCircle, UserPlus, Mail, MapPin, Calendar, Star, Users, Heart, Award } from 'lucide-react';
import type { ProfessionalUser } from '../../../api/services/professionalMessagingService';

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
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
          
          {/* Avatar and basic info */}
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100">
                <img
                  src={getAvatarUrl()}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {user.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Award size={14} className="text-white" />
                </div>
              )}
              {user.is_premium && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Star size={12} className="text-white" />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900">
                {user.full_name || user.name}
              </h2>
              {user.level && user.level > 1 && (
                <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">
                  Level {user.level}
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-gray-600">@{user.username}</p>
              {user.last_active && (
                <p className="text-xs text-gray-500">{formatLastActive(user.last_active)}</p>
              )}
            </div>
            
            {user.bio && (
              <p className="text-gray-700 text-sm mt-3 px-2 leading-relaxed">{user.bio}</p>
            )}

            {user.points && user.points > 0 && (
              <div className="mt-3 inline-flex items-center space-x-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">
                <Heart size={12} />
                <span>{user.points.toLocaleString()} points</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-3 text-center">
            {user.review_count !== undefined && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-lg font-bold text-blue-600">{user.review_count.toLocaleString()}</div>
                <div className="text-xs text-blue-600">Reviews</div>
              </div>
            )}
            {user.follower_count !== undefined && (
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-lg font-bold text-purple-600">{user.follower_count.toLocaleString()}</div>
                <div className="text-xs text-purple-600">Followers</div>
              </div>
            )}
            {user.following_count !== undefined && (
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-lg font-bold text-green-600">{user.following_count.toLocaleString()}</div>
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