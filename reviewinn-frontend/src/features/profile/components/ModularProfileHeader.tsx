import React from 'react';
import { 
  Settings, 
  Calendar, 
  Shield, 
  MapPin, 
  Link, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Crown, 
  Sparkles,
  Trophy
} from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import type { UserProfile } from '../../../types';

interface ProfileHeaderProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
  currentUser?: any;
  stats: {
    totalReviews: number;
    totalEntities: number;
    averageRating: number;
    joinDate: string;
    level: number;
    points: number;
    followers: number;
    following: number;
  };
  onEditProfile: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onAddToCircle?: () => void;
  className?: string;
}

const ModularProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  isOwnProfile,
  currentUser,
  stats,
  onEditProfile,
  onFollow,
  onMessage,
  onAddToCircle,
  className = ''
}) => {
  const isFollowing = userProfile.followers?.includes(currentUser?.id);
  
  const levelColor = stats.level >= 10 ? 'from-purple-500 to-pink-500' : 
                     stats.level >= 5 ? 'from-blue-500 to-indigo-500' : 
                     'from-green-500 to-emerald-500';

  return (
    <div className={`relative bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden ${className}`}>
      {/* Purple Header Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 h-32">
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Edit Button - Properly Positioned */}
        {isOwnProfile && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onEditProfile}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 border border-white/20 hover:border-white/40"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Edit</span>
            </button>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-8 left-8 w-3 h-3 bg-white/20 rounded-full"></div>
        <div className="absolute top-16 right-16 w-2 h-2 bg-white/30 rounded-full"></div>
        <div className="absolute bottom-8 left-16 w-4 h-4 bg-white/15 rounded-full"></div>
      </div>


      {/* Profile Content Section */}
      <div className="relative px-6 pb-6">
        {/* Avatar Positioned Over Header */}
        <div className="flex items-start justify-between -mt-8 mb-5">
          {/* Avatar Section */}
          <div className="relative">
            {/* Avatar with Purple Ring - Smaller Size */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full p-0.5">
                <div className="bg-white rounded-full p-0.5">
                  <img
                    src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=8b5cf6&color=ffffff&size=64&rounded=true`}
                    alt={userProfile.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                </div>
              </div>
              
              {/* Verification Badge - Smaller */}
              {userProfile.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-1 ring-3 ring-white">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Top Right */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={onAddToCircle}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 shadow-lg"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm">Add to Circle</span>
              </button>
              
              <button
                onClick={onFollow}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 shadow-lg ${
                  isFollowing
                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="text-sm">{isFollowing ? 'Following' : 'Follow'}</span>
              </button>
              
              <button
                onClick={onMessage}
                className="bg-white hover:bg-gray-50 border-2 border-purple-200 hover:border-purple-400 text-purple-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">Message</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          {/* Name and Username */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {(() => {
                  if (userProfile.firstName && userProfile.lastName) {
                    return `${userProfile.firstName} ${userProfile.lastName}`;
                  }
                  if (userProfile.name) {
                    return userProfile.name;
                  }
                  return userProfile.email || 'User';
                })()}
              </h1>
              
              {/* Badges */}
              <div className="flex items-center gap-2">
                {userProfile.isVerified && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
                <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  <span className="text-xs font-medium">Level {stats.level}</span>
                </div>
              </div>
            </div>
            
            {userProfile.username && (
              <p className="text-purple-600 font-medium">@{userProfile.username}</p>
            )}
          </div>

          {/* Bio */}
          {userProfile.bio && (
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
              <p className="text-gray-700 text-sm leading-relaxed">{userProfile.bio}</p>
            </div>
          )}

          {/* Profile Details */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
              <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Joined</p>
              <p className="text-sm font-medium text-gray-900">{stats.joinDate}</p>
            </div>
            
            {userProfile.location && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                <MapPin className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Location</p>
                <p className="text-sm font-medium text-gray-900 truncate">{userProfile.location}</p>
              </div>
            )}
            
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
              <Trophy className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">Points</p>
              <p className="text-sm font-medium text-gray-900">{stats.points.toLocaleString()}</p>
            </div>
            
            {userProfile.website && (
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                <Link className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Website</p>
                <a 
                  href={userProfile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors truncate block"
                >
                  {userProfile.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        {userProfile.badges && userProfile.badges.length > 0 && (
          <div className="border-t border-purple-100 pt-4 mt-4">
            <div className="space-y-3">
              {/* Section Header */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
              </div>
              
              {/* Achievements Grid */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {userProfile.badges.slice(0, 6).map((badge, index) => (
                  <div
                    key={badge.id}
                    className="group relative cursor-pointer flex-shrink-0"
                    title={badge.description}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
                      index % 4 === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      index % 4 === 1 ? 'bg-gradient-to-br from-blue-400 to-cyan-500' :
                      index % 4 === 2 ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                      'bg-gradient-to-br from-green-400 to-emerald-500'
                    }`}>
                      <span className="text-white text-lg font-bold">{badge.icon}</span>
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 shadow-lg">
                      {badge.name}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                ))}
                
                {/* More Indicator */}
                {userProfile.badges.length > 6 && (
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 text-sm font-bold shadow-md">
                    +{userProfile.badges.length - 6}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModularProfileHeader;