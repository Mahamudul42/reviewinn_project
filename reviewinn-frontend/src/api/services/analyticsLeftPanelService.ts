import { httpClient } from '../httpClient';

export interface AnalyticsReview {
  review_id: number;
  title: string;
  content: string;
  overall_rating: number;
  view_count: number;
  reaction_count: number;
  comment_count: number;
  engagement_score: number;
  top_reactions: Record<string, number>;
  created_at: string;
  entity: {
    name: string;
    avatar: string;
    entity_id: number;
    is_claimed: boolean;
    view_count: number;
    description: string;
    is_verified: boolean;
    review_count: number;
    root_category?: {
      id: number;
      icon: string;
      name: string;
      slug: string;
      color: string | null;
      level: number;
    };
    average_rating: number;
    final_category?: {
      id: number;
      icon: string;
      name: string;
      slug: string;
      color: string | null;
      level: number;
    };
  };
  user: {
    name: string;
    level: number;
    avatar: string | null;
    user_id: number;
    username: string;
    is_verified: boolean;
  };
}

export interface AnalyticsCategory {
  category: {
    id: number;
    icon: string;
    name: string;
    slug: string;
  };
  review_count: number;
  avg_rating: number;
}

export interface AnalyticsReviewer {
  user_id: number;
  name: string;
  username: string;
  avatar: string | null;
  review_count: number;
  level: number;
  points: number;
  is_verified: boolean;
}

export interface AnalyticsLeftPanelData {
  top_reviews: AnalyticsReview[];
  top_categories: AnalyticsCategory[];
  top_reviewers: AnalyticsReviewer[];
}

export interface AnalyticsLeftPanelResponse {
  success: boolean;
  data: AnalyticsLeftPanelData;
  message: string;
}

/**
 * Analytics Left Panel Service
 * Independent service for analytics-based left panel data
 * Can be used across any page without dependencies
 */
export class AnalyticsLeftPanelService {
  private baseUrl = `http://localhost:8000/api/v1/homepage`;

  /**
   * Get analytics-based left panel data
   * Returns top reviews, categories, and reviewers based on analytics metrics
   */
  async getAnalyticsData(): Promise<AnalyticsLeftPanelData> {
    try {
      const url = `${this.baseUrl}/test_left_panel`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.statusText}`);
      }

      const result: AnalyticsLeftPanelResponse = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      } else {
        throw new Error(result.message || 'API returned error');
      }
    } catch (error) {
      console.error('AnalyticsLeftPanelService: Failed to fetch data:', error);
      throw error;
    }
  }

  /**
   * Transform API review data to frontend format for compatibility
   * Maintains consistency with existing review interfaces
   */
  transformReviewToFrontend(apiReview: AnalyticsReview) {
    return {
      id: apiReview.review_id.toString(),
      review_id: apiReview.review_id,
      title: apiReview.title,
      content: apiReview.content,
      overall_rating: apiReview.overall_rating,
      view_count: apiReview.view_count,
      reaction_count: apiReview.reaction_count,
      comment_count: apiReview.comment_count,
      engagement_score: apiReview.engagement_score,
      top_reactions: apiReview.top_reactions,
      created_at: apiReview.created_at,
      entity: {
        id: apiReview.entity.entity_id.toString(),
        entity_id: apiReview.entity.entity_id,
        name: apiReview.entity.name,
        avatar: apiReview.entity.avatar,
        description: apiReview.entity.description,
        is_verified: apiReview.entity.is_verified,
        is_claimed: apiReview.entity.is_claimed,
        average_rating: apiReview.entity.average_rating,
        review_count: apiReview.entity.review_count,
        view_count: apiReview.entity.view_count,
        root_category: apiReview.entity.root_category,
        final_category: apiReview.entity.final_category,
      },
      user: {
        id: apiReview.user.user_id.toString(),
        user_id: apiReview.user.user_id,
        name: apiReview.user.name,
        username: apiReview.user.username,
        avatar: apiReview.user.avatar,
        level: apiReview.user.level,
        is_verified: apiReview.user.is_verified,
      }
    };
  }
}

// Export singleton instance
export const analyticsLeftPanelService = new AnalyticsLeftPanelService();