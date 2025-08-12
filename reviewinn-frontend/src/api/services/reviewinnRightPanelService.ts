import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';

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
  private readonly BASE_URL = `${API_CONFIG.BASE_URL}/reviewinn-right-panel`;

  /**
   * Get public right panel data - trending topics, popular entities, activity summary
   */
  async getPublicData(): Promise<ReviewInnRightPanelPublicData> {
    try {
      const url = `${this.BASE_URL}/public`;
      console.log('🌐 Making request to public endpoint:', url);
      
      const response = await httpClient.get<ReviewInnRightPanelPublicData>(url);
      console.log('📥 Public response received:', response);
      
      if (response.data) {
        console.log('✅ Returning public response.data:', response.data);
        return response.data;
      } else if (response.success && response.trending_topics) {
        console.log('✅ Returning public response directly:', response);
        return response as unknown as ReviewInnRightPanelPublicData;
      } else {
        console.error('❌ Invalid public response structure:', response);
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('❌ Error fetching public right panel data:', error);
      throw error;
    }
  }

  /**
   * Get authenticated right panel data - user progress, badges, missions, etc.
   */
  async getAuthenticatedData(): Promise<ReviewInnRightPanelAuthData> {
    try {
      const url = `${this.BASE_URL}/authenticated`;
      console.log('🌐 Making request to authenticated endpoint:', url);
      
      const response = await httpClient.get<ReviewInnRightPanelAuthData>(url, {
        requiresAuth: true
      });
      console.log('📥 Authenticated response received:', response);
      
      if (response.data) {
        console.log('✅ Returning authenticated response.data:', response.data);
        return response.data;
      } else if (response.success && response.user_progress) {
        console.log('✅ Returning authenticated response directly:', response);
        return response as unknown as ReviewInnRightPanelAuthData;
      } else {
        console.error('❌ Invalid authenticated response structure:', response);
        throw new Error('Invalid response structure');
      }
    } catch (error) {
      console.error('❌ Error fetching authenticated right panel data:', error);
      throw error;
    }
  }

  /**
   * Get unified right panel data - automatically returns appropriate data based on auth status
   */
  async getUnifiedData(): Promise<any> {
    try {
      const url = `${this.BASE_URL}/`;
      console.log('🌐 Making request to unified endpoint:', url);
      
      const response = await httpClient.get<any>(url, {
        requiresAuth: false // Let the backend decide based on auth header presence
      });
      console.log('📥 Unified response received:', response);
      
      if (response.data) {
        console.log('✅ Returning unified response.data:', response.data);
        return response.data;
      } else if (response.success) {
        console.log('✅ Returning unified response directly:', response);
        return response;
      } else {
        console.error('❌ Invalid unified response structure:', response);
        throw new Error('Invalid response structure');
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
      const response = await httpClient.get(`${this.BASE_URL}/health`);
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