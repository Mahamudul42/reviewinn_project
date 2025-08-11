import type { Entity } from '../../types';
import type { HomepageEntity } from '../../api/services/homepageService';
import type { EnhancedEntity } from '../components/UnifiedEntityCard';

/**
 * Converts HomepageEntity (from homepage service) to EnhancedEntity format
 */
export function convertHomepageEntityToEnhanced(homepageEntity: HomepageEntity): EnhancedEntity {
  return {
    id: homepageEntity.entity_id.toString(),
    entity_id: homepageEntity.entity_id,
    name: homepageEntity.name,
    description: homepageEntity.description,
    // Use hierarchical categories exclusively
    root_category_name: homepageEntity.root_category_name,
    final_category_name: homepageEntity.final_category_name,
    root_category_id: homepageEntity.root_category_id,
    final_category_id: homepageEntity.final_category_id,
    avatar: homepageEntity.avatar,
    
    // Map homepage service fields to unified format
    averageRating: homepageEntity.average_rating,
    average_rating: homepageEntity.average_rating,
    reviewCount: homepageEntity.review_count,
    review_count: homepageEntity.review_count,
    isVerified: homepageEntity.is_verified,
    is_verified: homepageEntity.is_verified,
    isClaimed: homepageEntity.is_claimed,
    is_claimed: homepageEntity.is_claimed,
    
    createdAt: homepageEntity.created_at,
    created_at: homepageEntity.created_at,
  };
}

/**
 * Converts regular Entity (from entity service) to EnhancedEntity format
 */
export function convertEntityToEnhanced(entity: Entity): EnhancedEntity {
  // Handle new unified backend format with review_stats
  const reviewStats = (entity as any).review_stats;
  // console.log('🔄 Converting entity to enhanced:', entity.name, 'review_stats:', reviewStats);
  
  return {
    ...entity,
    // Ensure ID fields are consistent
    id: entity.id || entity.entity_id,
    entity_id: entity.entity_id || entity.id,
    
    // Map review_stats from unified backend service
    averageRating: reviewStats?.average_rating || entity.averageRating || 0,
    average_rating: reviewStats?.average_rating || entity.averageRating || 0,
    reviewCount: reviewStats?.total_reviews || entity.reviewCount || 0,
    review_count: reviewStats?.total_reviews || entity.reviewCount || 0,
    
    // Ensure both field naming conventions are available
    is_verified: entity.isVerified || entity.is_verified,
    is_claimed: entity.isClaimed || entity.is_claimed,
    view_count: entity.view_count,
    created_at: entity.createdAt || entity.created_at,
    updated_at: entity.updatedAt || entity.updated_at,
    
    // Include image and engagement metrics
    avatar: entity.imageUrl || entity.avatar,
    imageUrl: entity.imageUrl || entity.avatar,
    totalReactions: (entity as any).totalReactions || 0,
    totalComments: (entity as any).totalComments || 0,
    totalViews: (entity as any).totalViews || entity.view_count || 0,
  };
}

/**
 * Normalizes any entity-like object to EnhancedEntity format
 */
export function normalizeEntityData(entity: any): EnhancedEntity {
  // If it looks like a HomepageEntity
  if (entity.entity_id && entity.average_rating !== undefined) {
    return convertHomepageEntityToEnhanced(entity as HomepageEntity);
  }
  
  // If it's a regular Entity or already enhanced
  return convertEntityToEnhanced(entity as Entity);
}

/**
 * Gets the display-ready entity ID (handles both string and number IDs)
 */
export function getEntityId(entity: EnhancedEntity): string {
  return (entity.id || entity.entity_id)?.toString() || '';
}

/**
 * Gets the entity's average rating (handles multiple field names)
 */
export function getEntityRating(entity: EnhancedEntity): number {
  return entity.averageRating || entity.average_rating || 0;
}

/**
 * Gets the entity's review count (handles multiple field names)
 */
export function getEntityReviewCount(entity: EnhancedEntity): number {
  return entity.reviewCount || entity.review_count || 0;
}

/**
 * Gets the entity's verification status (handles multiple field names)
 */
export function isEntityVerified(entity: EnhancedEntity): boolean {
  return entity.isVerified || entity.is_verified || false;
}

/**
 * Gets the entity's claimed status (handles multiple field names)
 */
export function isEntityClaimed(entity: EnhancedEntity): boolean {
  return entity.isClaimed || entity.is_claimed || false;
}

/**
 * Gets the entity's view count (handles multiple field names)
 */
export function getEntityViewCount(entity: EnhancedEntity): number {
  return entity.viewCount || entity.view_count || 0;
}