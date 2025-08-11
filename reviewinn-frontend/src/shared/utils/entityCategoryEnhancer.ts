/**
 * Utility to enhance entities with hierarchical category data
 * when the API doesn't provide it natively
 */

import type { Entity } from '../../types';
import type { CategoryInfo, CategoryBreadcrumb } from '../../types';

interface CategoryEnhancementOptions {
  category: string;
  subcategory?: string;
}

/**
 * Generate hierarchical category data from basic category/subcategory
 */
export function generateHierarchicalCategoryData(options: CategoryEnhancementOptions) {
  const { category, subcategory } = options;
  
  const rootCategoryData: CategoryInfo = {
    id: 1,
    name: category,
    slug: category.toLowerCase().replace(/\s+/g, '-'),
    level: 1,
    icon: getCategoryIcon(category),
    color: getCategoryColor(category)
  };
  
  const finalCategoryData: CategoryInfo = subcategory && subcategory !== category ? {
    id: 2,
    name: subcategory,
    slug: subcategory.toLowerCase().replace(/\s+/g, '-'),
    level: 2,
    icon: '🏷️',
    color: '#10b981'
  } : rootCategoryData;
  
  const categoryBreadcrumb: CategoryBreadcrumb[] = subcategory && subcategory !== category ? [
    { id: 1, name: category, slug: rootCategoryData.slug, level: 1 },
    { id: 2, name: subcategory, slug: finalCategoryData.slug, level: 2 }
  ] : [
    { id: 1, name: category, slug: rootCategoryData.slug, level: 1 }
  ];
  
  const categoryDisplay = subcategory && subcategory !== category 
    ? `${category} > ${subcategory}` 
    : category;
  
  return {
    root_category: rootCategoryData,
    final_category: finalCategoryData,
    category_breadcrumb: categoryBreadcrumb,
    category_display: categoryDisplay
  };
}

/**
 * Enhance an entity with hierarchical category data if missing
 */
export function enhanceEntityWithHierarchicalCategories(entity: Entity): Entity {
  // If entity already has hierarchical category data, return as-is
  if (entity.root_category && entity.final_category) {
    return entity;
  }
  
  // Check if entity has valid category data
  if (!entity.category) {
    console.warn('Entity has no category data, using default:', entity);
    // Provide default category data so at least something shows
    const defaultCategory = 'professionals'; // Default fallback
    const hierarchicalData = generateHierarchicalCategoryData({
      category: defaultCategory,
      subcategory: entity.subcategory
    });
    
    return {
      ...entity,
      category: defaultCategory as any,
      root_category_id: hierarchicalData.root_category.id,
      final_category_id: hierarchicalData.final_category.id,
      category_breadcrumb: hierarchicalData.category_breadcrumb,
      category_display: hierarchicalData.category_display,
      root_category: hierarchicalData.root_category,
      final_category: hierarchicalData.final_category
    };
  }
  
  // Generate hierarchical data from basic category/subcategory
  const hierarchicalData = generateHierarchicalCategoryData({
    category: entity.category.toString(),
    subcategory: entity.subcategory
  });
  
  return {
    ...entity,
    root_category_id: entity.root_category_id || hierarchicalData.root_category.id,
    final_category_id: entity.final_category_id || hierarchicalData.final_category.id,
    category_breadcrumb: entity.category_breadcrumb || hierarchicalData.category_breadcrumb,
    category_display: entity.category_display || hierarchicalData.category_display,
    root_category: entity.root_category || hierarchicalData.root_category,
    final_category: entity.final_category || hierarchicalData.final_category
  };
}

// Helper functions for category icons and colors
function getCategoryIcon(category: string): string {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('professional') || categoryLower.includes('doctor') || categoryLower.includes('lawyer')) return '👨‍⚕️';
  if (categoryLower.includes('company') || categoryLower.includes('business')) return '🏢';
  if (categoryLower.includes('place') || categoryLower.includes('restaurant') || categoryLower.includes('hotel')) return '🏪';
  if (categoryLower.includes('product') || categoryLower.includes('service')) return '📦';
  return '📁';
}

function getCategoryColor(category: string): string {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('professional')) return '#3b82f6';
  if (categoryLower.includes('company')) return '#10b981';
  if (categoryLower.includes('place')) return '#f59e0b';
  if (categoryLower.includes('product')) return '#8b5cf6';
  return '#6b7280';
}