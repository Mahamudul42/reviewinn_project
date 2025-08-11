/**
 * AI Category Service
 * Handles API calls for AI-powered category processing
 */

import { apiClient } from './api';

export interface CategorySuggestion {
  id: number | null;
  name: string;
  path?: string;
  level?: number;
  is_existing: boolean;
  relevance_score?: number;
  breadcrumb?: Array<{ id: number; name: string; level: number }>;
  source?: string;
}

export interface AutocompleteResult {
  corrected_name: string;
  is_existing: boolean;
  existing_category_id: number | null;
  suggested_parent_id?: number | null;
  suggested_parent_name?: string;
  confidence: number;
  reasoning: string;
  alternative_suggestions: string[];
}

export interface CategoryCreationResult {
  category_id: number;
  category: {
    id: number;
    name: string;
    slug: string;
    path: string;
    level: number;
    parent_id?: number;
  };
  questions: Array<{
    key: string;
    question: string;
    description: string;
  }>;
  questions_created: boolean;
  processing_steps: Array<{
    step: string;
    result?: any;
  }>;
}

export interface HierarchyPlacement {
  root_category_id: number;
  root_category_name: string;
  parent_category_id: number;
  parent_category_name: string;
  suggested_level: number;
  intermediate_categories?: Array<{
    name: string;
    level: number;
  }>;
  reasoning: string;
  confidence: number;
}

class AICategoryService {
  private baseUrl = '/api/v1/ai-categories';

  /**
   * Get AI-powered category suggestions based on query
   */
  async getSuggestions(query: string, limit: number = 10): Promise<CategorySuggestion[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/suggestions/${encodeURIComponent(query)}?limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Error getting category suggestions:', error);
      throw error;
    }
  }

  /**
   * Autocomplete and correct user-typed category using AI
   */
  async autocompleteCategory(userInput: string, context?: string): Promise<AutocompleteResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/autocomplete`, {
        user_input: userInput,
        context
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to autocomplete category');
      }
    } catch (error) {
      console.error('Error in category autocomplete:', error);
      throw error;
    }
  }

  /**
   * Create a new category with AI-powered processing
   */
  async createCategory(userInput: string, forceCreate: boolean = false): Promise<CategoryCreationResult> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/create`, {
        user_input: userInput,
        force_create: forceCreate
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  /**
   * Get AI-suggested hierarchical placement for a category
   */
  async getHierarchyPlacement(categoryName: string, parentHint?: string): Promise<HierarchyPlacement> {
    try {
      const params = new URLSearchParams({ category_name: categoryName });
      if (parentHint) {
        params.append('parent_hint', parentHint);
      }

      const response = await apiClient.get(`${this.baseUrl}/hierarchy/placement/${encodeURIComponent(categoryName)}?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get hierarchy placement');
      }
    } catch (error) {
      console.error('Error getting hierarchy placement:', error);
      throw error;
    }
  }

  /**
   * Generate rating questions for a category using AI
   */
  async generateQuestions(
    categoryName: string,
    categoryPath?: string,
    parentCategory?: string
  ): Promise<Array<{ key: string; question: string; description: string }>> {
    try {
      const params = new URLSearchParams({ category_name: categoryName });
      if (categoryPath) params.append('category_path', categoryPath);
      if (parentCategory) params.append('parent_category', parentCategory);

      const response = await apiClient.post(`${this.baseUrl}/questions/generate?${params.toString()}`);
      
      if (response.data.success) {
        return response.data.data.questions;
      } else {
        throw new Error(response.data.message || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  }

  /**
   * Process complete category workflow (autocomplete + create if needed)
   */
  async processCategory(userInput: string): Promise<{
    autocomplete: AutocompleteResult;
    category?: CategoryCreationResult;
    isNew: boolean;
  }> {
    try {
      // First, try autocomplete
      const autocomplete = await this.autocompleteCategory(userInput);
      
      // If existing category found, return it
      if (autocomplete.is_existing && autocomplete.existing_category_id) {
        return {
          autocomplete,
          isNew: false
        };
      }
      
      // If not existing, create new category
      const category = await this.createCategory(userInput, true);
      
      return {
        autocomplete,
        category,
        isNew: true
      };
    } catch (error) {
      console.error('Error processing category:', error);
      throw error;
    }
  }

  /**
   * Validate category name and get suggestions
   */
  async validateAndSuggest(userInput: string): Promise<{
    isValid: boolean;
    correctedName?: string;
    suggestions: CategorySuggestion[];
    confidence: number;
    canCreate: boolean;
  }> {
    try {
      const [autocomplete, suggestions] = await Promise.all([
        this.autocompleteCategory(userInput).catch(() => null),
        this.getSuggestions(userInput).catch(() => [])
      ]);

      const isValid = userInput.trim().length >= 2 && userInput.trim().length <= 100;
      const canCreate = isValid && (!autocomplete?.is_existing || autocomplete.confidence < 90);

      return {
        isValid,
        correctedName: autocomplete?.corrected_name,
        suggestions,
        confidence: autocomplete?.confidence || 0,
        canCreate
      };
    } catch (error) {
      console.error('Error validating category:', error);
      return {
        isValid: false,
        suggestions: [],
        confidence: 0,
        canCreate: false
      };
    }
  }
}

export const aiCategoryService = new AICategoryService();
export default aiCategoryService;