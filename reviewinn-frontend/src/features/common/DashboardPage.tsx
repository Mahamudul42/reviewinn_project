import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { TrendingUp, Star, Target, Eye, Heart, MessageCircle } from 'lucide-react';
import { entityService, reviewService } from '../../api/services';
import StatCard from '../../shared/atoms/StatCard';
import ProgressBar from '../../shared/atoms/ProgressBar';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import type { Review, Entity } from '../../types';
// Removed mockUsers import - using real user data now

const DashboardPage: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [isLoading, setIsLoading] = useState(false);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  
  // Get current user from unified authentication
  const { user: currentUser } = useUnifiedAuth();
  
  // Mock dashboard data
  const dashboardStats = {
    totalReviews: 47,
    totalLikes: 892,
    totalFollowers: 156,
    averageRating: 4.2,
    weeklyGrowth: 12.5,
    monthlyGoal: 75,
    currentProgress: 62,
    totalViews: 2340,
    totalComments: 89
  };

  const recentAchievements = [
    { id: 1, title: 'Review Master', description: 'Wrote 10 reviews this month', icon: '🏆', date: '2 days ago', color: 'bg-yellow-100 text-yellow-800' },
    { id: 2, title: 'Helpful Reviewer', description: 'Received 50+ helpful votes', icon: '👍', date: '1 week ago', color: 'bg-green-100 text-green-800' },
    { id: 3, title: 'Community Builder', description: 'Gained 25 new followers', icon: '👥', date: '2 weeks ago', color: 'bg-blue-100 text-blue-800' }
  ];


  const weeklyData = [
    { day: 'Mon', reviews: 3, likes: 45, views: 120 },
    { day: 'Tue', reviews: 2, likes: 38, views: 95 },
    { day: 'Wed', reviews: 5, likes: 67, views: 180 },
    { day: 'Thu', reviews: 1, likes: 23, views: 65 },
    { day: 'Fri', reviews: 4, likes: 52, views: 140 },
    { day: 'Sat', reviews: 6, likes: 89, views: 220 },
    { day: 'Sun', reviews: 2, likes: 34, views: 85 }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [reviews, entityResult] = await Promise.all([
          reviewService.getRecentReviews(5),
          entityService.getEntities({ limit: 100 })
        ]);
        setRecentReviews(Array.isArray(reviews) ? reviews : []);
        setEntities(Array.isArray(entityResult.entities) ? entityResult.entities : []);
      } catch (e) {
        console.error('Failed to fetch dashboard data:', e);
        setRecentReviews([]);
        setEntities([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTimeframeChange = (timeframe: 'week' | 'month' | 'year') => {
    setSelectedTimeframe(timeframe);
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <ThreePanelLayout
      pageTitle="📊 Dashboard"
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Quick Actions & Stats"
      centerPanelWidth="700px"
      headerGradient="from-emerald-600 via-green-600 to-teal-800"
      centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      variant="full-width"
    >
      {/* Dashboard Middle Panel Content */}
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Welcome back, User! Here's your activity overview.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex bg-white rounded-lg shadow-sm border">
              {(['week', 'month', 'year'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => handleTimeframeChange(timeframe)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedTimeframe === timeframe
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
              <StatCard
                label="Total Reviews"
                value={dashboardStats.totalReviews}
                className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
              />
              <StatCard
                label="Total Likes"
                value={dashboardStats.totalLikes}
                className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
              />
              <StatCard
                label="Followers"
                value={dashboardStats.totalFollowers}
                className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
              />
              <StatCard
                label="Avg Rating"
                value={`${dashboardStats.averageRating}/5`}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200"
              />
              <StatCard
                label="Total Views"
                value={dashboardStats.totalViews}
                className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Charts and Analytics */}
              <div className="lg:col-span-2 space-y-8">
                {/* Weekly Activity Chart */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Weekly Activity</h2>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="space-y-4">
                    {weeklyData.map((day) => (
                      <div key={day.day} className="flex items-center space-x-4">
                        <div className="w-12 text-sm font-medium text-gray-600">{day.day}</div>
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div 
                            className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(day.reviews / 6) * 100}%` }}
                          />
                        </div>
                        <div className="w-16 text-sm text-gray-600 text-right">
                          {day.reviews} reviews
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentReviews && recentReviews.length > 0 ? (
                      recentReviews.map((review) => {
                        const entity = entities.find(e => e.id === review?.entityId);
                        return (
                          <div key={review?.id || Math.random()} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Star className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">You reviewed {entity?.name || 'Unknown Entity'}</p>
                              <p className="text-sm text-gray-600">{review?.createdAt || 'Unknown date'}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < (review?.overallRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Star className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No recent reviews yet</p>
                        <p className="text-gray-400 text-xs mt-1">Your recent review activity will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Goals and Missions */}
              <div className="space-y-8">
                {/* Monthly Goal Progress */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Monthly Goal</h2>
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{dashboardStats.currentProgress}/{dashboardStats.monthlyGoal}</span>
                    </div>
                    <ProgressBar 
                      value={(dashboardStats.currentProgress / dashboardStats.monthlyGoal) * 100}
                      className="h-3"
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    {dashboardStats.monthlyGoal - dashboardStats.currentProgress} more reviews to reach your goal!
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Stats</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Eye className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Profile Views</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">234</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Heart className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Likes Received</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">892</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium text-gray-900">Comments</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">89</span>
                    </div>
                  </div>
                </div>

                {/* Recent Achievements */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Achievements</h2>
                  <div className="space-y-4">
                    {recentAchievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{achievement.title}</p>
                          <p className="text-sm text-gray-600">{achievement.description}</p>
                          <p className="text-xs text-gray-500">{achievement.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Write a Review
                    </button>
                    <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
                      Add New Entity
                    </button>
                    <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
    </ThreePanelLayout>
  );
};

export default DashboardPage; 