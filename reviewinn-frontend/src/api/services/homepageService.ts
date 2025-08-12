import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';
import type { Review, Entity } from '../../types';
import { enhanceEntityWithVerification } from '../../shared/utils/verificationUtils';
import { enhanceEntityWithHierarchicalCategories } from '../../shared/utils/entityCategoryEnhancer';

export interface HomepageReview {
  review_id: number;
  title?: string;
  content: string;
  overall_rating: number;
  view_count: number;
  created_at: string;
  is_verified: boolean;
  is_anonymous: boolean;
  user_name: string;
  user_avatar?: string;
  entity_name: string;
  entity_root_category: string;
  entity_final_category: string;
  comment_count: number;
  reaction_count: number;
  pros: string[];
  cons: string[];
  // NEW: Complete entity object like user reviews
  entity?: HomepageEntity;
}

export interface HomepageEntity {
  entity_id: number;
  name: string;
  description?: string;
  // Use hierarchical category system exclusively
  root_category_name?: string;  // Root category name for display
  final_category_name?: string;  // Final category name for display
  avatar?: string;
  is_verified: boolean;
  is_claimed: boolean;
  average_rating: number;
  review_count: number;
  view_count: number;  // Entity view count
  reaction_count: number;  // OPTIMIZED: Cached total reactions
  comment_count: number;   // OPTIMIZED: Cached total comments
  created_at: string;
  // Hierarchical category fields
  root_category_id?: number;
  final_category_id?: number;
  category_breadcrumb?: Array<{
    id: number;
    name: string;
    slug: string;
    level: number;
  }>;
  category_display?: string;
  root_category?: {
    id: number;
    name: string;
    slug: string;
    level?: number;
    icon?: string;
    color?: string;
  };
  final_category?: {
    id: number;
    name: string;
    slug: string;
    level?: number;
    icon?: string;
    color?: string;
  };
}

export interface PlatformStats {
  total_reviews: number;
  total_entities: number;
  total_users: number;
  recent_reviews_24h: number;
  average_rating: number;
  most_active_category: string;
}

export interface HomepageData {
  recent_reviews: HomepageReview[];
  trending_entities: HomepageEntity[];
  stats: PlatformStats;
  has_more_reviews: boolean;
}

export interface HomepageParams {
  reviews_limit?: number;
  entities_limit?: number;
}

export interface LeftPanelData {
  reviews: Review[];
  entities: Entity[];
}

export class HomepageService {
  private baseUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOMEPAGE.DATA}`;
  private leftPanelUrl = `${API_CONFIG.BASE_URL}/left_panel`;
  private MAX_LIMIT = 100;

  // Helper to convert API response to frontend types
  private mapHomepageReviewToFrontend(apiReview: any): Review {
    // FIXED: Backend now returns complete review data directly (not nested)
    // Each review in the data array is a complete review object with entity
    const review = apiReview;
    
    // Debug log to see what entity data we're receiving
    if (review.entity && import.meta.env.DEV) {
      console.log('🔍 HomepageService mapping entity data:', {
        entityName: review.entity.name,
        hasAvatar: !!review.entity.avatar,
        hasImageUrl: !!review.entity.imageUrl,
        avatar: review.entity.avatar,
        imageUrl: review.entity.imageUrl,
        root_category_name: review.entity.root_category_name,
        final_category_name: review.entity.final_category_name,
        root_category: review.entity.root_category,
        final_category: review.entity.final_category,
        entityKeys: Object.keys(review.entity)
      });
    }
    
    return {
      id: review.review_id?.toString() || review.id?.toString() || '',
      entityId: review.entity?.entity_id?.toString() || review.entity_id?.toString() || review.entityId?.toString() || '',
      reviewerId: review.user_id?.toString() || review.reviewerId?.toString() || '',
      reviewerName: review.user?.name || review.user_name || review.reviewerName || '',
      reviewerUsername: review.user?.username || review.reviewerUsername || undefined,
      reviewerAvatar: review.user?.avatar || review.user_avatar || review.reviewerAvatar || undefined,
      // Use hierarchical categories from complete entity object
      root_category: review.entity?.root_category_name || review.root_category || review.entity_root_category,
      final_category: review.entity?.final_category_name || review.final_category || review.entity_final_category,
      title: review.title || '',
      content: review.content || '',
      overallRating: review.overall_rating || review.overallRating || 0,
      ratings: review.ratings || {},
      criteria: review.criteria || {},
      pros: review.pros || [],
      cons: review.cons || [],
      isAnonymous: review.is_anonymous || review.isAnonymous || false,
      isVerified: review.is_verified || review.isVerified || false,
      view_count: review.view_count || 0,
      reactions: review.reactions || {},
      user_reaction: review.user_reaction || undefined,
      top_reactions: review.top_reactions || [],
      total_reactions: review.total_reactions || review.reaction_count || 0,
      createdAt: review.created_at || review.createdAt || new Date().toISOString(),
      updatedAt: review.updated_at || review.updatedAt || review.created_at || review.createdAt || new Date().toISOString(),
      comments: review.comments || [],
      // CRITICAL FIX: Use complete entity object with images and category breadcrumbs
      entity: review.entity ? {
        id: review.entity.entity_id?.toString() || review.entity.id?.toString() || '',
        entity_id: review.entity.entity_id?.toString() || review.entity.entity_id?.toString() || '',
        name: review.entity.name || '',
        description: review.entity.description || '',
        // Category information for breadcrumbs
        root_category_name: review.entity.root_category_name || review.entity.root_category?.name,
        final_category_name: review.entity.final_category_name || review.entity.final_category?.name,
        category_breadcrumb: review.entity.category_breadcrumb || [],
        category_display: review.entity.category_display || '',
        root_category: review.entity.root_category,
        final_category: review.entity.final_category,
        // Entity image/avatar
        avatar: review.entity.avatar || review.entity.imageUrl,
        imageUrl: review.entity.imageUrl || review.entity.avatar,
        isVerified: review.entity.is_verified || review.entity.isVerified || false,
        isClaimed: review.entity.is_claimed || review.entity.isClaimed || false,
        averageRating: review.entity.average_rating || review.entity.averageRating || 0,
        reviewCount: review.entity.review_count || review.entity.reviewCount || 0,
        view_count: review.entity.view_count || 0,
        createdAt: review.entity.created_at || review.entity.createdAt || new Date().toISOString(),
        updatedAt: review.entity.updated_at || review.entity.updatedAt || new Date().toISOString()
      } : undefined
    };
  }

  private mapHomepageEntityToFrontend(apiEntity: HomepageEntity): Entity {
    const basicEntity = {
      id: apiEntity.entity_id.toString(),
      entity_id: apiEntity.entity_id.toString(),
      name: apiEntity.name,
      description: apiEntity.description || '',
      // Use hierarchical categories exclusively
      root_category_name: apiEntity.root_category_name || apiEntity.root_category?.name,
      final_category_name: apiEntity.final_category_name || apiEntity.final_category?.name,
      avatar: apiEntity.avatar,
      isVerified: apiEntity.is_verified,
      isClaimed: apiEntity.is_claimed,
      averageRating: apiEntity.average_rating,
      reviewCount: apiEntity.review_count,
      // OPTIMIZED: Include cached engagement metrics from entity table
      viewCount: apiEntity.view_count || 0,
      reactionCount: apiEntity.reaction_count || 0,
      commentCount: apiEntity.comment_count || 0,
      createdAt: apiEntity.created_at,
      updatedAt: apiEntity.created_at,
      // Include API-provided hierarchical category fields if available
      root_category_id: apiEntity.root_category_id,
      final_category_id: apiEntity.final_category_id,
      category_breadcrumb: apiEntity.category_breadcrumb,
      category_display: apiEntity.category_display,
      root_category: apiEntity.root_category,
      final_category: apiEntity.final_category
    };
    
    // Enhance with hierarchical categories (will generate if missing)
    const enhancedEntity = enhanceEntityWithHierarchicalCategories(basicEntity);
    
    // Apply centralized verification logic to ensure consistency
    return enhanceEntityWithVerification(enhancedEntity);
  }

  /**
   * Get complete homepage data
   * UPDATED: Handle new backend structure with complete entity data
   */
  async getHomepageData(params: HomepageParams = {}): Promise<{
    reviews: Review[];
    entities: Entity[];
    stats: PlatformStats;
    hasMoreReviews: boolean;
  }> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.reviews_limit) {
        searchParams.append('reviews_limit', Math.min(params.reviews_limit, this.MAX_LIMIT).toString());
      }
      if (params.entities_limit) {
        searchParams.append('entities_limit', Math.min(params.entities_limit, this.MAX_LIMIT).toString());
      }

      const url = searchParams.toString() 
        ? `${this.baseUrl}?${searchParams.toString()}`
        : this.baseUrl;

      const response = await httpClient.get<any>(url);
      
      // Handle both old and new response formats
      const data = response.data?.data || response.data;
      
      const entities = (data?.trending_entities || []).map((e: HomepageEntity) => this.mapHomepageEntityToFrontend(e));
      
      // Map reviews - no need for manual entity ID mapping since backend provides complete entity data
      const reviews = (data?.recent_reviews || []).map((r: any) => this.mapHomepageReviewToFrontend(r));
      
      return {
        reviews,
        entities,
        stats: data?.stats || {} as PlatformStats,
        hasMoreReviews: data?.has_more_reviews || false
      };
    } catch (error) {
      console.error('Failed to fetch homepage data:', error);
      // Return empty data if API fails
      return {
        reviews: [],
        entities: [],
        stats: {
          total_reviews: 0,
          total_entities: 0,
          total_users: 0,
          recent_reviews_24h: 0,
          average_rating: 0,
          most_active_category: ''
        },
        hasMoreReviews: false
      };
    }
  }

  /**
   * Get homepage reviews with pagination
   * UPDATED: Backend now returns same format as reviews endpoint with complete data
   */
  async getHomepageReviews(limit: number = 15, page: number = 1): Promise<{
    reviews: Review[];
    hasMore: boolean;
    total?: number;
  }> {
    limit = Math.min(limit, this.MAX_LIMIT);
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit.toString());
    searchParams.append('page', page.toString());

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOMEPAGE.REVIEWS}?${searchParams.toString()}`;
    
    try {
      const response = await httpClient.get<any>(url);
      
      // UPDATED: Backend now returns reviews directly in data array, same as reviews endpoint
      // Expected structure: { success: true, data: [...], pagination: {...} }
      const responseData = response.data;
      
      if (responseData?.success && responseData?.data) {
        // Map each review using the updated mapping function that handles complete entity objects
        const reviews = responseData.data.map((reviewData: any) => this.mapHomepageReviewToFrontend(reviewData));
        
        return {
          reviews,
          hasMore: responseData.pagination?.has_more || false,
          total: responseData.pagination?.total
        };
      } else {
        console.warn('Unexpected homepage reviews response structure:', responseData);
        return {
          reviews: [],
          hasMore: false,
          total: 0
        };
      }
    } catch (error) {
      console.error('Failed to fetch homepage reviews:', error);
      return {
        reviews: [],
        hasMore: false,
        total: 0
      };
    }
  }

  /**
   * Get trending entities
   */
  async getTrendingEntities(limit: number = 20): Promise<Entity[]> {
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit.toString());

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOMEPAGE.ENTITIES}?${searchParams.toString()}`;
    const response = await httpClient.get<HomepageEntity[]>(url);
    
    return response.data?.map((e: HomepageEntity) => this.mapHomepageEntityToFrontend(e)) || [];
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.HOMEPAGE.STATS}`;
    const response = await httpClient.get<PlatformStats>(url);
    return response.data || {} as PlatformStats;
  }

  /**
   * Get left panel data (top reviews and their entities)
   * UPDATED: Handle new backend structure with complete entity data
   */
  async getLeftPanelData(reviews_limit: number = 2): Promise<LeftPanelData> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('reviews_limit', Math.min(reviews_limit, this.MAX_LIMIT).toString());
      const url = `${this.leftPanelUrl}?${searchParams.toString()}`;
      const response = await httpClient.get<any>(url);
      
      // Handle both old and new response formats
      const data = response.data?.data || response.data;
      
      const entities = (data?.entities || []).map((e: HomepageEntity) => this.mapHomepageEntityToFrontend(e));
      
      // Map reviews - no need for manual entity ID mapping since backend provides complete entity data
      const reviews = (data?.reviews || []).map((r: any) => this.mapHomepageReviewToFrontend(r));
      
      return { reviews, entities };
    } catch (error) {
      console.error('Failed to fetch left panel data:', error);
      return { reviews: [], entities: [] };
    }
  }

  /**
   * Get complete homepage middle panel data
   * UPDATED: Handle new backend structure with complete entity data
   */
  async getHomeMiddlePanelData(params: HomepageParams = {}): Promise<{
    reviews: Review[];
    entities: Entity[];
    stats: PlatformStats;
    hasMoreReviews: boolean;
  }> {
    try {
      const searchParams = new URLSearchParams();
      if (params.reviews_limit) {
        searchParams.append('reviews_limit', Math.min(params.reviews_limit, this.MAX_LIMIT).toString());
      }
      if (params.entities_limit) {
        searchParams.append('entities_limit', Math.min(params.entities_limit, this.MAX_LIMIT).toString());
      }
      
      const url = searchParams.toString()
        ? `${this.baseUrl}?${searchParams.toString()}`
        : this.baseUrl;
        
      const response = await httpClient.get<any>(url);
      
      // Handle both old and new response formats
      const data = response.data?.data || response.data;
      
      const entities = (data?.trending_entities || []).map((e: HomepageEntity) => this.mapHomepageEntityToFrontend(e));
      
      // Map reviews - no need for manual entity ID mapping since backend provides complete entity data
      const reviews = (data?.recent_reviews || []).map((r: any) => this.mapHomepageReviewToFrontend(r));
      
      return {
        reviews,
        entities,
        stats: data?.stats || {} as PlatformStats,
        hasMoreReviews: data?.has_more_reviews || false
      };
    } catch (error) {
      console.error('Failed to fetch homepage middle panel data:', error);
      return {
        reviews: [],
        entities: [],
        stats: {
          total_reviews: 0,
          total_entities: 0,
          total_users: 0,
          recent_reviews_24h: 0,
          average_rating: 0,
          most_active_category: ''
        },
        hasMoreReviews: false
      };
    }
  }
}

export const homepageService = new HomepageService();
