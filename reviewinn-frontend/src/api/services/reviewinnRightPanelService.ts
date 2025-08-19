import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';
import { createAuthenticatedRequestInit } from '../../shared/utils/auth';

// Types for right panel data
export interface NewEntity {
  id: number;
  name: string;
  category: string;
  days_since_added: number;
  review_count: number;
  is_verified: boolean;
}

export interface PopularEntity {
  id: number;
  name: string;
  category: string;
  popularity_score: number;
  recent_reviews_count: number;
}

export interface ActivitySummary {
  total_users: number;
  active_reviewers: number;
  recent_activity_count: number;
  top_categories: string[];
}

// Public data interface (for non-authenticated users)
export interface ReviewInnRightPanelPublicData {
  new_entities: NewEntity[];
  popular_entities: PopularEntity[];
  activity_summary: ActivitySummary;
  success: boolean;
  message: string;
}

// Authenticated data interfaces
export interface UserProgress {
  points: number;
  level: number;
  daily_streak: number;
  progress_to_next_level: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  points_reward: number;
}

export interface WeeklyData {
  day: string;
  value: number;
}

export interface ReviewInnRightPanelAuthData {
  user_progress: UserProgress;
  badges: Badge[];
  daily_tasks: DailyTask[];
  weekly_chart: WeeklyData[];
  session_duration: string;
  success: boolean;
  message: string;
}

// Legacy support
export type ReviewInnRightPanelData = ReviewInnRightPanelPublicData;

class ReviewInnRightPanelService {
  private baseUrl = `http://localhost:8000/api/v1/reviewinn-right-panel`;

  /**
   * Get public right panel data - trending topics, popular entities, activity summary
   */
  async getPublicData(): Promise<ReviewInnRightPanelPublicData> {
    try {
      const url = `${this.baseUrl}/`;
      
      const response = await httpClient.get<ReviewInnRightPanelPublicData>(url);
      
      if (response.success) {
        // Backend returns data directly in response, not in response.data
        const data = response.data || response;
        return {
          type: 'public',
          new_entities: data.new_entities || [],
          popular_entities: data.popular_entities || [],
          activity_summary: data.activity_summary || {},
          success: true,
          message: data.message || 'Public right panel data loaded successfully'
        };
      } else {
        throw new Error(response.message || 'API returned error');
      }
    } catch (error) {
      console.error('ReviewInnRightPanelService: Failed to fetch data:', error);
      throw error;
    }
  }

  /**
   * Get authenticated right panel data - user progress, badges, missions, etc.
   */
  async getAuthenticatedData(): Promise<ReviewInnRightPanelAuthData> {
    try {
      const url = `${this.baseUrl}/authenticated`;
      
      const response = await httpClient.get<ReviewInnRightPanelAuthData>(url);
      
      if (response.success) {
        // Backend returns data directly in response, not in response.data
        const data = response.data || response;
        return data;
      } else {
        throw new Error(response.message || 'API returned error');
      }
    } catch (error) {
      console.error('ReviewInnRightPanelService: Failed to fetch authenticated data:', error);
      throw error;
    }
  }

  /**
   * Get unified right panel data - automatically returns appropriate data based on auth status
   */
  /**
   * Get unified data based on authentication status passed from component
   */
  async getUnifiedData(isAuthenticated: boolean): Promise<any> {
    try {
      console.log('🔍 getUnifiedData called with isAuthenticated:', isAuthenticated);
      
      if (isAuthenticated) {
        console.log('🔐 User is authenticated, fetching authenticated data');
        try {
          const authData = await this.getAuthenticatedData();
          console.log('✅ Successfully got authenticated data:', authData);
          return {
            type: 'authenticated',
            ...authData
          };
        } catch (error) {
          console.warn('⚠️ Failed to get authenticated data, falling back to public', error);
          // Fallback to public data if auth fails
          return await this.getPublicData();
        }
      } else {
        console.log('👤 User not authenticated, fetching public data');
        // User is not authenticated, get public data
        return await this.getPublicData();
      }
    } catch (error) {
      console.error('❌ Error fetching unified right panel data:', error);
      throw error;
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async getRightPanelData(): Promise<ReviewInnRightPanelData> {
    return this.getPublicData();
  }

  /**
   * Health check for right panel service
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await httpClient.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('Error checking right panel service health:', error);
      throw error;
    }
  }

  /**
   * Get formatted new entities for display
   */
  formatNewEntities(entities: NewEntity[]): Array<{
    id: number;
    name: string;
    category: string;
    timeAgo: string;
    reviewCount: number;
    badge: string;
    isVerified: boolean;
  }> {
    return entities.map(entity => ({
      id: entity.id,
      name: entity.name,
      category: entity.category,
      timeAgo: entity.days_since_added === 0 ? 'Today' : 
               entity.days_since_added === 1 ? '1 day ago' :
               `${entity.days_since_added} days ago`,
      reviewCount: entity.review_count,
      badge: entity.review_count === 0 ? '🆕 New' : 
             entity.review_count <= 3 ? '✨ Needs Reviews' : 
             '📈 Growing',
      isVerified: entity.is_verified
    }));
  }

  /**
   * Get formatted popular entities for display
   */
  formatPopularEntities(entities: PopularEntity[]): Array<{
    id: number;
    name: string;
    category: string;
    rating: number;
    reviews: string;
    badge: string;
  }> {
    return entities.map(entity => {
      const rating = typeof entity.popularity_score === 'number' 
        ? entity.popularity_score 
        : parseFloat(entity.popularity_score || 0);
      
      return {
        id: entity.id,
        name: entity.name,
        category: entity.category,
        rating: rating,
        reviews: `${entity.recent_reviews_count} recent reviews`,
        badge: rating >= 4.5 ? '⭐ Popular' : '👍 Good'
      };
    });
  }

  /**
   * Get activity summary stats
   */
  formatActivitySummary(summary: ActivitySummary): {
    stats: Array<{ label: string; value: string; icon: string }>;
    categories: string[];
  } {
    return {
      stats: [
        {
          label: 'Total Users',
          value: summary.total_users.toLocaleString(),
          icon: '👥'
        },
        {
          label: 'Active Reviewers',
          value: summary.active_reviewers.toLocaleString(),
          icon: '✍️'
        },
        {
          label: 'Recent Activity',
          value: summary.recent_activity_count.toString(),
          icon: '📊'
        }
      ],
      categories: summary.top_categories
    };
  }
}

// Export singleton instance
export const reviewinnRightPanelService = new ReviewInnRightPanelService();