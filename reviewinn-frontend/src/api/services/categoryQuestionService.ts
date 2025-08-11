import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';

export interface CategoryQuestion {
  id: string;
  label: string;
  description?: string;
  type: 'rating' | 'text' | 'select' | 'multiselect';
  required: boolean;
  maxRating?: number;
  options?: string[];
  order: number;
}

export interface CategoryQuestionsResponse {
  questions: CategoryQuestion[];
  category_name: string;
  category_path: string;
  is_fallback: boolean;
  fallback_reason?: string;
  source: 'specific' | 'fallback' | 'parent_fallback' | 'root_fallback' | 'final_fallback';
  fallback_from?: string;
}

export class CategoryQuestionService {
  /**
   * Get review questions for a specific entity
   * Uses hierarchical fallback logic: final_category -> parent categories -> root_category -> other
   */
  async getQuestionsForEntity(entityId: string | number): Promise<CategoryQuestionsResponse | null> {
    try {
      console.log(`🎯 Fetching questions for entity: ${entityId}`);
      
      const response = await httpClient.get<{ success: boolean; data: CategoryQuestionsResponse }>(
        `/api/v1/category-questions/entity/${entityId}`
      );
      
      if (response.success && response.data) {
        console.log(`✅ Questions fetched successfully for entity ${entityId}:`, {
          category: response.data.category_name,
          questionCount: response.data.questions.length,
          source: response.data.source,
          isFallback: response.data.is_fallback
        });
        
        return response.data;
      }
      
      console.warn(`⚠️ No questions found for entity ${entityId}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error fetching questions for entity ${entityId}:`, error);
      // Return null instead of throwing to allow graceful fallback
      return null;
    }
  }

  /**
   * Get review questions for a specific category path
   */
  async getQuestionsForCategory(categoryPath: string): Promise<CategoryQuestionsResponse | null> {
    try {
      console.log(`🎯 Fetching questions for category: ${categoryPath}`);
      
      const response = await httpClient.get<{ success: boolean; data: CategoryQuestionsResponse }>(
        `/api/v1/category-questions/category/${categoryPath}`
      );
      
      if (response.success && response.data) {
        console.log(`✅ Questions fetched successfully for category ${categoryPath}:`, {
          questionCount: response.data.questions.length,
          source: response.data.source
        });
        
        return response.data;
      }
      
      console.warn(`⚠️ No questions found for category ${categoryPath}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error fetching questions for category ${categoryPath}:`, error);
      return null;
    }
  }

  /**
   * Get all categories that have questions defined
   */
  async getAllCategoriesWithQuestions(): Promise<{ category_path: string; category_name: string; question_count: number }[]> {
    try {
      const response = await httpClient.get<{ 
        success: boolean; 
        data: { category_path: string; category_name: string; question_count: number }[];
        total_count: number;
      }>('/api/v1/category-questions/');
      
      if (response.success && response.data) {
        console.log(`✅ Fetched ${response.total_count} categories with questions`);
        return response.data;
      }
      
      return [];
      
    } catch (error) {
      console.error('❌ Error fetching categories with questions:', error);
      return [];
    }
  }

  /**
   * Convert CategoryQuestion to legacy SubcategoryConfig format for backward compatibility
   */
  convertToLegacyFormat(questionsResponse: CategoryQuestionsResponse): {
    id: string;
    label: string;
    parentCategory: any; // Use any to avoid enum import issues
    criteria: Array<{
      id: string;
      name: string;
      description: string;
      maxRating: number;
      isRequired: boolean;
    }>;
    fields: Array<any>;
  } {
    const rootCategoryPath = questionsResponse.category_path.split('.')[0] || 'other';
    
    return {
      id: questionsResponse.category_path,
      label: questionsResponse.category_name,
      parentCategory: rootCategoryPath as any, // Convert to proper enum in the caller
      criteria: questionsResponse.questions
        .filter(q => q.type === 'rating')
        .map(q => ({
          id: q.id,
          name: q.label,
          description: q.description || q.label,
          maxRating: q.maxRating || 5,
          isRequired: q.required
        })),
      fields: questionsResponse.questions
        .filter(q => q.type !== 'rating')
        .map(q => ({
          id: q.id,
          name: q.label,
          type: q.type,
          required: q.required,
          options: q.options || []
        }))
    };
  }
}

// Export a singleton instance
export const categoryQuestionService = new CategoryQuestionService();