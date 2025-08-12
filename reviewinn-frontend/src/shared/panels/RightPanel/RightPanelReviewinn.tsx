import React from 'react';
import { Star, TrendingUp, Crown, MessageCircle, Activity } from 'lucide-react';
import { useReviewinnRightPanelSingle } from '../../../hooks/useReviewinnRightPanelSingle';
import { reviewinnRightPanelService } from '../../../api/services';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import LegalInformationCard from '../../components/LegalInformationCard';
import PlatformPoliciesCard from '../../components/PlatformPoliciesCard';
import UserProfileCard from '../../molecules/UserProfileCard';
import ProgressSection from '../../molecules/ProgressSection';
import BadgeDisplay from '../../molecules/BadgeDisplay';
import DailyMissions from '../../molecules/DailyMissions';
import WhatsNext from '../../molecules/WhatsNext';
import WeeklyChart from '../../molecules/WeeklyChart';
import { PANEL_STYLES } from '../styles';
import PanelHeader from '../components/PanelHeader';
import PanelLoadingState from '../components/PanelLoadingState';

interface RightPanelReviewinnProps {
  className?: string;
}

/**
 * Enhanced ReviewInn Right Panel
 * Shows authenticated user data (profile, progress, badges, missions) or public data (trending, popular entities)
 * Uses unified endpoint that automatically returns appropriate data based on authentication
 */
const RightPanelReviewinn: React.FC<RightPanelReviewinnProps> = ({ 
  className = ""
}) => {
  const { user } = useUnifiedAuth();
  const { data, loading, error, isAuthenticated, refetch } = useReviewinnRightPanelSingle();

  const handleReview = () => {
    console.log('Review button clicked');
  };

  const getSessionDuration = () => {
    return data?.session_duration || 'Active now';
  };

  const userName = user?.name || user?.username || 'User';
  const userUsername = user?.username || '';

  // Show loading state
  if (loading) {
    return (
      <PanelLoadingState
        title={data?.type === 'authenticated' ? "Your Progress" : "ReviewInn Insights"}
        subtitle={data?.type === 'authenticated' ? "Loading your achievements..." : "Loading trending content and platform stats..."}
        cardCount={6}
        className={className}
      />
    );
  }

  // Show error state
  if (error && !data) {
    return (
      <div className={`space-y-4 ${className}`}>
        <PanelHeader
          title="ReviewInn Panel"
          subtitle={error}
        />
        <div className={PANEL_STYLES.cardWrapper}>
          <div className={`${PANEL_STYLES.cardBg} p-4 text-center`}>
            <div className="text-6xl mb-4">🔌</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Service Unavailable</h3>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button 
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
        <LegalInformationCard cardBg={PANEL_STYLES.cardBg} />
        <PlatformPoliciesCard cardBg={PANEL_STYLES.cardBg} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`space-y-4 ${className}`}>
        <PanelHeader
          title="ReviewInn Panel"
          subtitle="No data available"
        />
        <LegalInformationCard cardBg={PANEL_STYLES.cardBg} />
        <PlatformPoliciesCard cardBg={PANEL_STYLES.cardBg} />
      </div>
    );
  }

  // Authenticated version - show gamification content like homepage
  if (data.type === 'authenticated') {
    return (
      <div className={`space-y-4 ${className}`}>
        <PanelHeader
          title="Your Progress"
          subtitle="Track your achievements and level up"
        />

        <div className={PANEL_STYLES.cardWrapper}>
          <UserProfileCard
            name={userName}
            username={userUsername}
            level={data.user_progress.level}
            dailyStreak={data.user_progress.daily_streak}
            getSessionDuration={getSessionDuration}
            badges={data.badges}
            points={data.user_progress.points}
          />
        </div>

        <div className={PANEL_STYLES.cardWrapper}>
          <ProgressSection
            points={data.user_progress.points}
            level={data.user_progress.level}
            dailyStreak={data.user_progress.daily_streak}
            progressToNextLevel={data.user_progress.progress_to_next_level}
            handleReview={handleReview}
          />
        </div>

        <div className={PANEL_STYLES.cardWrapper}>
          <BadgeDisplay badges={data.badges} />
        </div>

        <div className={PANEL_STYLES.cardWrapper}>
          <DailyMissions dailyTasks={data.daily_tasks} />
        </div>

        <div className={PANEL_STYLES.cardWrapper}>
          <WhatsNext />
        </div>

        <div className={PANEL_STYLES.cardWrapper}>
          <div className={`${PANEL_STYLES.cardBg} p-4 rounded-lg`}>
            <h3 className="font-semibold text-gray-900 mb-3">Weekly Activity</h3>
            <div className="h-32">
              <WeeklyChart weeklyData={data.weekly_chart} showBorder={false} />
            </div>
          </div>
        </div>

        <LegalInformationCard cardBg={PANEL_STYLES.cardBg} />
        <PlatformPoliciesCard cardBg={PANEL_STYLES.cardBg} />
      </div>
    );
  }

  // Public version - show new entities, popular entities and platform activity
  // Format public data using service formatters
  const formattedNewEntities = reviewinnRightPanelService.formatNewEntities(data.new_entities || []);
  const formattedPopularEntities = reviewinnRightPanelService.formatPopularEntities(data.popular_entities || []);
  const formattedActivitySummary = reviewinnRightPanelService.formatActivitySummary(data.activity_summary || {
    total_users: 0,
    active_reviewers: 0,
    recent_activity_count: 0,
    top_categories: []
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <PanelHeader
        title="ReviewInn Insights"
        subtitle="New verified entities, popular businesses & platform stats"
      />

      {/* New Verified Entities */}
      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4`}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-green-600" />
            ✨ New Verified Entities
          </h3>
          <div className="space-y-3">
            {formattedNewEntities.length > 0 ? formattedNewEntities.map((entity) => (
              <div key={entity.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:border-green-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-1.5 rounded-lg shadow-sm relative">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&background=10b981&color=ffffff&size=40&rounded=true`}
                        alt={entity.name}
                        className="w-10 h-10 rounded-lg object-cover border border-white shadow-sm"
                      />
                      {entity.isVerified && (
                        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{entity.name}</h4>
                    
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-full">
                        {entity.category}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 border border-green-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-400 to-green-500 text-green-900 rounded-full shadow-sm">
                          <span className="text-xs font-bold">{entity.badge}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm">
                          <MessageCircle className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            {entity.reviewCount} review{entity.reviewCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full font-medium">
                          {entity.timeAgo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🏗️</div>
                <p className="text-sm text-gray-600">No new verified entities yet</p>
                <p className="text-xs text-gray-500 mt-1">Check back soon for new businesses!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Entities */}
      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4`}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            ⭐ Popular Entities
          </h3>
          <div className="space-y-3">
            {formattedPopularEntities.map((entity) => (
              <div key={entity.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:border-yellow-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-1.5 rounded-lg shadow-sm">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&background=10b981&color=ffffff&size=40&rounded=true`}
                        alt={entity.name}
                        className="w-10 h-10 rounded-lg object-cover border border-white shadow-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{entity.name}</h4>
                    
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full">
                        {entity.category}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-2 border border-yellow-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full shadow-sm">
                          <div className="flex items-center">
                            {Array.from({ length: 5 }, (_, starIndex) => {
                              const starValue = starIndex + 1;
                              const isFilled = starValue <= entity.rating;
                              
                              return (
                                <span
                                  key={starValue}
                                  className="text-xs"
                                  style={{
                                    filter: isFilled ? 'none' : 'grayscale(100%) opacity(0.3)',
                                  }}
                                >
                                  ⭐
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-xs font-bold text-yellow-900 ml-1">{typeof entity.rating === 'number' ? entity.rating.toFixed(1) : parseFloat(entity.rating || 0).toFixed(1)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-sm">
                          <MessageCircle className="w-3 h-3" />
                          <span className="text-xs font-medium">{entity.reviews}</span>
                        </div>
                        
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                          {entity.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Activity Summary */}
      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4`}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            📊 Platform Activity
          </h3>
          
          {/* Stats */}
          <div className="space-y-3 mb-4">
            {formattedActivitySummary.stats.map((stat, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stat.icon}</span>
                    <span className="font-medium text-gray-900 text-sm">{stat.label}</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Top Categories */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Top Categories</h4>
            <div className="flex flex-wrap gap-1.5">
              {formattedActivitySummary.categories.map((category, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Join Community Call-to-Action */}
      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4`}>
          <div className="text-center space-y-3">
            <div className="text-4xl">🚀</div>
            <h3 className="font-semibold text-gray-900">Join ReviewInn Community</h3>
            <p className="text-sm text-gray-600">
              Be part of our growing community of {formattedActivitySummary.stats[0].value}+ users sharing authentic reviews!
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  const event = new CustomEvent('openAuthModal', { detail: { mode: 'register' } });
                  window.dispatchEvent(event);
                }}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign Up
              </button>
              <button 
                onClick={() => {
                  const event = new CustomEvent('openAuthModal', { detail: { mode: 'login' } });
                  window.dispatchEvent(event);
                }}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      <LegalInformationCard cardBg={PANEL_STYLES.cardBg} />
      <PlatformPoliciesCard cardBg={PANEL_STYLES.cardBg} />
    </div>
  );
};

export default RightPanelReviewinn;