import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, MessageCircle, User, Award, Activity } from 'lucide-react';
import type { User as UserType, Entity, Review } from '../../types';

interface PersonalizedLeftPanelCardsProps {
  user: UserType;
}

interface UserStats {
  mostReactedEntity?: {
    name: string;
    reactions: number;
    category: string;
  };
  mostReactedReview?: {
    title: string;
    reactions: number;
    entityName: string;
  };
  recentActivity: {
    reviews: number;
    reactions: number;
    comments: number;
  };
}

const PersonalizedLeftPanelCards: React.FC<PersonalizedLeftPanelCardsProps> = ({ user }) => {
  const [userStats, setUserStats] = useState<UserStats>({
    recentActivity: { reviews: 0, reactions: 0, comments: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        const mockStats: UserStats = {
          mostReactedEntity: {
            name: 'Blue Ocean Restaurant',
            reactions: 47,
            category: 'Food & Dining'
          },
          mostReactedReview: {
            title: 'Amazing service and quality food',
            reactions: 23,
            entityName: 'Downtown Cafe'
          },
          recentActivity: {
            reviews: 3,
            reactions: 12,
            comments: 8
          }
        };
        
        setUserStats(mockStats);
      } catch (error) {
        console.error('Failed to load user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserStats();
  }, [user.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-4 animate-pulse">
            <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Welcome back!</h3>
            <p className="text-xs text-white text-opacity-90">{user.name}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white bg-opacity-10 rounded-lg p-2">
            <p className="text-xs font-medium">Level</p>
            <p className="text-sm font-bold">{user.level || 1}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-2">
            <p className="text-xs font-medium">Points</p>
            <p className="text-sm font-bold">{user.points || 0}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-2">
            <p className="text-xs font-medium">Reviews</p>
            <p className="text-sm font-bold">{user.stats?.totalReviews || 0}</p>
          </div>
        </div>
      </div>

      {/* Most Reacted Entity */}
      {userStats.mostReactedEntity && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1 bg-green-100 rounded">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <h4 className="font-semibold text-sm text-gray-900">Your Top Entity</h4>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm mb-1">
              {userStats.mostReactedEntity.name}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {userStats.mostReactedEntity.category}
              </span>
              <span className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{userStats.mostReactedEntity.reactions} reactions</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Most Reacted Review */}
      {userStats.mostReactedReview && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-1 bg-yellow-100 rounded">
              <Award className="h-4 w-4 text-yellow-600" />
            </div>
            <h4 className="font-semibold text-sm text-gray-900">Popular Review</h4>
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
              {userStats.mostReactedReview.title}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="text-gray-500">
                {userStats.mostReactedReview.entityName}
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="h-3 w-3" />
                <span>{userStats.mostReactedReview.reactions} reactions</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center space-x-2 mb-3">
          <div className="p-1 bg-purple-100 rounded">
            <Activity className="h-4 w-4 text-purple-600" />
          </div>
          <h4 className="font-semibold text-sm text-gray-900">This Week</h4>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Reviews written</span>
            <span className="text-sm font-medium text-gray-900">
              {userStats.recentActivity.reviews}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Reactions given</span>
            <span className="text-sm font-medium text-gray-900">
              {userStats.recentActivity.reactions}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Comments posted</span>
            <span className="text-sm font-medium text-gray-900">
              {userStats.recentActivity.comments}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedLeftPanelCards;