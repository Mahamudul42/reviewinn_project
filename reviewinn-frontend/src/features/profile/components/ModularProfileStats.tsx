import React from 'react';
import { Trophy } from 'lucide-react';
import type { UserProfile } from '../../../types';

interface StatCard {
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  borderColor: string;
}

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
  className?: string;
  customLayout?: 'grid' | 'horizontal' | 'vertical';
  showTitle?: boolean;
  customStats?: StatCard[];
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  userProfile,
  isOwnProfile,
  stats,
  className = '',
  customLayout = 'grid',
  showTitle = true,
  customStats
}) => {
  const defaultStats: StatCard[] = [
    {
      label: 'Reviews',
      value: stats.totalReviews,
      color: 'text-blue-900',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Entities',
      value: stats.totalEntities,
      color: 'text-purple-900',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Avg Rating',
      value: stats.averageRating,
      color: 'text-yellow-900',
      bgColor: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-200'
    },
    {
      label: 'Followers',
      value: stats.followers,
      color: 'text-green-900',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200'
    },
    {
      label: 'Following',
      value: stats.following,
      color: 'text-indigo-900',
      bgColor: 'from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200'
    },
    {
      label: 'Level',
      value: userProfile.level || 1,
      color: 'text-orange-900',
      bgColor: 'from-orange-50 to-orange-100',
      borderColor: 'border-orange-200'
    }
  ];

  const statsToRender = customStats || defaultStats;

  const getGridClass = () => {
    switch (customLayout) {
      case 'horizontal':
        return 'flex flex-wrap gap-4';
      case 'vertical':
        return 'flex flex-col gap-4';
      default:
        return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4';
    }
  };

  const getItemClass = () => {
    switch (customLayout) {
      case 'horizontal':
        return 'flex-1 min-w-32';
      case 'vertical':
        return 'w-full';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white border-2 border-gray-200 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:border-gray-300 ${className}`}>
      {showTitle && (
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile Statistics</h2>
            <p className="text-gray-600 text-base">
              {isOwnProfile ? 'Your community impact' : `${userProfile.name}'s contributions`}
            </p>
          </div>
        </div>
      )}
      
      <div className={getGridClass()}>
        {statsToRender.map((stat, index) => (
          <div
            key={index}
            className={`text-center p-4 bg-gradient-to-br ${stat.bgColor} rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer border ${stat.borderColor} ${getItemClass()}`}
          >
            <div className={`text-2xl font-bold ${stat.color} mb-2`}>
              {typeof stat.value === 'number' && stat.value > 1000 
                ? stat.value.toLocaleString() 
                : stat.value
              }
            </div>
            <div className={`text-sm ${stat.color.replace('900', '700')} font-medium`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileStats;