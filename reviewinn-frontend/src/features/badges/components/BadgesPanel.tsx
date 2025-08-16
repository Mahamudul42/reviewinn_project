import React, { useState, useEffect } from 'react';
import type { Badge, UserBadge, BadgeProgress, BadgeSystemStats } from '../types/badgeTypes';
import { badgeService } from '../services/badgeService';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import BadgeCard from './BadgeCard';
import BadgeNotification from './BadgeNotification';
import { BADGE_SYSTEM_RULES } from '../config/badgeDefinitions';

interface BadgesPanelProps {
  className?: string;
}

const BadgesPanel: React.FC<BadgesPanelProps> = ({ className = '' }) => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [badgeStats, setBadgeStats] = useState<BadgeSystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newBadgeNotification, setNewBadgeNotification] = useState<Badge | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserBadges();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  const loadUserBadges = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [badges, progress, stats] = await Promise.all([
        badgeService.getUserBadges(user.id),
        badgeService.getUserBadgeProgress(user.id),
        badgeService.getUserBadgeStats(user.id)
      ]);

      setUserBadges(badges);
      setBadgeProgress(progress);
      setBadgeStats(stats);
    } catch (error) {
      console.error('Failed to load user badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForNewBadges = async () => {
    if (!user?.id) return;

    try {
      const newBadges = await badgeService.checkForNewBadges(user.id);
      if (newBadges.length > 0) {
        // Show notification for the first new badge
        setNewBadgeNotification(newBadges[0].badge);
        // Reload badges to get updated list
        await loadUserBadges();
      }
    } catch (error) {
      console.error('Failed to check for new badges:', error);
    }
  };

  // Get displayed badges (recent + high rarity)
  const getDisplayedBadges = (): UserBadge[] => {
    if (showAllBadges) return userBadges;
    
    const sortedBadges = [...userBadges].sort((a, b) => {
      // Sort by rarity weight first, then by unlock date
      const rarityA = BADGE_SYSTEM_RULES.rarityWeights[a.badge.rarity];
      const rarityB = BADGE_SYSTEM_RULES.rarityWeights[b.badge.rarity];
      
      if (rarityA !== rarityB) {
        return rarityB - rarityA; // Higher rarity first
      }
      
      return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    });

    return sortedBadges.slice(0, BADGE_SYSTEM_RULES.maxDisplayedBadges);
  };

  // Get progress badges (near completion)
  const getProgressBadges = (): BadgeProgress[] => {
    return badgeProgress
      .filter(p => !p.isUnlocked && p.percentage >= 50)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);
  };

  if (!isAuthenticated) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Badge System</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sign up to start earning badges and showcase your achievements!
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openAuthModal'))}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const displayedBadges = getDisplayedBadges();
  const progressBadges = getProgressBadges();

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h3 className="text-lg font-semibold text-gray-900">Badges</h3>
            </div>
            <button
              onClick={() => setShowAllBadges(!showAllBadges)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAllBadges ? 'Show Less' : 'View All'}
            </button>
          </div>
          
          {/* Stats */}
          {badgeStats && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <span>{badgeStats.unlockedBadges}/{badgeStats.totalBadges}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${badgeStats.completionPercentage}%` }}
                />
              </div>
              <span>{Math.round(badgeStats.completionPercentage)}%</span>
            </div>
          )}
        </div>

        {/* Earned Badges */}
        <div className="p-4">
          {displayedBadges.length > 0 ? (
            <>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Badges</h4>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {displayedBadges.map(userBadge => (
                  <BadgeCard
                    key={userBadge.id}
                    badge={userBadge.badge}
                    userBadge={userBadge}
                    isUnlocked={true}
                    size="small"
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">🎯</div>
              <p className="text-sm text-gray-600">
                Start reviewing to earn your first badge!
              </p>
            </div>
          )}

          {/* Progress Badges */}
          {progressBadges.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-900 mb-3">In Progress</h4>
              <div className="space-y-2">
                {progressBadges.map(progress => (
                  <div key={progress.badgeId} className="p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{progress.badge.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-900">
                          {progress.badge.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {progress.currentValue}/{progress.targetValue}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(progress.percentage)}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${progress.percentage}%`,
                          backgroundColor: BADGE_SYSTEM_RULES.rarityColors[progress.badge.rarity]
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action Button */}
          <button
            onClick={checkForNewBadges}
            className="w-full mt-4 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            🔄 Check for New Badges
          </button>
        </div>
      </div>

      {/* Badge Notification */}
      {newBadgeNotification && (
        <BadgeNotification
          badge={newBadgeNotification}
          onClose={() => setNewBadgeNotification(null)}
        />
      )}
    </>
  );
};

export default BadgesPanel;