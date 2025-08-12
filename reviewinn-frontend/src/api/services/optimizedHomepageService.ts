import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';
import type { Review } from '../../types';

interface OptimizedHomepageResponse {
  success: boolean;
  data: any[];
  pagination: {
    limit: number;
    has_more: boolean;
    total: null;
  };
  message: string;
}

interface OptimizedHomepageData {
  reviews: Review[];
  hasMore: boolean;
}

// Optimized data transformation with memoization-friendly structure
const transformApiReview = (apiReview: any): Review => {
  return {
    id: apiReview.review_id.toString(),
    entityId: apiReview.entity?.entity_id?.toString() || '',
    reviewerId: apiReview.user?.user_id?.toString() || '',
    reviewerName: apiReview.user?.name || 'Anonymous',
    reviewerUsername: apiReview.user?.username,
    reviewerAvatar: apiReview.user?.avatar,
    userId: apiReview.user?.user_id?.toString(),
    title: apiReview.title || '',
    content: apiReview.content || '',
    overallRating: apiReview.overall_rating || 0,
    ratings: apiReview.ratings || {},
    criteria: apiReview.ratings || {},
    pros: apiReview.pros || [],
    cons: apiReview.cons || [],
    images: apiReview.images || [],
    isAnonymous: apiReview.is_anonymous || false,
    isVerified: apiReview.is_verified || false,
    view_count: apiReview.view_count || 0,
    total_reactions: apiReview.reaction_count || 0,
    comment_count: apiReview.comment_count || 0,
    commentCount: apiReview.comment_count || 0,
    reactions: apiReview.top_reactions || {},
    top_reactions: Object.keys(apiReview.top_reactions || {}),
    createdAt: apiReview.created_at,
    updatedAt: apiReview.updated_at,
    entity: {
      id: apiReview.entity?.entity_id?.toString() || '',
      name: apiReview.entity?.name || 'Unknown Entity',
      description: apiReview.entity?.description || '',
      avatar: apiReview.entity?.avatar,
      imageUrl: apiReview.entity?.imageUrl || apiReview.entity?.avatar,
      category: apiReview.entity?.root_category?.name,
      averageRating: apiReview.entity?.average_rating || 0,
      reviewCount: apiReview.entity?.review_count || 0,
      view_count: apiReview.entity?.view_count || 0,
      is_verified: apiReview.entity?.is_verified || false,
      is_claimed: apiReview.entity?.is_claimed || false,
      root_category: apiReview.entity?.root_category,
      final_category: apiReview.entity?.final_category,
      root_category_name: apiReview.entity?.root_category?.name,
      final_category_name: apiReview.entity?.final_category?.name,
      root_category_id: apiReview.entity?.root_category?.id,
      final_category_id: apiReview.entity?.final_category?.id,
    }
  };
};

class OptimizedHomepageService {
  /**
   * Fetch homepage data using the optimized single-table endpoint
   */
  async getHomepageReviews(limit: number = 15): Promise<OptimizedHomepageData> {
    try {
      const response = await httpClient.get<OptimizedHomepageResponse>(
        `${API_CONFIG.BASE_URL}/api/v1/homepage/test_home?limit=${limit}`
      );

      if (!response.data?.success) {
        throw new Error('Failed to fetch homepage data');
      }

      const transformedReviews = response.data.data.map(transformApiReview);

      return {
        reviews: transformedReviews,
        hasMore: response.data.pagination?.has_more || false
      };
    } catch (error) {
      console.error('Error fetching optimized homepage data:', error);
      throw error;
    }
  }

  /**
   * Load more reviews for pagination
   */
  async loadMoreReviews(currentCount: number, batchSize: number = 10): Promise<OptimizedHomepageData> {
    return this.getHomepageReviews(currentCount + batchSize);
  }

  /**
   * Refresh homepage data
   */
  async refreshHomepage(): Promise<OptimizedHomepageData> {
    return this.getHomepageReviews(15);
  }
}

// Export singleton instance
export const optimizedHomepageService = new OptimizedHomepageService();