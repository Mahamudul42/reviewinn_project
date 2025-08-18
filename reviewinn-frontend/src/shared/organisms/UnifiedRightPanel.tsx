import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Star, TrendingUp, Crown, MessageCircle } from 'lucide-react';
import { entityService, reviewService, gamificationService } from '../../api/services';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import type { Entity, Review, GamificationDashboard } from '../../types';
import LegalInformationCard from '../components/LegalInformationCard';
import PlatformPoliciesCard from '../components/PlatformPoliciesCard';
import UserProfileCard from '../molecules/UserProfileCard';
import ProgressSection from '../molecules/ProgressSection';
import BadgeDisplay from '../molecules/BadgeDisplay';
import DailyMissions from '../molecules/DailyMissions';
import WhatsNext from '../molecules/WhatsNext';
import WeeklyChart from '../molecules/WeeklyChart';
import { EmptyState, EmptyStateIcons } from '../components/EmptyState';
import StarRating from '../atoms/StarRating';

interface UnifiedRightPanelProps {
  className?: string;
}

const UnifiedRightPanel: React.FC<UnifiedRightPanelProps> = ({ 
  className = ""
}) => {
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const [featuredEntities, setFeaturedEntities] = useState<Entity[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [dashboardData, setDashboardData] = useState<GamificationDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUserId = useRef<string | null>(null);
  const lastLoadType = useRef<'authenticated' | 'public' | null>(null);

  const loadPublicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [entitiesResult, reviewsResult] = await Promise.all([
        entityService.getEntities({
          limit: 3,
          sortBy: 'rating',
          sortOrder: 'desc',
          hasReviews: true
        }).catch(() => ({ entities: [] })),
        reviewService.getReviews({
          page: 1,
          limit: 5,
          sortBy: 'created_at',
          sortOrder: 'desc'
        }).catch(() => ({ reviews: [] }))
      ]);

      if (entitiesResult?.entities) {
        setFeaturedEntities(entitiesResult.entities);
      }
      if (reviewsResult?.reviews) {
        setRecentReviews(reviewsResult.reviews);
      }
    } catch (error) {
      console.error('Failed to load public panel data:', error);
      setError('Failed to load community data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuthenticatedData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await gamificationService.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load gamification dashboard:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        console.warn('Unauthorized access to gamification API - user may need to re-authenticate');
        setError('Please log in to view your progress and achievements.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (err.response?.status === 404) {
        setError('No progress data found. Complete some activities to get started!');
      } else if (err.response?.data?.message && err.response.data.message.includes('Sign up or log in')) {
        setError('Please log in to view your personalized dashboard.');
      } else if (err.response?.status >= 500) {
        console.error('Server error when loading gamification dashboard');
        setError('Server temporarily unavailable. Please try again later.');
      } else {
        setError('Failed to load your progress data. Please try again.');
      }
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Don't load data if auth is still loading
    if (authLoading) {
      return;
    }
    
    const currentUserId = user?.id || null;
    const currentLoadType = user ? 'authenticated' : 'public';
    
    // Only load if user ID changed or load type changed
    if (lastUserId.current === currentUserId && lastLoadType.current === currentLoadType) {
      return;
    }
    
    console.log('UnifiedRightPanel: Auth state changed:', { 
      user: !!user,
      userId: currentUserId,
      loadType: currentLoadType,
      previousUserId: lastUserId.current,
      previousLoadType: lastLoadType.current
    });
    
    // Update refs
    lastUserId.current = currentUserId;
    lastLoadType.current = currentLoadType;
    
    // Reset state when switching auth modes
    setError(null);
    setDashboardData(null);
    setFeaturedEntities([]);
    setRecentReviews([]);
    
    if (user) {
      console.log('UnifiedRightPanel: Loading authenticated data');
      loadAuthenticatedData();
    } else {
      console.log('UnifiedRightPanel: Loading public data');
      loadPublicData();
    }
  }, [authLoading, isAuthenticated, user?.id, loadPublicData, loadAuthenticatedData]);

  const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300";
  const cardWrapper = "p-4 shadow-md rounded-lg bg-white";

  const handleReview = () => {
    console.log('Review button clicked');
  };

  const getSessionDuration = () => {
    return dashboardData?.session_duration || 'Active now';
  };

  const userName = user?.name || user?.username || 'User';
  const userUsername = user?.username || '';

  // Show loading state while auth is initializing to prevent flashing
  if (authLoading || loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="pb-4 bg-transparent">
          <h2 className="text-xl font-bold text-gray-900">
            {user ? 'Your Progress' : 'Community Highlights'}
          </h2>
          <p className="text-sm text-gray-600">
            {authLoading ? 'Initializing...' : user ? 'Loading your achievements...' : 'Loading community insights...'}
          </p>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`p-4 shadow-md rounded-lg ${cardBg} animate-pulse`}>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (user) {
    // Authenticated version - show gamification content
    if (error || !dashboardData) {
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="pb-4 bg-transparent">
            <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
            <p className="text-sm text-red-600">{error || 'No data available'}</p>
          </div>
          <div className={`p-4 shadow-md rounded-lg ${cardBg}`}>
            <div className="text-center py-8">
              {error?.includes('No progress data found') ? (
                <>
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Your Journey</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Write your first review or interact with the platform to unlock your progress dashboard!
                  </p>
                  <button 
                    onClick={() => window.location.href = '/'} 
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Get Started
                  </button>
                </>
              ) : error?.includes('log in') ? (
                <>
                  <div className="text-6xl mb-4">🔐</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Sign In Required</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign in to view your personalized progress, badges, and daily missions.
                  </p>
                  <button 
                    onClick={() => {
                      const authModal = document.querySelector('[data-auth-modal]') as HTMLElement;
                      if (authModal) {
                        authModal.click();
                      }
                    }} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🔌</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Database Connection Required</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Connect to PostgreSQL database to view your progress, badges, and daily missions.
                  </p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Retry Connection
                  </button>
                </>
              )}
            </div>
          </div>
          
          <LegalInformationCard cardBg={cardBg} />
          <PlatformPoliciesCard cardBg={cardBg} />
        </div>
      );
    }

    // Show loading state while dashboard data is loading
    if (loading || !dashboardData || !dashboardData.user_progress) {
      return (
        <div className={`space-y-4 ${className}`}>
          <div className="pb-4 bg-transparent">
            <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
            <p className="text-sm text-gray-600">Track your achievements and level up</p>
          </div>
          <div className={cardWrapper}>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${className}`}>
        <div className="pb-4 bg-transparent">
          <h2 className="text-xl font-bold text-gray-900">Your Progress</h2>
          <p className="text-sm text-gray-600">Track your achievements and level up</p>
        </div>

        <div className={cardWrapper}>
          <UserProfileCard
            name={userName}
            username={userUsername}
            level={dashboardData.user_progress.level || 1}
            dailyStreak={dashboardData.user_progress.daily_streak || 0}
            getSessionDuration={getSessionDuration}
            badges={dashboardData.badges || []}
            points={dashboardData.user_progress.points || 0}
          />
        </div>

        <div className={cardWrapper}>
          <ProgressSection
            points={dashboardData.user_progress.points || 0}
            level={dashboardData.user_progress.level || 1}
            dailyStreak={dashboardData.user_progress.daily_streak || 0}
            progressToNextLevel={dashboardData.user_progress.progress_to_next_level || 0}
            handleReview={handleReview}
          />
        </div>

        <div className={cardWrapper}>
          <BadgeDisplay badges={dashboardData.badges || []} />
        </div>

        <div className={cardWrapper}>
          <DailyMissions dailyTasks={dashboardData.daily_tasks || []} />
        </div>

        <div className={cardWrapper}>
          <WhatsNext />
        </div>

        <div className={cardWrapper}>
          <div className={`${cardBg} p-4 rounded-lg`}>
            <h3 className="font-semibold text-gray-900 mb-3">Weekly Activity</h3>
            <div className="h-32">
              <WeeklyChart weeklyData={dashboardData.weekly_chart} showBorder={false} />
            </div>
          </div>
        </div>

        <LegalInformationCard cardBg={cardBg} />
        <PlatformPoliciesCard cardBg={cardBg} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="pb-4 bg-transparent">
        <h2 className="text-xl font-bold text-gray-900">Community Highlights</h2>
        <p className="text-sm text-gray-600">Discover what's trending in our community</p>
      </div>

      {/* Top Rated Entities */}
      <div className={cardWrapper}>
        <div className={`${cardBg} p-4`}>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            Top Rated Entities
          </h3>
          {!loading && featuredEntities.length === 0 ? (
            <EmptyState
              title="No entities yet"
              description="Be the first to add and review entities in our community!"
              icon={<EmptyStateIcons.Entities />}
              action={
                <button 
                  onClick={() => {
                    const event = new CustomEvent('openAuthModal', { detail: { mode: 'register' } });
                    window.dispatchEvent(event);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                >
                  Join Community
                </button>
              }
              className="py-8"
            />
          ) : (
            <div className="space-y-4">
              {featuredEntities.map((entity, index) => (
                <div key={entity.id || entity.entity_id || index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 hover:border-blue-300 overflow-hidden">
                  <div className="flex items-start gap-3">
                    {/* Enhanced Entity Image */}
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-1.5 rounded-lg shadow-sm">
                        <img 
                          src={entity.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(entity.name)}&background=10b981&color=ffffff&size=48&rounded=true`}
                          alt={entity.name}
                          className="w-12 h-12 rounded-lg object-cover border border-white shadow-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Entity Name */}
                      <h4 className="font-bold text-gray-900 text-sm truncate hover:text-blue-600 transition-colors cursor-pointer pr-2">{entity.name}</h4>
                      
                      {/* Enhanced Category Display */}
                      <div className="flex items-center gap-1 overflow-hidden">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm flex-shrink-0 max-w-full">
                          <span className="text-xs mr-1">📁</span>
                          <span className="capitalize truncate">{entity.category?.replace('_', ' ') || 'General'}</span>
                        </span>
                      </div>
                      
                      {/* Golden Star Rating */}
                      {entity.averageRating && entity.averageRating > 0 && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200 overflow-hidden">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full shadow-sm flex-shrink-0">
                              <StarRating 
                                rating={entity.averageRating} 
                                maxRating={5} 
                                size="xs" 
                                showValue={true} 
                                style="golden" 
                                className="scale-75"
                              />
                            </div>
                            
                            {/* Review Count */}
                            {entity.reviewCount && entity.reviewCount > 0 && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-sm flex-shrink-0">
                                <MessageCircle className="w-3 h-3 flex-shrink-0" />
                                <span className="text-xs font-semibold whitespace-nowrap">{entity.reviewCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Fallback for entities without ratings */}
                      {(!entity.averageRating || entity.averageRating === 0) && (
                        <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 overflow-hidden">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">No reviews yet</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Join Our Community */}
      <div className={cardWrapper}>
        <div className={`${cardBg} p-4`}>
          <div className="text-center space-y-3">
          <div className="text-4xl">🎯</div>
          <h3 className="font-semibold text-gray-900">Join Our Community</h3>
          <p className="text-sm text-gray-600">
            Sign up to track your progress, earn badges, and contribute to our growing community of reviewers!
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

      {/* Community Insights */}
      <div className={cardWrapper}>
        <div className={`${cardBg} p-4`}>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Community Insights
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Most active category</span>
            <span className="font-medium text-gray-900">Professionals</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Average rating</span>
            <div className="flex items-center">
              <span className="font-medium text-gray-900 mr-1">4.2</span>
              <StarRating 
                rating={1} 
                maxRating={1} 
                size="xs" 
                showValue={false} 
                style="golden" 
                className="scale-75"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span>Reviews this week</span>
            <span className="font-medium text-gray-900">127 📝</span>
          </div>
          <div className="flex items-center justify-between">
            <span>New members</span>
            <span className="font-medium text-gray-900">+24 👥</span>
          </div>
        </div>
        </div>
      </div>

      <LegalInformationCard cardBg={cardBg} />
      <PlatformPoliciesCard cardBg={cardBg} />
    </div>
  );
};

export default UnifiedRightPanel;