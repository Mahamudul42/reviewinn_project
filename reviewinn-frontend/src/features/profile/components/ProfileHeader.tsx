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
  Trophy,
  UserPlus,
  UserMinus
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
  onEditProfile?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onAddToCircle?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  isOwnProfile,
  currentUser,
  stats,
  onEditProfile,
  onFollow,
  onMessage,
  onAddToCircle
}) => {
  const isFollowing = currentUser && userProfile.followers?.includes(currentUser.id);
  
  // Generate avatar URL
  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff&size=120&rounded=true&font-size=0.4`;
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 mb-6 shadow-sm border border-purple-100">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Profile Picture and Basic Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={userProfile.avatar || getAvatarUrl(userProfile.name || userProfile.username)}
              alt={userProfile.name || userProfile.username}
              className="w-20 h-20 rounded-full shadow-lg border-4 border-white"
            />
            {userProfile.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 shadow-lg">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {userProfile.name || userProfile.username}
              </h1>
              {userProfile.isPremium && (
                <Crown className="w-5 h-5 text-yellow-500" />
              )}
              {stats.level >= 10 && (
                <Trophy className="w-5 h-5 text-purple-600" />
              )}
            </div>
            
            {userProfile.name && userProfile.username && (
              <p className="text-gray-600 text-sm">@{userProfile.username}</p>
            )}
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {stats.joinDate}</span>
              </div>
              {userProfile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{userProfile.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 md:ml-auto">
          {isOwnProfile ? (
            <Button
              onClick={onEditProfile}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                onClick={onFollow}
                variant={isFollowing ? "outline" : "primary"}
                size="sm"
                className="flex items-center gap-2"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </>
                )}
              </Button>
              
              <Button
                onClick={onMessage}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
              
              <Button
                onClick={onAddToCircle}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Add to Circle
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Bio Section */}
      {userProfile.bio && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-gray-700">{userProfile.bio}</p>
        </div>
      )}

      {/* Links Section */}
      {userProfile.website && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex items-center gap-2">
            <Link className="w-4 h-4 text-gray-500" />
            <a
              href={userProfile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {userProfile.website}
            </a>
          </div>
        </div>
      )}

      {/* Level and Points Badge */}
      <div className="mt-4 flex items-center gap-3">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Level {stats.level}
        </div>
        
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
          {stats.points.toLocaleString()} Points
        </div>

        {userProfile.badges && userProfile.badges.length > 0 && (
          <div className="flex items-center gap-1">
            {userProfile.badges.slice(0, 3).map((badge, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 px-2 py-1 rounded-full text-xs font-medium text-gray-700"
                title={badge}
              >
                🏅 {badge}
              </div>
            ))}
            {userProfile.badges.length > 3 && (
              <div className="text-xs text-gray-500">
                +{userProfile.badges.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;