import React from 'react';
import { 
  Star, 
  FileText, 
  Building, 
  Users, 
  UserPlus,
  TrendingUp,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
import type { UserProfile } from '../../../types';

interface ProfileStatsProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
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
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  userProfile,
  isOwnProfile,
  stats
}) => {
  const statCards = [
    {
      icon: FileText,
      label: 'Reviews Written',
      value: stats.totalReviews.toLocaleString(),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      description: 'Total reviews contributed'
    },
    {
      icon: Building,
      label: 'Entities Added',
      value: stats.totalEntities.toLocaleString(),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      description: 'Businesses and services added'
    },
    {
      icon: Star,
      label: 'Avg Rating Given',
      value: stats.averageRating.toFixed(1),
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      description: 'Average rating across all reviews'
    },
    {
      icon: Users,
      label: 'Followers',
      value: stats.followers.toLocaleString(),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      description: 'People following this profile'
    },
    {
      icon: UserPlus,
      label: 'Following',
      value: stats.following.toLocaleString(),
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
      description: 'Profiles being followed'
    },
    {
      icon: Award,
      label: 'Level',
      value: stats.level.toString(),
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      description: 'Current profile level'
    }
  ];

  const additionalMetrics = [
    {
      icon: TrendingUp,
      label: 'Profile Views',
      value: userProfile.profileViews || 0,
      suffix: ' views'
    },
    {
      icon: Calendar,
      label: 'Active Since',
      value: stats.joinDate,
      suffix: ''
    },
    {
      icon: BarChart3,
      label: 'Engagement Rate',
      value: userProfile.engagementRate || 0,
      suffix: '%'
    }
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-600">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-500">
                  {stat.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          Profile Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {additionalMetrics.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <IconComponent className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {metric.label}
                    </div>
                    <div className="text-lg font-bold text-gray-700">
                      {typeof metric.value === 'number' 
                        ? metric.value.toLocaleString() 
                        : metric.value
                      }{metric.suffix}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Indicators */}
      {isOwnProfile && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress to Next Level</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Level {stats.level}</span>
              <span className="text-gray-600">Level {stats.level + 1}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(((stats.points % 1000) / 1000) * 100, 100)}%` 
                }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{stats.points % 1000} points</span>
              <span>{1000 - (stats.points % 1000)} points to next level</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileStats;