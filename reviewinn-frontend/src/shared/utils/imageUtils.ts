import type { Entity } from '../../types';

/**
 * Image utility functions for consistent image handling across the application
 */

/**
 * Get entity image with correct priority order
 * Priority: 1) imageUrl first, 2) avatar second, 3) generated fallback
 */
export const getEntityImage = (entity: Entity | any, entityName?: string): string => {
  if (!entity) return '';
  
  // Primary image sources in priority order
  const primaryImage = entity.imageUrl || entity.avatar || entity.image_url;
  
  if (primaryImage) {
    return primaryImage;
  }
  
  // Fallback to generated avatar
  const name = entityName || entity.name || 'Entity';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=ffffff&size=200&rounded=true`;
};

/**
 * Check if entity has a real (non-generated) image
 */
export const hasRealEntityImage = (entity: Entity | any): boolean => {
  if (!entity) return false;
  
  const primaryImage = entity.imageUrl || entity.avatar || entity.image_url;
  return Boolean(primaryImage && !primaryImage.includes('ui-avatars.com'));
};

/**
 * Get entity display avatar with proper fallback
 * Same as getEntityImage but with clearer naming for avatar contexts
 */
export const getEntityAvatar = (entity: Entity | any, entityName?: string): string => {
  return getEntityImage(entity, entityName);
};

/**
 * Entity image priority explanation:
 * 1. imageUrl - Primary image field (camelCase)
 * 2. avatar - Secondary image field 
 * 3. image_url - Backend variant (snake_case)
 * 4. Generated fallback - UI-avatars with entity name
 */
export const IMAGE_PRIORITY_ORDER = [
  'imageUrl',   // Primary - camelCase format
  'avatar',     // Secondary - legacy/alternate field
  'image_url'   // Tertiary - snake_case backend variant
] as const;

/**
 * Get the source of the image being used (for debugging)
 */
export const getEntityImageSource = (entity: Entity | any): 'imageUrl' | 'avatar' | 'image_url' | 'generated' => {
  if (!entity) return 'generated';
  
  if (entity.imageUrl) return 'imageUrl';
  if (entity.avatar) return 'avatar';
  if (entity.image_url) return 'image_url';
  return 'generated';
};