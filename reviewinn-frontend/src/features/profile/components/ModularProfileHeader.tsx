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
    <div className={`bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 relative overflow-visible ${className}`}>
      {/* Edit Button - Top Right Corner of Entire Component */}
      {isOwnProfile && (
        <div className="absolute top-3 right-3 z-50" style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 9999 }}>
          <button
            onClick={onEditProfile}
            className="bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-600 hover:via-purple-600 hover:to-fuchsia-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 border-2 border-white/20 hover:border-white/40"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7, #d946ef, #ec4899)',
              boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            <Settings className="w-4 h-4 drop-shadow-sm" />
            <span className="drop-shadow-sm">Edit Profile</span>
          </button>
        </div>
      )}
      
      {/* Colorful Header Section */}
      <div className="relative">
        {/* Gradient Header Background */}
        <div className="h-24 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-2 left-4 w-12 h-12 bg-white/10 rounded-full animate-bounce"></div>
            <div className="absolute top-6 right-12 w-8 h-8 bg-yellow-300/20 rounded-full animate-pulse"></div>
            <div className="absolute bottom-3 left-1/3 w-6 h-6 bg-cyan-300/20 rounded-full animate-ping"></div>
            <div className="absolute bottom-2 right-6 w-10 h-10 bg-pink-300/15 rounded-full animate-pulse delay-500"></div>
          </div>
          
          {/* Sparkle Effects */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5"></div>
        </div>
      </div>

      {/* Profile Content with Better Layout */}
      <div className="relative px-6 pb-6 bg-white">
                 {/* Avatar and Basic Info with Improved Spacing */}
         <div className="flex items-start gap-4 -mt-8 mb-4">
                     {/* Smaller Avatar with Enhanced Design */}
           <div className="relative group flex-shrink-0">
             <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
             <img
               src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=8b5cf6&color=ffffff&size=64&rounded=true`}
               alt={userProfile.name}
               className="relative w-16 h-16 rounded-full border-3 border-white shadow-lg object-cover hover:shadow-xl transition-all duration-300"
             />
               
               {userProfile.isVerified && (
                 <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-1 shadow-lg ring-4 ring-white">
                   <CheckCircle className="h-3 w-3 text-white" />
                 </div>
               )}
           </div>

          {/* Name, Bio, and Action Buttons with Better Layout */}
          <div className="flex-1 min-w-0 pt-2">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                                 {/* Name and Badges with Better Spacing */}
                 <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                   <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent truncate">
                     {(() => {
                       // Try different combinations of name fields
                       if (userProfile.firstName && userProfile.lastName) {
                         return `${userProfile.firstName} ${userProfile.lastName}`;
                       }
                       if (userProfile.name) {
                         return userProfile.name;
                       }
                       return userProfile.email || 'User';
                     })()}
                   </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    {userProfile.isVerified && (
                      <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-full shadow-sm">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <span className="text-emerald-700 text-sm font-semibold">Verified</span>
                      </div>
                    )}
                    <div className={`px-3 py-1.5 bg-gradient-to-r ${levelColor} rounded-full shadow-md hover:shadow-lg transition-shadow`}>
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-4 w-4 text-white" />
                        <span className="text-white font-semibold text-sm">Level {stats.level}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                                 {userProfile.username && (
                   <p className="text-indigo-600 text-lg font-semibold mb-3">@{userProfile.username}</p>
                 )}

                 {/* Bio with Enhanced Styling */}
                 {userProfile.bio && (
                   <p className="text-gray-700 text-base leading-relaxed mb-4 line-clamp-2 max-w-2xl bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm">
                     {userProfile.bio}
                   </p>
                 )}

                                 {/* Profile Details with Colorful Icons */}
                 <div className="flex flex-wrap items-center gap-3 text-gray-600 text-sm">
                   <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-3 py-2 rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                     <Calendar className="h-4 w-4 text-blue-600" />
                     <span className="text-blue-700 font-semibold">Joined {stats.joinDate}</span>
                   </div>
                   {userProfile.location && (
                     <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 px-3 py-2 rounded-full border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                       <MapPin className="h-4 w-4 text-emerald-600" />
                       <span className="text-emerald-700 font-semibold">{userProfile.location}</span>
                     </div>
                   )}
                   {userProfile.website && (
                     <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2 rounded-full border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                       <Link className="h-4 w-4 text-purple-600" />
                       <a 
                         href={userProfile.website} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="text-purple-700 font-semibold hover:text-purple-800 transition-colors"
                       >
                         {userProfile.website}
                       </a>
                     </div>
                   )}
                   <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 rounded-full border border-amber-200 shadow-sm hover:shadow-md transition-shadow">
                     <Trophy className="h-4 w-4 text-amber-600" />
                     <span className="text-amber-700 font-semibold">{stats.points.toLocaleString()} points</span>
                   </div>
                 </div>
              </div>

              {/* Action Buttons with Enhanced Design */}
              {!isOwnProfile && (
                <div className="flex items-center gap-3 flex-shrink-0 mt-4 lg:mt-0">
                  <Button
                    onClick={onFollow}
                    size="sm"
                    className={`px-4 py-2 text-sm font-semibold transition-all duration-300 rounded-full ${
                      isFollowing
                        ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button
                    onClick={onMessage}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 text-sm font-semibold hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 border-indigo-300 hover:border-indigo-400 text-indigo-700 hover:text-indigo-800 transition-all duration-300 rounded-full"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    onClick={onAddToCircle}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 text-sm font-semibold hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-purple-300 hover:border-purple-400 text-purple-700 hover:text-purple-800 transition-all duration-300 rounded-full"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Add to Circle
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Achievements/Badges with Enhanced Design */}
        {userProfile.badges && userProfile.badges.length > 0 && (
          <div className="pt-6 mt-6 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">Recent Achievements</h3>
            </div>
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              {userProfile.badges.slice(0, 6).map((badge, index) => (
                <div
                  key={badge.id}
                  className="flex-shrink-0 group relative"
                  title={badge.description}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 ${
                    index % 4 === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    index % 4 === 1 ? 'bg-gradient-to-r from-blue-400 to-cyan-500' :
                    index % 4 === 2 ? 'bg-gradient-to-r from-purple-400 to-pink-500' :
                    'bg-gradient-to-r from-green-400 to-emerald-500'
                  }`}>
                    <span className="text-white text-base font-bold">{badge.icon}</span>
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                    {badge.name}
                  </div>
                </div>
              ))}
              {userProfile.badges.length > 6 && (
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg hover:shadow-xl transition-shadow">
                  +{userProfile.badges.length - 6}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModularProfileHeader;