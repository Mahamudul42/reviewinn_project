import type { Entity, SubcategoryConfig, CriteriaConfig } from '../types/index';
import { EntityCategory } from '../types/index';

// Cache for category questions to avoid repeated API calls
const questionCache = new Map<string, SubcategoryConfig>();
const cacheTimeout = 5 * 60 * 1000; // 5 minutes

export const getSubcategoryConfig = async (entity: Entity): Promise<SubcategoryConfig> => {
  const entityId = entity.entity_id || entity.id;
  const cacheKey = `entity_${entityId}`;
  
  console.log(`🎯 Loading questions for entity: ${entity.name} (ID: ${entityId})`);
  
  // Check cache first
  if (questionCache.has(cacheKey)) {
    const cached = questionCache.get(cacheKey)!;
    console.log(`💾 Using cached questions for entity ${entityId}`);
    return cached;
  }
  
  try {
    // Try to fetch questions from API using entity ID
    const response = await fetch(`/api/v1/category-questions/entity/${entityId}`);
    
    if (response.ok) {
      const apiData = await response.json();
      if (apiData.success && apiData.data) {
        console.log(`✅ Loaded ${apiData.data.questions.length} API questions for entity ${entityId}`);
        const config = convertApiResponseToLegacyFormat(entity, apiData.data);
        
        // Cache the result
        questionCache.set(cacheKey, config);
        setTimeout(() => questionCache.delete(cacheKey), cacheTimeout);
        
        return config;
      }
    }
    
    console.log(`⚠️ API call failed or returned empty for entity ${entityId}, using fallback`);
    
  } catch (error) {
    console.error(`❌ Error fetching questions for entity ${entityId}:`, error);
  }
  
  // Fallback to basic config if API fails
  console.log(`🔄 Using basic fallback questions for entity ${entityId}`);
  const basicConfig = createBasicSubcategoryConfig(entity);
  
  // Cache the fallback config too
  questionCache.set(cacheKey, basicConfig);
  setTimeout(() => questionCache.delete(cacheKey), cacheTimeout);
  
  return basicConfig;
};

// Convert API response to legacy SubcategoryConfig format
function convertApiResponseToLegacyFormat(entity: Entity, apiData: any): SubcategoryConfig {
  // Ensure we have a valid EntityCategory
  let parentCategory: EntityCategory;
  if (typeof entity.category === 'string') {
    parentCategory = entity.category as EntityCategory;
  } else {
    parentCategory = entity.category || EntityCategory.PRODUCTS;
  }

  return {
    id: apiData.category_path || entity.subcategory || 'default',
    label: apiData.category_name || entity.category_display || 'Default',
    parentCategory: parentCategory,
    fields: [],
    criteria: (apiData.questions || [])
      .filter((q: any) => q.type === 'rating' || !q.type) // Include rating questions and legacy questions without type
      .map((q: any) => ({
        id: q.key || q.id || q.label?.toLowerCase().replace(/\s+/g, '_'),
        name: q.question || q.label || q.name,
        description: q.description || q.question || q.label,
        maxRating: q.maxRating || 5,
        isRequired: q.required !== false // Default to required unless explicitly false
      }))
  };
}

// Synchronous version for backward compatibility (uses cache or basic questions)
export const getSubcategoryConfigSync = (entity: Entity): SubcategoryConfig => {
  const entityId = entity.entity_id || entity.id;
  const cacheKey = `entity_${entityId}`;
  
  // Check cache first
  if (questionCache.has(cacheKey)) {
    return questionCache.get(cacheKey)!;
  }
  
  // Return basic config if not cached
  console.log(`⚠️ No cached questions for entity ${entityId}, using basic config`);
  return createBasicSubcategoryConfig(entity);
};

const createBasicSubcategoryConfig = (entity: Entity): SubcategoryConfig => {
  // Convert entity.category to EntityCategory enum
  let parentCategory: EntityCategory;
  if (typeof entity.category === 'string') {
    parentCategory = entity.category as EntityCategory;
  } else {
    parentCategory = entity.category || EntityCategory.PRODUCTS;
  }

  return {
    id: entity.subcategory || entity.final_category_id?.toString() || 'default',
    label: entity.category_display || entity.subcategory || 'Default',
    parentCategory: parentCategory,
    fields: [],
    criteria: createBasicCriteria()
  };
};

const createBasicCriteria = (): CriteriaConfig[] => {
  return [
    {
      id: 'overall_quality',
      name: 'Overall Quality',
      description: 'General quality and satisfaction (1-5 scale)',
      maxRating: 5,
      isRequired: true
    },
    {
      id: 'service_quality',
      name: 'Service Quality',
      description: 'Quality of service provided (1-5 scale)',
      maxRating: 5,
      isRequired: true
    },
    {
      id: 'reliability',
      name: 'Reliability',
      description: 'Consistency and dependability (1-5 scale)',
      maxRating: 5,
      isRequired: true
    },
    {
      id: 'satisfaction',
      name: 'Overall Satisfaction',
      description: 'General satisfaction with the experience (1-5 scale)',
      maxRating: 5,
      isRequired: true
    },
    {
      id: 'value_for_money',
      name: 'Value for Money',
      description: 'Cost-effectiveness and worth (1-5 scale)',
      maxRating: 5,
      isRequired: true
    }
  ];
};

export const validateRequiredCriteria = (
  subcategoryConfig: SubcategoryConfig,
  ratings: Record<string, number>
): string[] => {
  const errors: string[] = [];
  
  subcategoryConfig.criteria
    .filter(criterion => criterion.isRequired)
    .forEach(criterion => {
      if (!ratings[criterion.id] || ratings[criterion.id] === 0) {
        errors.push(`${criterion.name} rating is required`);
      }
    });
    
  return errors;
};

export const validateRequiredFields = (
  subcategoryConfig: SubcategoryConfig,
  formData: Record<string, any>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  subcategoryConfig.fields
    .filter(field => field.required)
    .forEach(field => {
      const value = formData[field.id];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors[field.id] = `${field.name} is required`;
      }
    });
    
  return errors;
};

export const calculateOverallRating = (
  subcategoryConfig: SubcategoryConfig,
  ratings: Record<string, number>
): number => {
  const validRatings = subcategoryConfig.criteria
    .map(criterion => ratings[criterion.id])
    .filter(rating => rating && rating > 0);
    
  if (validRatings.length === 0) {
    return 1; // Minimum rating of 1 instead of 0
  }
  
  const sum = validRatings.reduce((acc, rating) => acc + rating, 0);
  const average = sum / validRatings.length;
  return Math.max(1, Math.min(5, Math.round(average * 10) / 10)); // Ensure rating is between 1 and 5
};