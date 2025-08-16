import { useState, useEffect, useCallback } from 'react';
import type { Badge, UserBadge, BadgeProgress, BadgeSystemStats } from '../types/badgeTypes';
import { badgeService } from '../services/badgeService';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';

export const useBadges = () => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [badgeStats, setBadgeStats] = useState<BadgeSystemStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all user badge data
  const loadUserBadges = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUserBadges([]);
      setBadgeProgress([]);
      setBadgeStats(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [badges, progress, stats] = await Promise.all([
        badgeService.getUserBadges(user.id),
        badgeService.getUserBadgeProgress(user.id),
        badgeService.getUserBadgeStats(user.id)
      ]);

      setUserBadges(badges);
      setBadgeProgress(progress);
      setBadgeStats(stats);
    } catch (err) {
      console.error('Failed to load user badges:', err);
      setError('Failed to load badges');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Check for new badges
  const checkForNewBadges = useCallback(async (actionType?: string): Promise<UserBadge[]> => {
    if (!isAuthenticated || !user?.id) return [];

    try {
      const newBadges = await badgeService.checkForNewBadges(user.id, actionType);
      
      if (newBadges.length > 0) {
        // Reload badge data to get updated information
        await loadUserBadges();
      }
      
      return newBadges;
    } catch (err) {
      console.error('Failed to check for new badges:', err);
      return [];
    }
  }, [isAuthenticated, user?.id, loadUserBadges]);

  // Unlock registration badge
  const unlockRegistrationBadge = useCallback(async (): Promise<UserBadge | null> => {
    if (!isAuthenticated || !user?.id) return null;

    try {
      const registrationBadge = await badgeService.unlockRegistrationBadge(user.id);
      
      if (registrationBadge) {
        // Reload badge data
        await loadUserBadges();
      }
      
      return registrationBadge;
    } catch (err) {
      console.error('Failed to unlock registration badge:', err);
      return null;
    }
  }, [isAuthenticated, user?.id, loadUserBadges]);

  // Update badge display preference
  const updateBadgeDisplay = useCallback(async (badgeId: string, isDisplayed: boolean): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) return false;

    try {
      const success = await badgeService.updateBadgeDisplay(user.id, badgeId, isDisplayed);
      
      if (success) {
        // Update local state
        setUserBadges(prev => prev.map(ub => 
          ub.badgeId === badgeId 
            ? { ...ub, isDisplayed } 
            : ub
        ));
      }
      
      return success;
    } catch (err) {
      console.error('Failed to update badge display:', err);
      return false;
    }
  }, [isAuthenticated, user?.id]);

  // Get badges near completion
  const getNearCompletionBadges = useCallback((): BadgeProgress[] => {
    return badgeProgress
      .filter(p => !p.isUnlocked && p.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);
  }, [badgeProgress]);

  // Get displayed badges (for UI)
  const getDisplayedBadges = useCallback((limit?: number): UserBadge[] => {
    const sortedBadges = [...userBadges].sort((a, b) => {
      // Sort by unlock date (newest first) if both displayed
      if (a.isDisplayed && b.isDisplayed) {
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      }
      
      // Displayed badges first
      if (a.isDisplayed && !b.isDisplayed) return -1;
      if (!a.isDisplayed && b.isDisplayed) return 1;
      
      return 0;
    });

    return limit ? sortedBadges.slice(0, limit) : sortedBadges;
  }, [userBadges]);

  // Load badges on mount
  useEffect(() => {
    loadUserBadges();
  }, [loadUserBadges]);

  return {
    // Data
    userBadges,
    badgeProgress,
    badgeStats,
    loading,
    error,
    
    // Computed values
    nearCompletionBadges: getNearCompletionBadges(),
    displayedBadges: getDisplayedBadges(),
    
    // Actions
    loadUserBadges,
    checkForNewBadges,
    unlockRegistrationBadge,
    updateBadgeDisplay,
    getDisplayedBadges,
    getNearCompletionBadges
  };
};

export default useBadges;