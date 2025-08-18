import { API_CONFIG, API_ENDPOINTS } from '../config';
import type { Review, ReviewFormData, ReviewTemplate } from '../../types';
import { EntityCategory } from '../../types';
import { userInteractionService } from './userInteractionService';

export interface ReviewListParams {
  page?: number;
  limit?: number;
  entityId?: string;
  userId?: string;
  category?: EntityCategory;
  subcategory?: string;
  rating?: number;
  sortBy?: 'created_at' | 'overall_rating' | 'view_count';
  sortOrder?: 'asc' | 'desc';
  verified?: boolean;
  includeAnonymous?: boolean;
}

export interface ReviewSearchParams {
  query?: string;
  entityId?: string;
  userId?: string;
  category?: EntityCategory;
  rating?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  page?: number;
  limit?: number;
}

export class ReviewService {
  private baseUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.LIST}/`;
  private MAX_LIMIT = 100;

  // Helper to map comprehensive API entity data to frontend format
  private mapEntityApiToFrontend(apiEntity: any): any {
    if (!apiEntity || typeof apiEntity !== 'object') {
      console.warn('🚨 ReviewService: Invalid entity data provided to mapEntityApiToFrontend:', apiEntity);
      return undefined;
    }
    
    console.log('🔄 ReviewService mapping comprehensive entity data:', {
      name: apiEntity?.name,
      root_category: apiEntity?.root_category,
      final_category: apiEntity?.final_category,
      average_rating: apiEntity?.average_rating,
      review_count: apiEntity?.review_count,
      hasImage: !!(apiEntity?.imageUrl || apiEntity?.image_url || apiEntity?.avatar),
      keys: apiEntity ? Object.keys(apiEntity) : []
    });
    
    return {
      // Core identification fields
      id: apiEntity.entity_id?.toString() ?? apiEntity.id?.toString() ?? '',
      entity_id: apiEntity.entity_id?.toString() ?? apiEntity.id?.toString() ?? '',
      
      // Basic entity information
      name: apiEntity.name || '',
      description: apiEntity.description || apiEntity.desc || '',
      
      // Legacy category fields (for backward compatibility)
      category: apiEntity.category || 'professionals',
      subcategory: apiEntity.subcategory || '',
      
      // New unified category system
      unified_category_id: apiEntity.unified_category_id,
      unified_category: apiEntity.unified_category,
      
      // Hierarchical category fields (critical for breadcrumbs)
      root_category_id: apiEntity.root_category_id,
      final_category_id: apiEntity.final_category_id,
      category_breadcrumb: apiEntity.category_breadcrumb || [],
      category_display: apiEntity.category_display || '',
      root_category: apiEntity.root_category,
      final_category: apiEntity.final_category,
      
      // Image fields (priority: imageUrl > avatar > image_url)
      imageUrl: apiEntity.imageUrl || apiEntity.image_url,
      avatar: apiEntity.avatar,
      image_url: apiEntity.image_url, // Keep for compatibility
      
      // Verification and claim status
      isVerified: apiEntity.isVerified ?? apiEntity.is_verified ?? false,
      isClaimed: apiEntity.isClaimed ?? apiEntity.is_claimed ?? false,
      claimedBy: apiEntity.claimedBy ?? apiEntity.claimed_by,
      claimedAt: apiEntity.claimedAt ?? apiEntity.claimed_at,
      
      // Metrics and engagement - comprehensive stats from single API call
      averageRating: Number(apiEntity.averageRating ?? apiEntity.average_rating ?? apiEntity.avg_rating ?? 0),
      reviewCount: Number(apiEntity.reviewCount ?? apiEntity.review_count ?? apiEntity.reviews_count ?? 0),
      view_count: Number(apiEntity.view_count ?? 0),
      
      // Additional comprehensive entity data
      ratingStars: Math.round((apiEntity.averageRating ?? apiEntity.average_rating ?? 0) * 2) / 2, // Round to nearest 0.5
      
      // Context and relationships
      context: apiEntity.context,
      relatedEntityIds: apiEntity.relatedEntityIds ?? apiEntity.related_entity_ids ?? [],
      
      // Timestamps
      createdAt: apiEntity.createdAt ?? apiEntity.created_at ?? '',
      updatedAt: apiEntity.updatedAt ?? apiEntity.updated_at ?? '',
      
      // Custom and additional fields
      fields: apiEntity.fields ?? {},
      customFields: apiEntity.customFields ?? apiEntity.custom_fields ?? {},
      
      // Additional computed fields for UI
      hasRealImage: Boolean(
        (apiEntity.imageUrl || apiEntity.image_url || apiEntity.avatar) && 
        !(apiEntity.imageUrl || apiEntity.image_url || apiEntity.avatar)?.includes('ui-avatars.com')
      )
    };
  }

  // Helper to map comprehensive API review data to frontend format
  private mapReviewApiToFrontend(apiReview: any): Review {
    console.log('🔄 ReviewService mapping comprehensive API data for review', apiReview.review_id || apiReview.id, ':', {
      hasEntity: !!apiReview.entity,
      entityName: apiReview.entity?.name,
      entityAvatar: apiReview.entity?.avatar,
      entityIsVerified: apiReview.entity?.isVerified,
      entityRootCategory: apiReview.entity?.root_category,
      entityFinalCategory: apiReview.entity?.final_category,
      reactions: apiReview.reactions,
      user_reaction: apiReview.user_reaction,
      total_reactions: apiReview.total_reactions,
      comment_count: apiReview.comment_count,
      view_count: apiReview.view_count,
      hasUserReaction: !!(apiReview.user_reaction || apiReview.current_user_reaction)
    });
    
    return {
      id: apiReview.review_id?.toString() ?? apiReview.id,
      entityId: apiReview.entity_id?.toString() ?? apiReview.entityId,
      reviewerId: apiReview.user_id?.toString() ?? apiReview.reviewerId,
      reviewerName: apiReview.reviewer_name ?? apiReview.reviewerName ?? apiReview.user?.name ?? 'Anonymous',
      reviewerUsername: apiReview.reviewer_username ?? apiReview.reviewerUsername ?? apiReview.user?.username,
      reviewerAvatar: apiReview.reviewer_avatar ?? apiReview.reviewerAvatar ?? apiReview.user?.avatar,
      category: apiReview.category as EntityCategory || EntityCategory.PRODUCTS,
      title: apiReview.title,
      content: apiReview.content,
      overallRating: apiReview.overall_rating ?? apiReview.overallRating,
      ratings: apiReview.ratings ?? {},
      criteria: apiReview.criteria ?? {},
      pros: apiReview.pros ?? [],
      cons: apiReview.cons ?? [],
      images: apiReview.images ?? [],
      isAnonymous: apiReview.is_anonymous ?? apiReview.isAnonymous ?? false,
      isVerified: apiReview.is_verified ?? apiReview.isVerified ?? false,
      
      // Comprehensive engagement stats from single API call
      view_count: Number(apiReview.view_count ?? apiReview.views ?? 0),
      reactions: apiReview.reactions ?? {},
      user_reaction: apiReview.user_reaction ?? apiReview.current_user_reaction ?? undefined,
      top_reactions: apiReview.top_reactions ?? [],
      total_reactions: Number(apiReview.total_reactions ?? apiReview.reaction_count ?? 
        (apiReview.reactions ? Object.values(apiReview.reactions).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0) : 0)),
      
      // Comment count from comprehensive API response
      comment_count: Number(apiReview.comment_count ?? (Array.isArray(apiReview.comments) ? apiReview.comments.length : 0)),
      
      // Timestamps
      createdAt: apiReview.created_at ?? apiReview.createdAt,
      updatedAt: apiReview.updated_at ?? apiReview.updatedAt,
      comments: Array.isArray(apiReview.comments)
        ? apiReview.comments.filter(c => c != null).map((c: any) => ({
            id: c.comment_id?.toString() ?? c.id,
            reviewId: c.review_id?.toString() ?? c.reviewId,
            userId: c.user_id?.toString() ?? c.userId,
            userName: c.user_name ?? c.userName ?? '',
            content: c.content,
            authorName: c.user_name ?? c.userName ?? '',
            createdAt: c.created_at ? new Date(c.created_at) : new Date(),
            reactions: c.reactions || {},
            userReaction: c.user_reaction ?? undefined
          }))
        : (apiReview.comment_count ? new Array(apiReview.comment_count).fill(null) : []),
      entity: (apiReview.entity && typeof apiReview.entity === 'object') ? (() => {
        const mappedEntity = this.mapEntityApiToFrontend(apiReview.entity);
        console.log('🔄 ReviewService mapped entity for review', apiReview.review_id || apiReview.id, ':', {
          original: apiReview.entity,
          mapped: mappedEntity,
          hasAvatar: !!(mappedEntity.avatar || mappedEntity.imageUrl),
          hasCategories: !!(mappedEntity.root_category && mappedEntity.final_category)
        });
        return mappedEntity;
      })() : undefined,
    };
  }

  /**
   * Get list of reviews with pagination and filtering
   */
  async getReviews(params: ReviewListParams = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', Math.min(params.limit, this.MAX_LIMIT).toString());
    if (params.entityId) searchParams.append('entity_id', params.entityId);
    if (params.userId) searchParams.append('user_id', params.userId);
    if (params.category) searchParams.append('category', params.category);
    if (params.subcategory) searchParams.append('subcategory', params.subcategory);
    if (params.rating) searchParams.append('rating', params.rating.toString());
    if (params.sortBy) searchParams.append('sort_by', params.sortBy);
    if (params.sortOrder) searchParams.append('sort_order', params.sortOrder);
    if (params.verified !== undefined) searchParams.append('verified', params.verified.toString());
    if (params.includeAnonymous !== undefined) searchParams.append('include_anonymous', params.includeAnonymous.toString());
    
    // Single comprehensive API call for 10M+ scale performance
    // Include ALL required data in one request:
    // Review: title, overall_rating, content, pros, cons, ratings
    // Entity: name, root_category, final_category, description, average_rating, review_count, image
    // Engagement: reaction_count, comment_count, view_count, user_reaction (if authenticated)
    searchParams.append('include_comprehensive_data', 'true');
    searchParams.append('include_entity_full', 'true');
    searchParams.append('include_categories_hierarchy', 'true');  
    searchParams.append('include_entity_images', 'true');
    searchParams.append('include_entity_stats', 'true');
    searchParams.append('include_review_reactions', 'true');
    searchParams.append('include_reaction_counts', 'true');
    searchParams.append('include_comment_counts', 'true');
    searchParams.append('include_view_counts', 'true');
    searchParams.append('include_user_reactions', 'true');
    searchParams.append('include_engagement_stats', 'true');

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get reviews: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    const data = response.data || { reviews: [], total: 0, page: 1, limit: 20, pages: 0 };
    
    // PERFORMANCE: Use backend's efficient has_more flag when available
    const hasMore = data.has_more !== undefined ? data.has_more : (data.page < data.pages);
    
    return {
      reviews: Array.isArray(data.reviews) ? data.reviews.map((review) => this.mapReviewApiToFrontend(review)) : [],
      total: data.total,
      hasMore: hasMore,
    };
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<Review | null> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.GET_BY_ID(id)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get review: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    return response.data || null;
  }

  /**
   * Get shareable review with full context and metadata
   */
  async getShareableReview(id: string): Promise<{
    review: Review;
    sharing: {
      share_url: string;
      meta_title: string;
      meta_description: string;
      meta_image?: string;
      entity_name: string;
      reviewer_name: string;
      rating: number;
      view_count: number;
    };
  } | null> {
    const url = `${API_CONFIG.BASE_URL}/reviews/${id}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get shareable review: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    if (!response.data) return null;
    
    return {
      review: this.mapReviewApiToFrontend(response.data.review),
      sharing: response.data.sharing
    };
  }

  /**
   * Get social media sharing metadata for a review
   */
  async getReviewShareMetadata(id: string): Promise<{
    og_title: string;
    og_description: string;
    og_url: string;
    og_image?: string;
    og_type: string;
    og_site_name: string;
    twitter_card: string;
    twitter_title: string;
    twitter_description: string;
    twitter_image?: string;
    title: string;
    description: string;
    canonical_url: string;
    author: string;
    published_time: string;
    modified_time: string;
    entity_name: string;
    rating: number;
    rating_stars: string;
    view_count: number;
    is_verified: boolean;
    facebook_share: string;
    twitter_share: string;
    linkedin_share: string;
    whatsapp_share: string;
    email_share: string;
  } | null> {
    const url = `${API_CONFIG.BASE_URL}/reviews/${id}/share-metadata`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get review share metadata: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    return response.data || null;
  }

  /**
   * Get reviews for a specific entity
   */
  async getReviewsForEntity(entityId: string, params: Omit<ReviewListParams, 'entityId'> = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    return this.getReviews({ ...params, entityId });
  }

  /**
   * Get reviews by a specific user - uses dedicated user reviews endpoint
   */
  async getReviewsByUser(userId: string, params: Omit<ReviewListParams, 'userId'> = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    console.log('📊 ReviewService: Using dedicated user reviews endpoint for userId:', userId);
    
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('size', Math.min(params.limit, this.MAX_LIMIT).toString());
    if (params.sortBy) searchParams.append('sort_by', params.sortBy);
    if (params.sortOrder) searchParams.append('order', params.sortOrder);
    
    // Use the dedicated user reviews endpoint that includes full entity data
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.GET_BY_ID(userId)}/reviews?${searchParams.toString()}`;
    
    // Use direct fetch for public review viewing (no auth required)
    const response = await fetch(url);
    const apiResponse = await response.json();
    
    console.log('📊 ReviewService: Raw user reviews response:', apiResponse);
    
    if (!apiResponse.success || !apiResponse.data) {
      return { reviews: [], total: 0, hasMore: false };
    }
    
    // Map the reviews using our comprehensive mapping
    const mappedReviews = apiResponse.data.map((review) => this.mapReviewApiToFrontend(review));
    
    return {
      reviews: mappedReviews,
      total: apiResponse.pagination?.total || 0,
      hasMore: apiResponse.pagination?.has_next || false,
    };
  }

  /**
   * Search reviews
   */
  async searchReviews(query: string, params: ReviewSearchParams = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    if (params.limit) searchParams.append('limit', Math.min(params.limit, this.MAX_LIMIT).toString());

    try {
      // Use the same optimized endpoint as homepage for consistent data structure
      const url = `${API_CONFIG.BASE_URL}/homepage/search_reviews?${searchParams.toString()}`;
      const token = localStorage.getItem('reviewinn_jwt_token');
      const fetchResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        throw new Error(`Failed to search reviews: ${fetchResponse.statusText}`);
      }

      const response = await fetchResponse.json();

      if (!response.success || !response.data) {
        throw new Error('Search response was not successful');
      }

      // Transform the homepage-style response to frontend format
      const transformedReviews = response.data.map((apiReview: any): Review => {
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
      });
      
      return {
        reviews: transformedReviews,
        total: response.pagination.total || transformedReviews.length,
        hasMore: response.pagination.has_more || false
      };
    } catch (error) {
      console.log('Review search API failed, using fallback with existing reviews:', error);
      
      // Fallback: search through existing reviews
      try {
        const allReviews = await this.getReviews({ limit: 100 });
        const searchTerm = query.toLowerCase();
        const filteredReviews = allReviews.reviews.filter(review => 
          review.title?.toLowerCase().includes(searchTerm) ||
          review.content?.toLowerCase().includes(searchTerm) ||
          review.reviewerName?.toLowerCase().includes(searchTerm) ||
          review.entity?.name?.toLowerCase().includes(searchTerm)
        );
        
        return {
          reviews: filteredReviews.slice(0, params.limit || 20),
          total: filteredReviews.length,
          hasMore: filteredReviews.length > (params.limit || 20)
        };
      } catch (fallbackError) {
        console.error('Fallback review search also failed:', fallbackError);
        return { reviews: [], total: 0, hasMore: false };
      }
    }
  }

  /**
   * Create new review with dynamic form data
   */
  async createReview(reviewData: ReviewFormData): Promise<Review> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.CREATE}`;
    
    // Separate dynamic criteria ratings from legacy ratings
    const dynamicRatings: Record<string, number> = {};
    const additionalFields: Record<string, any> = {};
    
    // Process all fields in reviewData to separate ratings from other fields
    Object.entries(reviewData).forEach(([key, value]) => {
      if (key === 'ratings') {
        // ratings is a nested object containing criteria ratings
        Object.assign(dynamicRatings, value as Record<string, number>);
      } else if (
        // Skip known form fields
        !['entityId', 'title', 'comment', 'overallRating', 'pros', 'cons', 'images', 'isAnonymous'].includes(key) &&
        value !== undefined && value !== null && value !== ''
      ) {
        // This is likely an additional field from dynamic form
        additionalFields[key] = value;
      }
    });
    
    // Transform frontend data to backend schema
    const backendData = {
      entity_id: parseInt(reviewData.entityId || '0'),
      title: reviewData.title || '',
      content: reviewData.comment,
      overall_rating: reviewData.overallRating || 5.0,
      pros: reviewData.pros || [],
      cons: reviewData.cons || [],
      images: reviewData.images || [],
      is_anonymous: reviewData.isAnonymous,
      // Send dynamic criteria ratings
      ratings: dynamicRatings,
      // Send additional form fields
      additional_fields: additionalFields,
      // Legacy ratings for backward compatibility
      service_rating: dynamicRatings.service_rating || dynamicRatings.service_quality || null,
      quality_rating: dynamicRatings.quality_rating || dynamicRatings.overall_quality || null,
      value_rating: dynamicRatings.value_rating || dynamicRatings.value_for_money || null,
    };
    
    console.log('Sending review data to backend:', backendData);
    console.log('API URL:', url);
    
    let response;
    try {
      const token = localStorage.getItem('reviewinn_jwt_token');
      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(backendData),
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        throw new Error(`Failed to create review: ${fetchResponse.statusText}`);
      }

      response = await fetchResponse.json();
      console.log('Backend response:', response);
      
      if (!response.success || !response.data) {
        console.error('Review creation failed - Response:', response);
        throw new Error(response.message || 'Failed to create review');
      }
      
      console.log('Review creation successful, backend data:', response.data);
    } catch (apiError) {
      console.error('API call failed:', apiError);
      throw apiError;
    }
    
    // Get current user info for the review
    const currentUser = await this.getCurrentUserInfo();
    
    // Transform backend response to frontend Review type
    const backendReview = response.data;
    const newReview = {
      id: backendReview.review_id?.toString() || '',
      entityId: backendReview.entity_id?.toString() || '',
      reviewerId: backendReview.user_id?.toString() || '',
      reviewerName: backendReview.is_anonymous ? 'Anonymous' : (currentUser?.name || currentUser?.username || 'Unknown User'),
      reviewerUsername: backendReview.is_anonymous ? undefined : currentUser?.username,
      reviewerAvatar: backendReview.is_anonymous ? undefined : currentUser?.avatar,
      category: backendReview.entity?.category || 'Products',
      title: backendReview.title,
      content: backendReview.content,
      overallRating: backendReview.overall_rating,
      ratings: backendReview.ratings || {},
      criteria: backendReview.criteria || {},
      pros: backendReview.pros || [],
      cons: backendReview.cons || [],
      images: backendReview.images || [],
      isAnonymous: backendReview.is_anonymous,
      isVerified: false,
      reactions: {},
      createdAt: backendReview.created_at || new Date().toISOString(),
      comments: [],
      entity: backendReview.entity ? {
        entity_id: backendReview.entity_id,
        name: backendReview.entity.name,
        average_rating: backendReview.entity.average_rating
      } : undefined
    };
    
    // Emit event to update user profile with new review (from reviewService)
    const eventDetail = {
      review: newReview,
      userId: newReview.reviewerId,
      timestamp: Date.now(),
      source: 'reviewService'
    };
    
    console.log('📢 ReviewService: Emitting reviewCreated event:', eventDetail);
    window.dispatchEvent(new CustomEvent('reviewCreated', { detail: eventDetail }));
    
    return newReview;
  }

  /**
   * Get current user info (helper method)
   */
  private async getCurrentUserInfo(): Promise<any> {
    // Check if we have an auth token before making the request
    const token = localStorage.getItem('reviewinn_jwt_token');
    if (!token) {
      console.log('ReviewService: No auth token found, skipping user info fetch');
      return null;
    }

    try {
      const token = localStorage.getItem('reviewinn_jwt_token');
      const fetchResponse = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.ME}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        throw new Error(`Failed to get current user: ${fetchResponse.statusText}`);
      }

      const response = await fetchResponse.json();
      if (response.data || response) {
        const userData = response.data || response;
        return {
          id: userData.user_id?.toString() || '',
          name: userData.full_name || userData.name || userData.username || '',
          username: userData.username || '',
          avatar: 'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg'
        };
      }
    } catch (error: any) {
      // Handle 401 Unauthorized errors gracefully - don't log as errors since they're expected
      if (error.status === 401 || error.type === 'AUTHENTICATION_ERROR') {
        console.log('ReviewService: Auth token expired/invalid, skipping user info');
        return null;
      }
      // Only log non-auth errors
      console.warn('ReviewService: Failed to get current user info:', error.message || error);
    }
    return null;
  }

  /**
   * Update review
   */
  async updateReview(id: string, reviewData: Partial<ReviewFormData>): Promise<Review> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.UPDATE(id)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(reviewData),
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to update review: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    if (!response.data) {
      throw new Error('Failed to update review');
    }
    
    return response.data;
  }

  /**
   * Delete review
   */
  async deleteReview(id: string): Promise<void> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.DELETE(id)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to delete review: ${fetchResponse.statusText}`);
    }
  }

  /**
   * Vote on a review
   */
  async voteReview(reviewId: string, voteType: 'helpful' | 'not_helpful' | 'spam' | 'inappropriate'): Promise<void> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.VOTE(reviewId)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ type: voteType }),
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to vote review: ${fetchResponse.statusText}`);
    }
  }

  /**
   * Report a review
   */
  async reportReview(reviewId: string, reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other', description?: string): Promise<void> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.REPORT(reviewId)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ reason, description }),
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to report review: ${fetchResponse.statusText}`);
    }
  }

  /**
   * Get recent reviews
   */
  async getRecentReviews(limit: number = 10): Promise<Review[]> {
    limit = Math.min(limit, this.MAX_LIMIT);
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.RECENT}?limit=${limit}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get recent reviews: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    return response.data || [];
  }

  /**
   * Get trending reviews
   */
  async getTrendingReviews(limit: number = 10): Promise<Review[]> {
    limit = Math.min(limit, this.MAX_LIMIT);
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.TRENDING}?limit=${limit}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get trending reviews: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    return response.data || [];
  }


  /**
   * Get review templates
   */
  async getReviewTemplates(category?: EntityCategory, subcategory?: string): Promise<ReviewTemplate[]> {
    const searchParams = new URLSearchParams();
    if (category) searchParams.append('category', category);
    if (subcategory) searchParams.append('subcategory', subcategory);

    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.TEMPLATES}?${searchParams.toString()}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get review templates: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    return response.data || [];
  }

  /**
   * Create review template
   */
  async createReviewTemplate(templateData: Omit<ReviewTemplate, 'id' | 'usageCount'>): Promise<ReviewTemplate> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.CREATE_TEMPLATE}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(templateData),
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to create review template: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    if (!response.data) {
      throw new Error('Failed to create review template');
    }
    
    return response.data;
  }

  /**
   * Get reviews by category
   */
  async getReviewsByCategory(category: EntityCategory, params: Omit<ReviewListParams, 'category'> = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    return this.getReviews({ ...params, category });
  }

  /**
   * Get reviews by rating
   */
  async getReviewsByRating(rating: number, params: Omit<ReviewListParams, 'rating'> = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    return this.getReviews({ ...params, rating });
  }

  /**
   * Get helpful reviews
   */
  async getHelpfulReviews(limit: number = 10): Promise<Review[]> {
    limit = Math.min(limit, this.MAX_LIMIT);
    const params: ReviewListParams = {
      limit,
      sortBy: 'view_count',
      sortOrder: 'desc'
    };
    
    const result = await this.getReviews(params);
    return result.reviews;
  }

  /**
   * Get verified reviews
   */
  async getVerifiedReviews(params: Omit<ReviewListParams, 'verified'> = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    return this.getReviews({ ...params, verified: true });
  }

  /**
   * Get review statistics for an entity
   */
  async getEntityReviewStats(entityId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<string, number>;
    recentActivity: {
      reviewsThisWeek: number;
      reviewsThisMonth: number;
    };
  }> {
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.GET_BY_ID(entityId)}/review-stats`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get entity review stats: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    return response.data || {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: {},
      recentActivity: {
        reviewsThisWeek: 0,
        reviewsThisMonth: 0
      }
    };
  }

  /**
   * Add or update a reaction for a review
   */
  async addOrUpdateReaction(reviewId: string, reactionType: string): Promise<any> {
    // Guard against invalid review IDs
    if (!reviewId || reviewId === 'review_id' || reviewId === 'undefined') {
      throw new Error('Invalid review ID provided');
    }
    
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.ADD_REACTION(reviewId)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ reaction_type: reactionType }),
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to add reaction: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    // Update local interaction cache with the reaction
    userInteractionService.updateUserInteraction(reviewId, { 
      reviewId,
      reaction: reactionType,
      lastInteraction: new Date()
    });
    
    console.log('🔄 ReviewService: Updated user interaction cache with reaction:', reactionType, 'for review:', reviewId);
    
    return response.data;
  }

  /**
   * Remove a reaction for a review
   */
  async removeReaction(reviewId: string): Promise<any> {
    // Guard against invalid review IDs
    if (!reviewId || reviewId === 'review_id' || reviewId === 'undefined') {
      throw new Error('Invalid review ID provided');
    }
    
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.REMOVE_REACTION(reviewId)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to remove reaction: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    // Update local interaction cache to remove the reaction but keep other interactions
    const existingInteraction = userInteractionService.getUserInteraction(reviewId);
    if (existingInteraction) {
      userInteractionService.updateUserInteraction(reviewId, {
        ...existingInteraction,
        reaction: undefined,
        lastInteraction: new Date()
      });
    }
    
    console.log('🔄 ReviewService: Removed reaction from user interaction cache for review:', reviewId);
    
    return response.data;
  }

  /**
   * Get reaction counts for a review with user's reaction from cache
   */
  async getReactionCounts(reviewId: string): Promise<any> {
    // Guard against invalid review IDs
    if (!reviewId || reviewId === 'review_id' || reviewId === 'undefined') {
      return {
        reactions: {},
        top_reactions: [],
        total_reactions: 0,
        user_reaction: null
      };
    }
    
    const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.REACTIONS(reviewId)}`;
    const token = localStorage.getItem('reviewinn_jwt_token');
    const fetchResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      credentials: 'include',
    });

    if (!fetchResponse.ok) {
      throw new Error(`Failed to get reaction counts: ${fetchResponse.statusText}`);
    }

    const response = await fetchResponse.json();
    
    // Enhance response with cached user reaction if available
    const cachedReaction = userInteractionService.getUserReaction(reviewId);
    if (cachedReaction && !response.data.user_reaction) {
      response.data.user_reaction = cachedReaction;
    }
    
    return response.data;
  }

  /**
   * NOTE: Separate user reactions API call is no longer needed.
   * All user reactions are now included in the comprehensive API response
   * via the 'include_user_reactions' parameter for 10M+ scale efficiency.
   */

  /**
   * Get reviews with enhanced user interaction data
   */
  async getReviewsWithUserInteractions(params: any): Promise<any> {
    const response = await this.getReviews(params);
    
    // Enhance each review with cached user interactions
    const enhancedReviews = response.reviews.map((review: any) => {
      const userInteraction = userInteractionService.getUserInteraction(review.id);
      if (userInteraction && !review.user_reaction) {
        return {
          ...review,
          user_reaction: userInteraction.reaction
        };
      }
      return review;
    });
    
    return {
      ...response,
      reviews: enhancedReviews
    };
  }

}

// Export singleton instance
export const reviewService = new ReviewService(); 