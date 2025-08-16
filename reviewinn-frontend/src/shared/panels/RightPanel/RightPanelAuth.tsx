import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gamificationService } from '../../../api/services';
import type { GamificationDashboard, User } from '../../../types';
import LegalInformationCard from '../../components/LegalInformationCard';
import PlatformPoliciesCard from '../../components/PlatformPoliciesCard';
import UserProfileCard from '../../molecules/UserProfileCard';
import ProgressSection from '../../molecules/ProgressSection';
import BadgeDisplay from '../../molecules/BadgeDisplay';
import DailyMissions from '../../molecules/DailyMissions';
import WhatsNext from '../../molecules/WhatsNext';
import WeeklyChart from '../../molecules/WeeklyChart';
import BadgesPanel from '../../../features/badges/components/BadgesPanel';
import { PANEL_STYLES } from '../styles';
import PanelHeader from '../components/PanelHeader';
import PanelLoadingState from '../components/PanelLoadingState';

interface RightPanelAuthProps {
  className?: string;
  user: User;
  hideInternalLoading?: boolean;
}

/**
 * Authenticated version of the right panel
 * Shows gamification dashboard, progress tracking, and achievements for authenticated users
 */
const RightPanelAuth: React.FC<RightPanelAuthProps> = ({ 
  className = "",
  user,
  hideInternalLoading = false
}) => {
  const [dashboardData, setDashboardData] = useState<GamificationDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUserId = useRef<string | null>(null);

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
    const currentUserId = user?.id || null;
    
    // Only load if user ID changed
    if (lastUserId.current === currentUserId) {
      return;
    }
    
    console.log('RightPanelAuth: User changed:', { 
      userId: currentUserId,
      previousUserId: lastUserId.current
    });
    
    // Update ref
    lastUserId.current = currentUserId;
    
    // Reset state when switching users
    setError(null);
    setDashboardData(null);
    
    if (user) {
      console.log('RightPanelAuth: Loading authenticated data');
      loadAuthenticatedData();
    }
  }, [user?.id, loadAuthenticatedData, user]);

  // Enterprise-grade reactive auth state management
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      console.log('RightPanelAuth: Auth state changed', event.detail);
      if (event.detail?.isAuthenticated && user) {
        // Reload data when user becomes authenticated
        setTimeout(() => {
          loadAuthenticatedData();
        }, 200);
      }
    };

    const handleLoginSuccess = () => {
      console.log('RightPanelAuth: Login success detected, reloading data');
      if (user) {
        setTimeout(() => {
          loadAuthenticatedData();
        }, 300);
      }
    };

    const handleUserRegistered = (event: CustomEvent) => {
      console.log('RightPanelAuth: New user registered, reloading data', event.detail);
      if (user) {
        setTimeout(() => {
          loadAuthenticatedData();
        }, 500);
      }
    };

    // Add event listeners for reactive updates
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    window.addEventListener('loginSuccess', handleLoginSuccess as EventListener);
    window.addEventListener('userRegistered', handleUserRegistered as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('loginSuccess', handleLoginSuccess as EventListener);
      window.removeEventListener('userRegistered', handleUserRegistered as EventListener);
    };
  }, [user, loadAuthenticatedData]);

  const handleReview = () => {
    console.log('Review button clicked');
  };

  const getSessionDuration = () => {
    return dashboardData?.session_duration || 'Active now';
  };

  const userName = user?.name || user?.username || 'User';
  const userUsername = user?.username || '';

  // Show loading state - skip if hideInternalLoading is true
  if (loading && !hideInternalLoading) {
    return (
      <PanelLoadingState
        title="Your Progress"
        subtitle="Loading your achievements..."
        cardCount={6}
        className={className}
      />
    );
  }

  // Show error state
  if (error || !dashboardData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <PanelHeader
          title="Your Progress"
          subtitle={error || 'No data available'}
        />
        <div className={PANEL_STYLES.cardWrapper}>
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
        
        <LegalInformationCard cardBg={PANEL_STYLES.cardBg} />
        <PlatformPoliciesCard cardBg={PANEL_STYLES.cardBg} />
      </div>
    );
  }

  // Show loading state while dashboard data is loading - skip if hideInternalLoading is true
  if ((loading || !dashboardData || !dashboardData.user_progress) && !hideInternalLoading) {
    return (
      <PanelLoadingState
        title="Your Progress"
        subtitle="Track your achievements and level up"
        cardCount={6}
        className={className}
      />
    );
  }

  // Show authenticated dashboard
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
          level={dashboardData.user_progress.level || 1}
          dailyStreak={dashboardData.user_progress.daily_streak || 0}
          getSessionDuration={getSessionDuration}
          badges={dashboardData.badges || []}
          points={dashboardData.user_progress.points || 0}
        />
      </div>

      <div className={PANEL_STYLES.cardWrapper}>
        <ProgressSection
          points={dashboardData.user_progress.points || 0}
          level={dashboardData.user_progress.level || 1}
          dailyStreak={dashboardData.user_progress.daily_streak || 0}
          progressToNextLevel={dashboardData.user_progress.progress_to_next_level || 0}
          handleReview={handleReview}
        />
      </div>

      <div className={PANEL_STYLES.cardWrapper}>
        <BadgeDisplay badges={dashboardData.badges || []} />
      </div>

      {/* New Badge System */}
      <BadgesPanel className={PANEL_STYLES.cardWrapper} />

      <div className={PANEL_STYLES.cardWrapper}>
        <DailyMissions dailyTasks={dashboardData.daily_tasks || []} />
      </div>

      <div className={PANEL_STYLES.cardWrapper}>
        <WhatsNext />
      </div>

      <div className={PANEL_STYLES.cardWrapper}>
        <div className={`${PANEL_STYLES.cardBg} p-4 rounded-lg`}>
          <h3 className="font-semibold text-gray-900 mb-3">Weekly Activity</h3>
          <div className="h-32">
            <WeeklyChart weeklyData={dashboardData.weekly_chart} showBorder={false} />
          </div>
        </div>
      </div>

      <LegalInformationCard cardBg={PANEL_STYLES.cardBg} />
      <PlatformPoliciesCard cardBg={PANEL_STYLES.cardBg} />
    </div>
  );
};

export default RightPanelAuth;