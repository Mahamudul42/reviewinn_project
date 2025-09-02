import type { Badge, UserBadge, BadgeProgress, BadgeSystemStats } from '../types/badgeTypes';
import { BADGE_DEFINITIONS } from '../config/badgeDefinitions';
import { httpClient } from '../../../api/httpClient';
import { API_CONFIG } from '../../../api/config';

export class BadgeService {
  private baseUrl = `${API_CONFIG.BASE_URL}/badges`;

  constructor() {
    console.log('[BadgeService] Base URL:', this.baseUrl);
    console.log('[BadgeService] API_CONFIG:', API_CONFIG);
  }

  /**
   * Get all available badges
   */
  async getAllBadges(): Promise<Badge[]> {
    try {
      const response = await httpClient.get<Badge[]>(this.baseUrl, true);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch badges:', error);
      // Return default badges as fallback
      return this.getDefaultBadges();
    }
  }

  /**
   * Get user's badges
   */
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const response = await httpClient.get<UserBadge[]>(`${this.baseUrl}/user/${userId}`, true);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch user badges:', error);
      return [];
    }
  }

  /**
   * Get user's badge progress
   */
  async getUserBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    try {
      const response = await httpClient.get<BadgeProgress[]>(`${this.baseUrl}/user/${userId}/progress`, true);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch badge progress:', error);
      return [];
    }
  }

  /**
   * Get user's badge system stats
   */
  async getUserBadgeStats(userId: string): Promise<BadgeSystemStats> {
    try {
      const response = await httpClient.get<BadgeSystemStats>(`${this.baseUrl}/user/${userId}/stats`, true);
      return response.data || this.getDefaultStats();
    } catch (error) {
      console.error('Failed to fetch badge stats:', error);
      return this.getDefaultStats();
    }
  }

  /**
   * Check for new badges (triggered by user actions)
   */
  async checkForNewBadges(userId: string, actionType?: string): Promise<UserBadge[]> {
    try {
      const response = await httpClient.post<UserBadge[]>(
        `${this.baseUrl}/user/${userId}/check`,
        { actionType }
      );
      return response.data || [];
    } catch (error) {
      console.error('Failed to check for new badges:', error);
      return [];
    }
  }

  /**
   * Unlock initial registration badge
   */
  async unlockRegistrationBadge(userId: string): Promise<UserBadge | null> {
    try {
      const url = `${this.baseUrl}/user/${userId}/registration`;
      console.log('[BadgeService] Attempting to unlock registration badge at:', url);
      
      const response = await httpClient.post<UserBadge>(url, {});
      return response.data || null;
    } catch (error: any) {
      console.error('Failed to unlock registration badge:', error);
      console.error('Error details:', {
        url: `${this.baseUrl}/user/${userId}/registration`,
        baseUrl: this.baseUrl,
        userId
      });
      return null;
    }
  }

  /**
   * Update badge display preference
   */
  async updateBadgeDisplay(userId: string, badgeId: string, isDisplayed: boolean): Promise<boolean> {
    try {
      await httpClient.put(
        `${this.baseUrl}/user/${userId}/display`,
        { badgeId, isDisplayed }
      );
      return true;
    } catch (error) {
      console.error('Failed to update badge display:', error);
      return false;
    }
  }

  /**
   * Get badges near completion (80%+ progress)
   */
  async getNearCompletionBadges(userId: string): Promise<BadgeProgress[]> {
    try {
      const progress = await this.getUserBadgeProgress(userId);
      return progress.filter(p => !p.isUnlocked && p.percentage >= 80);
    } catch (error) {
      console.error('Failed to get near completion badges:', error);
      return [];
    }
  }

  /**
   * Get default badges (fallback)
   */
  private getDefaultBadges(): Badge[] {
    return BADGE_DEFINITIONS.map((badge, index) => ({
      ...badge,
      id: `badge_${index + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  /**
   * Get default stats (fallback)
   */
  private getDefaultStats(): BadgeSystemStats {
    return {
      totalBadges: BADGE_DEFINITIONS.length,
      unlockedBadges: 0,
      commonBadges: 0,
      rareBadges: 0,
      legendaryBadges: 0,
      completionPercentage: 0
    };
  }

  /**
   * Local badge checking (client-side validation)
   */
  calculateBadgeProgress(userStats: any, badge: Badge): number {
    const { requirements } = badge;
    
    switch (requirements.type) {
      case 'registration':
        return userStats.isRegistered ? 100 : 0;
      
      case 'reviews_count':
        const reviewCount = userStats.reviewsCount || 0;
        return Math.min((reviewCount / requirements.value) * 100, 100);
      
      case 'comments_count':
        const commentCount = userStats.commentsCount || 0;
        return Math.min((commentCount / requirements.value) * 100, 100);
      
      case 'helpful_votes':
        const helpfulVotes = userStats.helpfulVotes || 0;
        return Math.min((helpfulVotes / requirements.value) * 100, 100);
      
      case 'reactions_received':
        const reactions = userStats.reactionsReceived || 0;
        return Math.min((reactions / requirements.value) * 100, 100);
      
      case 'entities_reviewed':
        const entitiesCount = userStats.entitiesReviewed || 0;
        return Math.min((entitiesCount / requirements.value) * 100, 100);
      
      case 'consecutive_days':
        const streak = userStats.currentStreak || 0;
        return Math.min((streak / requirements.value) * 100, 100);
      
      case 'account_age':
        const accountAge = userStats.accountAgeDays || 0;
        return Math.min((accountAge / requirements.value) * 100, 100);
      
      case 'circle_members':
        const circleSize = userStats.circleMembers || 0;
        return Math.min((circleSize / requirements.value) * 100, 100);
      
      default:
        return 0;
    }
  }

  /**
   * Format badge notification message
   */
  formatBadgeNotification(badge: Badge): string {
    const rarityEmoji = {
      common: '🎉',
      uncommon: '✨',
      rare: '💎',
      epic: '🏆',
      legendary: '👑'
    };

    return `${rarityEmoji[badge.rarity]} Badge Unlocked: ${badge.name}! ${badge.description}`;
  }
}

export const badgeService = new BadgeService();