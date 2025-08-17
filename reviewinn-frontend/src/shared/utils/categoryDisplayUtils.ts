/**
 * Utility functions for category display and management
 * Consolidates category-related logic to reduce redundancy
 */

import { EntityCategory } from '../../types';

export interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  level?: number;
  icon?: string;
  color?: string;
}

export interface CategoryBreadcrumbItem {
  id: number;
  name: string;
  slug: string;
  level: number;
}

/**
 * Build category breadcrumb from entity data
 */
export function buildCategoryBreadcrumb(
  rootCategory?: CategoryInfo | null,
  finalCategory?: CategoryInfo | null,
  providedBreadcrumb?: CategoryBreadcrumbItem[] | string[]
): CategoryBreadcrumbItem[] {
  // If breadcrumb is provided as string array (from API), convert it
  if (providedBreadcrumb && providedBreadcrumb.length > 0) {
    if (typeof providedBreadcrumb[0] === 'string') {
      // Convert string array to proper breadcrumb format
      return (providedBreadcrumb as string[]).map((name, index) => ({
        id: index + 1, // Temporary ID
        name: name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        level: index + 1
      }));
    } else {
      return providedBreadcrumb as CategoryBreadcrumbItem[];
    }
  }

  // If no final category, return empty
  if (!finalCategory) {
    return [];
  }

  const breadcrumb: CategoryBreadcrumbItem[] = [];

  // Add root category if different from final
  if (rootCategory && rootCategory.id !== finalCategory.id) {
    breadcrumb.push({
      id: rootCategory.id,
      name: rootCategory.name,
      slug: rootCategory.slug,
      level: rootCategory.level || 1
    });
  }

  // Add final category
  breadcrumb.push({
    id: finalCategory.id,
    name: finalCategory.name,
    slug: finalCategory.slug,
    level: finalCategory.level || 1
  });

  return breadcrumb;
}

/**
 * Build human-readable category display string
 */
export function buildCategoryDisplay(
  rootCategory?: CategoryInfo | null,
  finalCategory?: CategoryInfo | null,
  providedDisplay?: string | null
): string {
  // If display string is provided, use it
  if (providedDisplay) {
    return providedDisplay;
  }

  const breadcrumb = buildCategoryBreadcrumb(rootCategory, finalCategory);
  return breadcrumb.map(item => item.name).join(' > ');
}

/**
 * Infer root category name from final category name
 */
function inferRootCategoryFromFinal(finalCategoryName: string): string | null {
  const lowerName = finalCategoryName.toLowerCase();
  
  // Map final categories to their likely root categories
  if (lowerName.includes('professor') || lowerName.includes('doctor') || lowerName.includes('lawyer') || 
      lowerName.includes('engineer') || lowerName.includes('consultant') || lowerName.includes('therapist')) {
    return 'Professionals';
  }
  
  if (lowerName.includes('restaurant') || lowerName.includes('hotel') || lowerName.includes('hospital') || 
      lowerName.includes('school') || lowerName.includes('university') || lowerName.includes('shop') ||
      lowerName.includes('store') || lowerName.includes('center') || lowerName.includes('clinic')) {
    return 'Places & Venues';
  }
  
  if (lowerName.includes('company') || lowerName.includes('corporation') || lowerName.includes('business') ||
      lowerName.includes('agency') || lowerName.includes('firm') || lowerName.includes('organization')) {
    return 'Companies & Organizations';
  }
  
  if (lowerName.includes('product') || lowerName.includes('service') || lowerName.includes('software') ||
      lowerName.includes('app') || lowerName.includes('tool') || lowerName.includes('device')) {
    return 'Products & Services';
  }
  
  // For "University Professors" specifically
  if (lowerName.includes('university') && lowerName.includes('professor')) {
    return 'Professionals';
  }
  
  return null; // Can't infer
}

/**
 * Convert unified category to legacy EntityCategory
 */
export function convertToLegacyCategory(categorySlug: string): EntityCategory {
  const slug = categorySlug.toLowerCase();
  
  if (slug.includes('professional') || slug.includes('person') || slug.includes('people')) {
    return EntityCategory.PROFESSIONALS;
  }
  if (slug.includes('compan') || slug.includes('business') || slug.includes('organization')) {
    return EntityCategory.COMPANIES;
  }
  if (slug.includes('place') || slug.includes('location') || slug.includes('venue')) {
    return EntityCategory.PLACES;
  }
  if (slug.includes('product') || slug.includes('service') || slug.includes('item')) {
    return EntityCategory.PRODUCTS;
  }
  
  return EntityCategory.PROFESSIONALS; // Default fallback
}

/**
 * Normalize entity data to ensure consistent category fields
 */
export function normalizeEntityCategoryData(entity: any): {
  categoryBreadcrumb: CategoryBreadcrumbItem[];
  categoryDisplay: string;
  rootCategory?: CategoryInfo;
  finalCategory?: CategoryInfo;
} {
  // Debug logging disabled for performance

  // Handle different possible field names from API responses
  let rootCategory = entity.root_category || entity.rootCategory as CategoryInfo | undefined;
  let finalCategory = entity.final_category || entity.finalCategory as CategoryInfo | undefined;
  const providedBreadcrumb = entity.category_breadcrumb || entity.categoryBreadcrumb;
  const providedDisplay = entity.category_display || entity.categoryDisplay;

  // NEW FALLBACK: Build category objects from name/ID fields if relationship objects missing
  // This happens on homepage reviews where only *_category_name & *_category_id arrive
  if (!rootCategory && (entity.root_category_name || entity.rootCategoryName)) {
    const name = entity.root_category_name || entity.rootCategoryName;
    if (name && name !== 'null' && name !== 'undefined' && name !== 'Root Category' && name !== 'Unknown Category') {
      rootCategory = {
        id: entity.root_category_id || entity.rootCategoryId || -1,
        name,
        slug: (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        level: 1
      };
    }
  }
  
  // SPECIAL CASE: If no root category but we have a final category, try to infer the root category
  if (!rootCategory && finalCategory) {
    // Try to determine root category from final category name
    const finalCategoryName = finalCategory.name || entity.final_category_name || entity.finalCategoryName;
    if (finalCategoryName) {
      const inferredRootName = inferRootCategoryFromFinal(finalCategoryName);
      if (inferredRootName) {
        rootCategory = {
          id: -1, // Temporary ID
          name: inferredRootName,
          slug: inferredRootName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          level: 1
        };
      }
    }
  }
  if (!finalCategory && (entity.final_category_name || entity.finalCategoryName)) {
    const name = entity.final_category_name || entity.finalCategoryName;
    if (name && name !== 'null' && name !== 'undefined') {
      finalCategory = {
        id: entity.final_category_id || entity.finalCategoryId || (rootCategory ? rootCategory.id : -1),
        name,
        slug: (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        // If same as root or no explicit level given, default intelligently
        level: entity.final_category_level || (rootCategory && rootCategory.id === (entity.final_category_id || entity.finalCategoryId) ? rootCategory.level :  (entity.final_category_id ? 2 : 1))
      };
    }
  }

  const result = {
    categoryBreadcrumb: buildCategoryBreadcrumb(rootCategory, finalCategory, providedBreadcrumb),
    categoryDisplay: buildCategoryDisplay(rootCategory, finalCategory, providedDisplay),
    rootCategory,
    finalCategory
  };

  // Debug logging disabled for performance

  return result;
}