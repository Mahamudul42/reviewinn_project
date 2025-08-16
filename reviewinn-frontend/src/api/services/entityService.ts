/**
 * Unified Entity Service - Consolidated and optimized entity management
 * Combines functionality from entityService, unifiedEntityService, and independentEntityService
 * Provides a single, consistent interface for all entity operations
 */

import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';
import type { 
  Entity, 
  SearchResult, 
  EntityCategory, 
  SearchFilters, 
  EntityFormData, 
  EntityAnalytics 
} from '../../types';
import { enhanceEntityWithHierarchicalCategories } from '../../shared/utils/entityCategoryEnhancer';

export interface EntityListParams {
  page?: number;
  limit?: number;
  category?: EntityCategory;
  subcategory?: string;
  search?: string;
  sortBy?: 'name' | 'rating' | 'reviewCount' | 'createdAt' | 'relevance' | 'trending' | 'reactions' | 'comments';
  sortOrder?: 'asc' | 'desc';
  verified?: boolean;
  claimed?: boolean;
  hasReviews?: boolean;
  // New JSONB category filters
  root_category_id?: number;
  final_category_id?: number;
  minRating?: number;
  maxRating?: number;
}

export interface EntitySearchParams {
  query: string;
  category?: EntityCategory;
  subcategory?: string;
  sortBy?: 'name' | 'rating' | 'reviewCount' | 'createdAt' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  verified?: boolean;
  minRating?: number;
  // New JSONB category filters
  root_category_id?: number;
  final_category_id?: number;
}

export interface EntityApiResponse {
  success: boolean;
  data: {
    entities?: Entity[];
    items?: Entity[];
    total?: number;
    page?: number;
    limit?: number;
    has_next?: boolean;
    has_prev?: boolean;
    pagination?: {
      total: number;
      page: number;
      per_page: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    filters_applied?: any;
    query_time_ms?: number;
  };
  message?: string;
}

export interface EntityStatsResponse {
  success: boolean;
  data: {
    total_reviews: number;
    average_rating: number;
    rating_distribution: Record<number, number>;
    recent_reviews: number;
    view_count: number;
    total_views: number;
    unique_viewers: number;
    growth_rate: number;
  };
}

class EntityService {
  private readonly baseUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.LIST}`;
  
  /**
   * Get entities with comprehensive filtering and pagination
   */
  async getEntities(params: EntityListParams = {}): Promise<SearchResult> {
    try {
      const searchParams = new URLSearchParams();
      
      // OPTIMIZED: Map to new backend parameters (no legacy category fields)
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.search) searchParams.append('search_query', params.search);
      
      // NEW: Support for engagement-based sorting
      if (params.sortBy === 'trending') {
        searchParams.append('sortBy', 'trending');
      } else if (params.sortBy === 'reactions') {
        searchParams.append('sortBy', 'reactionCount');
        searchParams.append('sortOrder', 'desc');
      } else if (params.sortBy === 'comments') {
        searchParams.append('sortBy', 'commentCount');
        searchParams.append('sortOrder', 'desc');
      } else if (params.sortBy) {
        // Standard sorting options
        const sortByMap: Record<string, string> = {
          'name': 'name',
          'rating': 'rating', 
          'reviewCount': 'reviewCount',
          'createdAt': 'created_at'
        };
        searchParams.append('sortBy', sortByMap[params.sortBy] || 'name');
      }
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      if (params.verified !== undefined) searchParams.append('verified', params.verified.toString());
      if (params.hasReviews !== undefined) searchParams.append('hasReviews', params.hasReviews.toString());
      if (params.minRating !== undefined) searchParams.append('minRating', params.minRating.toString());
      
      // NEW: JSONB category filtering support
      if (params.root_category_id) searchParams.append('root_category_id', params.root_category_id.toString());
      if (params.final_category_id) searchParams.append('final_category_id', params.final_category_id.toString());
      
      const url = `${this.baseUrl}/?${searchParams.toString()}`;
      console.log('🏢 EntityService: API call to:', url);
      console.log('🏢 EntityService: Search params:', Object.fromEntries(searchParams.entries()));
      const response = await httpClient.get<EntityApiResponse>(url);
      
      if (!response.success) {
        throw new Error('Failed to fetch entities');
      }
      
      // Backend returns: { success: true, data: [entities], pagination: {...} }
      const entitiesArray = response.data as any[];
      const pagination = (response as any).pagination || {};
      
      console.log('🏢 OPTIMIZED Entity Service: Received comprehensive data:', {
        totalEntities: entitiesArray?.length || 0,
        pagination: pagination,
        sampleEntity: entitiesArray?.[0] ? {
          name: entitiesArray[0].name,
          id: entitiesArray[0].id,
          entity_id: entitiesArray[0].entity_id,
          reviewCount: entitiesArray[0].reviewCount,
          reactionCount: entitiesArray[0].reactionCount,  // NEW
          commentCount: entitiesArray[0].commentCount,   // NEW
          viewCount: entitiesArray[0].viewCount
        } : null
      });
      
      console.log('🔧 DEBUG: Raw response structure:', {
        responseSuccess: response.success,
        dataIsArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        hasPagination: !!(response as any).pagination
      });
      
      // OPTIMIZED: Backend now provides comprehensive entity data from core_entities table
      const rawEntities = entitiesArray || [];
      const transformedEntities = rawEntities.map((entity: any) => ({
        ...entity,
        // Ensure consistent ID field mapping
        id: entity.id || entity.entity_id,
        entity_id: entity.id || entity.entity_id,
        // Map core_entities fields to consistent interface
        isVerified: entity.is_verified ?? entity.isVerified ?? false,
        is_verified: entity.is_verified ?? entity.isVerified ?? false,
        is_active: entity.is_active ?? true,
        // Map review stats from core_entities table
        reviewCount: entity.review_count || entity.reviewCount || 0,
        review_count: entity.review_count || entity.reviewCount || 0,
        averageRating: entity.average_rating || entity.averageRating || 0,
        average_rating: entity.average_rating || entity.averageRating || 0,
        viewCount: entity.total_views || entity.view_count || entity.viewCount || 0,
        view_count: entity.total_views || entity.view_count || entity.viewCount || 0,
        total_views: entity.total_views || entity.view_count || entity.viewCount || 0,
        // Enhanced engagement stats (if provided by backend)
        review_stats: {
          total_reviews: entity.review_count || entity.reviewCount || 0,
          average_rating: entity.average_rating || entity.averageRating || 0,
          total_reactions: entity.reactionCount || 0,
          total_comments: entity.commentCount || 0,
          total_views: entity.total_views || entity.view_count || entity.viewCount || 0
        },
        // Category mapping (handle both JSON and legacy formats)
        final_category: entity.final_category || (entity.final_category_id ? { id: entity.final_category_id, name: entity.final_category_name } : null),
        root_category: entity.root_category || (entity.root_category_id ? { id: entity.root_category_id, name: entity.root_category_name } : null),
        // Image handling
        imageUrl: entity.imageUrl || entity.avatar || this.generateEntityImage(entity),
        hasRealImage: Boolean(entity.avatar && !entity.avatar.includes('ui-avatars.com')),
        // Timestamp mapping
        createdAt: entity.created_at || entity.createdAt,
        updatedAt: entity.updated_at || entity.updatedAt,
        created_at: entity.created_at || entity.createdAt,
        updated_at: entity.updated_at || entity.updatedAt
      }));
      
      // Enhance entities with hierarchical categories (already optimized from backend)
      const enhancedEntities = transformedEntities.map((entity: Entity) => 
        enhanceEntityWithHierarchicalCategories(entity)
      );
      
      const result = {
        entities: enhancedEntities,
        total: pagination?.total || 0,
        hasMore: pagination?.pages > pagination?.page || false  // Use efficient backend flag
      };
      
      console.log('🔧 DEBUG: EntityService returning:', {
        entitiesCount: result.entities.length,
        total: result.total,
        hasMore: result.hasMore,
        firstEntityName: result.entities[0]?.name || 'none'
      });
      
      return result;
      
    } catch (error) {
      console.error('Error fetching entities:', error);
      throw error;
    }
  }
  
  /**
   * Search entities with advanced filtering
   */
  async searchEntities(query: string, filters: SearchFilters = {}): Promise<SearchResult> {
    try {
      const searchParams: EntitySearchParams = {
        query,
        category: filters.category,
        sortBy: filters.sortBy as any,
        sortOrder: filters.sortOrder,
        page: 1,
        limit: 20,
        verified: filters.verified,
        minRating: filters.rating?.min || filters.minRating,
        // New JSONB category filters
        root_category_id: filters.selectedRootCategory?.id,
        final_category_id: filters.selectedFinalCategory?.id
      };
      
      const response = await httpClient.post<EntityApiResponse>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.SEARCH}`, searchParams);
      
      if (!response.success) {
        throw new Error('Failed to search entities');
      }
      
      const entityData = response.data as any;
      const rawEntities = Array.isArray(entityData) ? entityData : (entityData?.entities || entityData?.items || []);
      
      // Enhance entities with hierarchical categories if they don't have them
      const enhancedEntities = rawEntities.map((entity: Entity) => 
        enhanceEntityWithHierarchicalCategories(entity)
      );
      
      return {
        entities: enhancedEntities,
        total: (response as any).pagination?.total || entityData?.total || 0,
        hasMore: (response as any).pagination?.page < (response as any).pagination?.pages || entityData?.has_next || false
      };
      
    } catch (error) {
      console.error('Error searching entities:', error);
      // Fallback to filtered getEntities
      return this.getEntities({ search: query, limit: 20 });
    }
  }
  
  /**
   * Get entity by ID
   */
  async getEntityById(id: string): Promise<Entity | null> {
    try {
      // First try the direct endpoint
      const response = await httpClient.get<{ success: boolean; data: any }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.GET_BY_ID(id)}`
      );
      
      if (response.success && response.data) {
        const entity = response.data as any;
        
        return {
          ...entity,
          // Ensure consistent ID field mapping
          id: entity.id || entity.entity_id || id,
          entity_id: entity.id || entity.entity_id || id,
          // Map core_entities fields to consistent interface
          isVerified: entity.is_verified ?? entity.isVerified ?? false,
          is_verified: entity.is_verified ?? entity.isVerified ?? false,
          is_active: entity.is_active ?? true,
          // Map review stats from core_entities table
          reviewCount: entity.review_count || entity.reviewCount || 0,
          review_count: entity.review_count || entity.reviewCount || 0,
          averageRating: entity.average_rating || entity.averageRating || 0,
          average_rating: entity.average_rating || entity.averageRating || 0,
          viewCount: entity.total_views || entity.view_count || entity.viewCount || 0,
          view_count: entity.total_views || entity.view_count || entity.viewCount || 0,
          total_views: entity.total_views || entity.view_count || entity.viewCount || 0,
          // Category mapping (handle both JSON and legacy formats)
          final_category: entity.final_category || (entity.final_category_id ? { id: entity.final_category_id, name: entity.final_category_name } : null),
          root_category: entity.root_category || (entity.root_category_id ? { id: entity.root_category_id, name: entity.root_category_name } : null),
          // Preserve both avatar and imageUrl for compatibility
          avatar: entity.avatar,
          imageUrl: entity.imageUrl || entity.avatar || this.generateEntityImage(entity),
          hasRealImage: Boolean(entity.avatar && !entity.avatar.includes('ui-avatars.com')),
          // Timestamp mapping
          createdAt: entity.created_at || entity.createdAt,
          updatedAt: entity.updated_at || entity.updatedAt,
          created_at: entity.created_at || entity.createdAt,
          updated_at: entity.updated_at || entity.updatedAt
        };
      }
    } catch (error) {
      console.warn('Direct entity fetch failed, trying fallback:', error);
    }
    
    // Fallback: Search for the entity in the list
    try {
      const entitiesResponse = await this.getEntities({ limit: 100 });
      const targetEntity = entitiesResponse.entities.find(entity => 
        String(entity.id || entity.entity_id) === String(id)
      );
      
      if (targetEntity) {
        return {
          ...targetEntity,
          // Ensure consistent ID field mapping  
          id: targetEntity.id || targetEntity.entity_id || id,
          entity_id: targetEntity.id || targetEntity.entity_id || id,
          // Core entities mapping is already handled by getEntities transformation
          imageUrl: targetEntity.imageUrl || targetEntity.avatar || this.generateEntityImage(targetEntity),
          hasRealImage: Boolean(targetEntity.avatar && !targetEntity.avatar.includes('ui-avatars.com'))
        };
      }
    } catch (fallbackError) {
      console.error('Fallback entity fetch also failed:', fallbackError);
    }
    
    return null;
  }
  
  /**
   * Create new entity
   */
  async createEntity(entityData: EntityFormData): Promise<Entity> {
    try {
      // Transform frontend EntityFormData to backend core_entities table format
      console.log('🖼️ entityService.createEntity - Input entityData:', entityData);
      console.log('🖼️ entityService.createEntity - Avatar field:', entityData.avatar);
      
      // Build the payload with JSONB-only approach
      // Frontend should already have proper category objects with full details
      const backendPayload = {
        // Core entity fields
        name: entityData.name,
        description: entityData.description,
        avatar: entityData.avatar || null,
        website: null,
        
        // JSONB category objects (source of truth)
        root_category: entityData.root_category || null,  // Should contain: {id, name, slug, icon, color, level}
        final_category: entityData.final_category || null,  // Should contain: {id, name, slug, icon, color, level}
        
        // JSONB fields for metadata
        metadata: {
          context: entityData.context || {},
          fields: entityData.fields || {},
          customFields: entityData.customFields || {}
        },
        
        // Additional data
        roles: entityData.additionalContexts || [],
        business_info: {},
        claim_data: {},
        view_analytics: {}
      };

      console.log('🖼️ entityService.createEntity - Final payload for core_entities:', backendPayload);
      console.log('🖼️ entityService.createEntity - Payload avatar field:', backendPayload.avatar);

      const response = await httpClient.post<{ success: boolean; data: Entity }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.CREATE}`,
        backendPayload
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to create entity');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error creating entity:', error);
      throw error;
    }
  }
  
  /**
   * Update existing entity
   */
  async updateEntity(id: string, entityData: Partial<EntityFormData>): Promise<Entity> {
    try {
      const response = await httpClient.put<{ success: boolean; data: Entity }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.UPDATE(id)}`,
        entityData
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to update entity');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error updating entity:', error);
      throw error;
    }
  }
  
  /**
   * Delete entity with confirmation
   */
  async deleteEntity(id: string, deleteRequest?: { confirmation: string; reason?: string }): Promise<void> {
    try {
      const response = await httpClient.delete<{ success: boolean }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.DELETE(id)}`,
        deleteRequest
      );
      
      if (!response.success) {
        throw new Error('Failed to delete entity');
      }
      
    } catch (error) {
      console.error('Error deleting entity:', error);
      throw error;
    }
  }
  
  /**
   * Get trending entities
   */
  async getTrendingEntities(limit: number = 10): Promise<Entity[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: { entities: Entity[] } }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.TRENDING}?limit=${limit}`
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch trending entities');
      }
      
      return response.data.entities || response.data.items || [];
      
    } catch (error) {
      console.error('Error fetching trending entities:', error);
      // Fallback to regular entities sorted by review count
      const result = await this.getEntities({ 
        limit, 
        sortBy: 'reviewCount', 
        sortOrder: 'desc', 
        hasReviews: true 
      });
      return result.entities;
    }
  }
  
  /**
   * Get entity statistics
   */
  async getEntityStats(entityId: string): Promise<EntityStatsResponse['data']> {
    try {
      const response = await httpClient.get<EntityStatsResponse>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.STATS(entityId)}`
      );
      
      if (!response.success) {
        throw new Error('Failed to fetch entity statistics');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error fetching entity statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get similar entities
   */
  async getSimilarEntities(entityId: string, limit: number = 5): Promise<Entity[]> {
    try {
      const response = await httpClient.get<{ success: boolean; data: { entities: Entity[] } }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.SIMILAR(entityId)}?limit=${limit}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return response.data.entities || response.data.items || [];
      
    } catch (error) {
      console.error('Error fetching similar entities:', error);
      return [];
    }
  }
  
  /**
   * Record entity view
   */
  async recordEntityView(entityId: string, userId: string): Promise<boolean> {
    try {
      const response = await httpClient.post<{ success: boolean }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.TRACK_VIEW(entityId)}`,
        { user_id: userId }
      );
      
      return response.success;
      
    } catch (error) {
      console.error('Error recording entity view:', error);
      return false;
    }
  }
  
  /**
   * Claim entity
   */
  async claimEntity(entityId: string): Promise<{ message: string; entity: Entity }> {
    try {
      const response = await httpClient.post<{ success: boolean; data: { message: string; entity: Entity } }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.CLAIM(entityId)}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to claim entity');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error claiming entity:', error);
      throw error;
    }
  }
  
  /**
   * Unclaim entity
   */
  async unclaimEntity(entityId: string): Promise<{ message: string; entity: Entity }> {
    try {
      const response = await httpClient.post<{ success: boolean; data: { message: string; entity: Entity } }>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.UNCLAIM(entityId)}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to unclaim entity');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error unclaiming entity:', error);
      throw error;
    }
  }
  
  /**
   * Get entities by category
   */
  async getEntitiesByCategory(category: EntityCategory, limit: number = 20): Promise<SearchResult> {
    return this.getEntities({ category, limit, sortBy: 'rating', sortOrder: 'desc' });
  }
  
  /**
   * Get verified entities
   */
  async getVerifiedEntities(limit: number = 20): Promise<SearchResult> {
    return this.getEntities({ verified: true, limit, sortBy: 'rating', sortOrder: 'desc' });
  }

  /**
   * Get highly rated entities
   */
  async getHighlyRatedEntities(minRating: number = 4.0, limit: number = 20): Promise<SearchResult> {
    return this.getEntities({ minRating, limit, sortBy: 'rating', sortOrder: 'desc', hasReviews: true });
  }
  
  /**
   * Get recent entities
   */
  async getRecentEntities(limit: number = 20): Promise<SearchResult> {
    return this.getEntities({ limit, sortBy: 'createdAt', sortOrder: 'desc' });
  }
  
  /**
   * Get top rated entities
   */
  async getTopRatedEntities(limit: number = 20): Promise<SearchResult> {
    return this.getEntities({ limit, sortBy: 'rating', sortOrder: 'desc', hasReviews: true });
  }
  
  /**
   * Get entities created/provided by a specific user
   */
  async getEntitiesByUser(userId: string, params: EntityListParams = {}): Promise<SearchResult> {
    try {
      const searchParams = new URLSearchParams();
      
      // Add pagination parameters
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      
      // Add sorting parameters
      if (params.sortBy) {
        const sortByMap: Record<string, string> = {
          'name': 'name',
          'rating': 'rating',
          'reviewCount': 'review_count',
          'createdAt': 'created_at',
          'relevance': 'relevance',
          'trending': 'trending'
        };
        searchParams.append('sort_by', sortByMap[params.sortBy] || 'created_at');
      }
      if (params.sortOrder) searchParams.append('sort_order', params.sortOrder);
      
      const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.BY_USER(userId)}?${searchParams.toString()}`;
      console.log('📋 EntityService.getEntitiesByUser: API call to:', url);
      const response = await httpClient.get<EntityApiResponse>(url);
      
      if (!response.success) {
        console.error('📋 EntityService.getEntitiesByUser: API returned error:', response);
        throw new Error('Failed to fetch user entities');
      }
      
      // Handle the backend response structure: { success, data: Entity[], pagination, message }
      console.log('📋 EntityService.getEntitiesByUser: Raw response structure:', {
        success: response.success,
        dataIsArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'not array',
        paginationExists: !!(response as any).pagination,
        fullResponse: response
      });
      
      const entities = Array.isArray(response.data) ? response.data : [];
      const pagination = (response as any).pagination || {
        total: 0,
        page: 1,
        limit: 6,
        pages: 0
      };
      
      const normalizedEntities = entities.map((entity: any) => {
        const normalizedEntity = {
          ...entity,
          id: entity.id || entity.entity_id,
          imageUrl: entity.imageUrl || entity.avatar || this.generateEntityImage(entity),
          hasRealImage: Boolean(entity.avatar && !entity.avatar.includes('ui-avatars.com'))
        };
        // Enhance with hierarchical category data for consistent display
        return enhanceEntityWithHierarchicalCategories(normalizedEntity);
      });

      const result = {
        entities: normalizedEntities,
        total: pagination.total,
        page: pagination.page,
        limit: pagination.limit,
        hasMore: pagination.page < pagination.pages,
        hasPrev: pagination.page > 1
      };

      console.log('📋 EntityService.getEntitiesByUser: Final result:', {
        entitiesCount: result.entities.length,
        total: result.total,
        hasMore: result.hasMore,
        firstEntityName: result.entities[0]?.name || 'no entities'
      });

      return result;
      
    } catch (error) {
      console.error('Error fetching user entities:', error);
      throw error;
    }
  }
  
  /**
   * Get entities by subcategory
   */
  async getEntitiesBySubcategory(subcategory: string, params: Omit<EntityListParams, 'subcategory'> = {}): Promise<SearchResult> {
    return this.getEntities({ ...params, subcategory });
  }
  
  /**
   * Compare entities
   */
  async compareEntities(entityIds: string[]): Promise<{ 
    entities: Entity[]; 
    criteria: string[]; 
    matrix: Record<string, Record<string, number | string>>; 
  }> {
    try {
      const response = await httpClient.post<{ 
        success: boolean; 
        data: { 
          entities: Entity[]; 
          criteria: string[]; 
          matrix: Record<string, Record<string, number | string>>; 
        } 
      }>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.COMPARE}`, { entityIds });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to compare entities');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error comparing entities:', error);
      throw error;
    }
  }
  
  /**
   * Bulk operations
   */
  async bulkOperations(operations: Array<{ 
    action: 'create' | 'update' | 'delete'; 
    data?: any; 
    id?: string; 
  }>): Promise<{ 
    success: string[]; 
    failed: Array<{ id: string; error: string }>; 
  }> {
    try {
      const response = await httpClient.post<{ 
        success: boolean; 
        data: { 
          success: string[]; 
          failed: Array<{ id: string; error: string }>; 
        } 
      }>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.ENTITIES.BULK_OPERATIONS}`, { operations });
      
      if (!response.success || !response.data) {
        throw new Error('Failed to perform bulk operations');
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error performing bulk operations:', error);
      throw error;
    }
  }
  
  /**
   * Generate fallback entity image
   */
  private generateEntityImage(entity: any): string {
    const name = encodeURIComponent(entity.name || 'Entity');
    const category = entity.category || 'default';
    
    const categoryColors: Record<string, string> = {
      'companies': '2563eb',
      'professionals': '059669',
      'places': 'dc2626',
      'products': 'ea580c',
      'default': '6b7280'
    };
    
    const bgColor = categoryColors[category] || categoryColors.default;
    
    return `https://ui-avatars.com/api/?name=${name}&background=${bgColor}&color=ffffff&size=200&rounded=true&font-size=0.4`;
  }
}

// Export singleton instance
export const entityService = new EntityService();
export default entityService;