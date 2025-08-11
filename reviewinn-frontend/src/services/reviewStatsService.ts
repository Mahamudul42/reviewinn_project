import { reviewService, commentService } from '../api/services';
import { userInteractionService } from '../api/services/userInteractionService';
import type { Review } from '../types';

/**
 * Enhanced Review Stats Service
 * Provides comprehensive review data with reactions, comments, views, and user interactions
 * Can be used across Homepage, User Profile, and Entity Detail pages for consistency
 */
export class ReviewStatsService {
  // Minimal cache for 10M+ scale performance - only critical data
  private cache = new Map<string, {
    timestamp: number;
  }>();
  
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get reviews with complete stats for user profile - OPTIMIZED for scale
   * Single API call with all data included: reviews + entities + reactions + comments + views
   */
  async getUserReviewsWithStats(userId: string, params: {
    page?: number;
    limit?: number;
    includeAnonymous?: boolean;
  } = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    console.log('📊 ReviewStatsService: Fetching complete review data for userId:', userId, 'params:', params);
    
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('📊 ReviewStatsService: Invalid userId provided:', userId);
      return { reviews: [], total: 0, hasMore: false };
    }

    try {
      // Primary: Single optimized API call - backend should return everything
      const result = await reviewService.getReviewsByUser(userId, {
        page: params.page || 1,
        limit: params.limit || 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeAnonymous: params.includeAnonymous
      });

      console.log('📊 ReviewStatsService: Got reviews from reviewService:', {
        count: result.reviews.length,
        total: result.total,
        hasMore: result.hasMore,
        sampleReview: result.reviews[0] ? {
          id: result.reviews[0].id,
          title: result.reviews[0].title,
          entityName: result.reviews[0].entity?.name,
          hasUserReaction: !!result.reviews[0].user_reaction,
          userReaction: result.reviews[0].user_reaction,
          reactions: result.reviews[0].reactions
        } : null,
        userReactionsFound: result.reviews.filter((r: any) => r.user_reaction).length
      });

      // Single comprehensive API call already includes all data:
      // - Complete review data (title, rating, content, pros, cons)
      // - Complete entity data (name, categories, description, stats, image)
      // - Complete engagement data (reactions, comments, views, user_reaction)
      
      console.log('📊 ReviewStatsService: Processing comprehensive API response:', {
        reviewCount: result.reviews.length,
        sampleReview: result.reviews[0] ? {
          id: result.reviews[0].id,
          title: result.reviews[0].title,
          entityName: result.reviews[0].entity?.name,
          entityCategories: result.reviews[0].entity ? 
            `${result.reviews[0].entity.root_category} -> ${result.reviews[0].entity.final_category}` : 'No entity',
          engagementStats: {
            viewCount: result.reviews[0].view_count,
            totalReactions: result.reviews[0].total_reactions,
            commentCount: result.reviews[0].comment_count,
            userReaction: result.reviews[0].user_reaction
          },
          entityStats: result.reviews[0].entity ? {
            averageRating: result.reviews[0].entity.averageRating,
            reviewCount: result.reviews[0].entity.reviewCount,
            hasImage: result.reviews[0].entity.hasRealImage
          } : null
        } : null,
        reviewsWithUserReactions: result.reviews.filter((r: any) => r.user_reaction).length,
        reviewsWithEngagementStats: result.reviews.filter((r: any) => 
          (r.total_reactions > 0) || (r.comment_count > 0) || (r.view_count > 0)
        ).length
      });

      // Validate and ensure all comprehensive data is properly formatted
      const validatedReviews = this.validateComprehensiveReviewData(result.reviews);

      return {
        reviews: validatedReviews,
        total: result.total,
        hasMore: result.hasMore
      };
      
    } catch (error) {
      console.error('📊 ReviewStatsService: Error fetching reviews with reviewService:', error);
      
      // Minimal fallback for reliability: Still a single optimized API call
      try {
        console.log('📊 ReviewStatsService: Attempting reliability fallback with userService');
        const { userService } = await import('../api/services');
        const fallbackResult = await userService.getUserReviews(userId, {
          page: params.page || 1,
          limit: params.limit || 10,
          includeAnonymous: params.includeAnonymous
        });
        
        console.log('📊 ReviewStatsService: Reliability fallback succeeded with', fallbackResult.reviews.length, 'reviews');
        return fallbackResult;
      } catch (fallbackError) {
        console.error('📊 ReviewStatsService: Fallback also failed:', fallbackError);
        return { reviews: [], total: 0, hasMore: false };
      }
    }
  }

  /**
   * Get reviews with complete stats for homepage feed - OPTIMIZED for scale
   * Uses the SAME optimized pattern as user profile (single API call with comprehensive data)
   */
  async getHomepageReviewsWithStats(params: {
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'view_count' | 'overall_rating';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    console.log('📊 ReviewStatsService: Fetching homepage reviews using dedicated homepage endpoint');
    
    try {
      // Import homepageService for the specific homepage endpoint
      const { homepageService } = await import('../api/services');
      
      console.log('📊 ReviewStatsService: Using homepageService.getHomepageReviews() - this should call /api/v1/homepage/reviews');
      
      // FIXED: Use the dedicated homepage/reviews endpoint that includes complete entity data with categories
      const result = await homepageService.getHomepageReviews(
        params.limit || 15,
        params.page || 1
      );
      
      console.log('📊 ReviewStatsService: Homepage got comprehensive data from dedicated endpoint:', {
        reviewCount: result.reviews.length,
        total: result.total,
        hasMore: result.hasMore,
        sampleReview: result.reviews[0] ? {
          id: result.reviews[0].id,
          title: result.reviews[0].title,
          hasUserReaction: !!result.reviews[0].user_reaction,
          totalReactions: result.reviews[0].total_reactions,
          viewCount: result.reviews[0].view_count,
          entityData: {
            name: result.reviews[0].entity?.name,
            averageRating: result.reviews[0].entity?.averageRating,
            rootCategoryName: result.reviews[0].entity?.root_category_name,
            finalCategoryName: result.reviews[0].entity?.final_category_name,
            hasAvatar: !!result.reviews[0].entity?.avatar,
            hasImageUrl: !!result.reviews[0].entity?.imageUrl
          }
        } : null
      });
      
      return {
        reviews: result.reviews,
        total: result.total || 0,
        hasMore: result.hasMore
      };
      
    } catch (error) {
      console.error('📊 ReviewStatsService: Homepage error:', error);
      return { reviews: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get reviews with full stats for an entity - OPTIMIZED for scale
   * Uses the SAME optimized pattern as user profile and homepage
   */
  async getEntityReviewsWithStats(entityId: string, params: {
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'view_count' | 'overall_rating';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    console.log('📊 ReviewStatsService: Fetching entity reviews with SAME pattern as user profile/homepage');
    
    try {
      // OPTIMIZED: Single comprehensive API call with all entity review data
      const result = await reviewService.getReviews({
        entityId,
        page: params.page || 1,
        limit: params.limit || 20,
        sortBy: params.sortBy || 'created_at',
        sortOrder: params.sortOrder || 'desc'
      });
      
      console.log('📊 ReviewStatsService: Entity got comprehensive data:', {
        entityId,
        reviewCount: result.reviews.length,
        total: result.total,
        hasMore: result.hasMore,
        sampleReview: result.reviews[0] ? {
          id: result.reviews[0].id,
          title: result.reviews[0].title,
          hasUserReaction: !!result.reviews[0].user_reaction,
          totalReactions: result.reviews[0].total_reactions,
          viewCount: result.reviews[0].view_count,
          entityData: {
            name: result.reviews[0].entity?.name,
            averageRating: result.reviews[0].entity?.averageRating,
            reviewCount: result.reviews[0].entity?.reviewCount
          }
        } : null,
        reviewsWithEngagement: result.reviews.filter(r => 
          (r.total_reactions > 0) || (r.comment_count > 0) || (r.view_count > 0)
        ).length
      });
      
      return {
        reviews: result.reviews,
        total: result.total,
        hasMore: result.hasMore
      };
      
    } catch (error) {
      console.error('📊 ReviewStatsService: Entity reviews error:', error);
      return { reviews: [], total: 0, hasMore: false };
    }
  }

  /**
   * Get complete entity details with reviews in a SINGLE API call
   * Same optimization pattern as user profile - no separate entity + reviews calls
   */
  async getEntityDetailsWithStats(entityId: string, params: {
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'view_count' | 'overall_rating';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    entity: any | null;
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    console.log('📊 ReviewStatsService: Getting COMPLETE entity details (entity + reviews) in single call');
    
    try {
      // Single API call gets both entity info and reviews with comprehensive data
      const reviewsResult = await this.getEntityReviewsWithStats(entityId, params);
      
      // Extract entity data from the reviews (reviews include full entity data)
      let entityData = null;
      if (reviewsResult.reviews.length > 0 && reviewsResult.reviews[0].entity) {
        entityData = reviewsResult.reviews[0].entity;
        console.log('📊 ReviewStatsService: Extracted entity data from reviews:', {
          name: entityData.name,
          averageRating: entityData.averageRating,
          reviewCount: entityData.reviewCount
        });
      } else {
        // Fallback: if no reviews, get entity separately (minimal impact)
        console.log('📊 ReviewStatsService: No reviews found, fetching entity separately');
        try {
          const { entityService } = await import('../api/services');
          entityData = await entityService.getEntityById(entityId);
        } catch (err) {
          console.error('Failed to fetch entity:', err);
        }
      }
      
      console.log('📊 ReviewStatsService: Complete entity details fetched:', {
        hasEntity: !!entityData,
        reviewCount: reviewsResult.reviews.length,
        hasMore: reviewsResult.hasMore
      });
      
      return {
        entity: entityData,
        reviews: reviewsResult.reviews,
        total: reviewsResult.total,
        hasMore: reviewsResult.hasMore
      };
      
    } catch (error) {
      console.error('📊 ReviewStatsService: Entity details error:', error);
      return { entity: null, reviews: [], total: 0, hasMore: false };
    }
  }

  // OPTIMIZED for 10M+ scale: Backend returns complete data, minimal frontend processing

  /**
   * Validate comprehensive review data to ensure all required fields are present
   */
  private validateComprehensiveReviewData(reviews: Review[]): Review[] {
    return reviews.map(review => {
      // Ensure all engagement stats are numbers
      const validatedReview = {
        ...review,
        view_count: Number(review.view_count || 0),
        total_reactions: Number(review.total_reactions || 0),
        comment_count: Number(review.comment_count || 0),
        reactions: review.reactions || {}
      };

      // Validate entity data if present
      if (validatedReview.entity) {
        validatedReview.entity = {
          ...validatedReview.entity,
          average_rating: Number(validatedReview.entity.average_rating || 0),
          review_count: Number(validatedReview.entity.review_count || 0)
        };
      }

      return validatedReview;
    });
  }

  /**
   * Clear cache - used for logout/auth changes  
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update review stats - minimal cache management for 10M+ scale
   */
  async updateReviewStats(reviewId: string, updates: any): Promise<void> {
    // Backend handles all state - minimal cache management
    const cacheKey = `review_${reviewId}`;
    if (this.cache.has(cacheKey)) {
      this.cache.delete(cacheKey);
    }
  }
}

// Export singleton instance
export const reviewStatsService = new ReviewStatsService();