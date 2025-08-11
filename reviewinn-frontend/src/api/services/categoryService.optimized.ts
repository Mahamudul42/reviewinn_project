/**
 * Optimized Category Service
 * Modern, efficient implementation with proper error handling and caching
 */

import { API_CONFIG } from '../config';
import type {
  UnifiedCategory,
  UnifiedCategorySearchResult,
  CategoryHierarchy,
} from '../../types/index';

// Types for better API contracts
interface CategoryResponse {
  data: UnifiedCategory[];
  meta: {
    total: number;
    page: number;
    hasMore: boolean;
  };
}

interface CategoryError {
  code: string;
  message: string;
  details?: unknown;
}

class CategoryServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CategoryServiceError';
  }
}

class OptimizedCategoryService {
  private readonly baseUrl: string;
  private readonly cache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CACHE_MAX_SIZE = 100; // Maximum cache entries

  constructor() {
    this.baseUrl = `${API_CONFIG.BASE_URL}/unified-categories`;
  }

  /**
   * Generic fetch wrapper with error handling and caching
   */
  private async fetchWithCache<T>(
    endpoint: string,
    options: RequestInit = {},
    useCache = true
  ): Promise<T> {
    const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data as T;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new CategoryServiceError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          errorData.code || 'FETCH_ERROR',
          errorData
        );
      }

      const data = await response.json();
      
      // Cache successful responses with size limit
      if (useCache) {
        // Implement LRU cache behavior
        if (this.cache.size >= this.CACHE_MAX_SIZE) {
          const firstKey = this.cache.keys().next().value;
          if (firstKey) {
            this.cache.delete(firstKey);
          }
        }
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      if (error instanceof CategoryServiceError) {
        throw error;
      }
      
      throw new CategoryServiceError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'NETWORK_ERROR',
        error
      );
    }
  }

  /**
   * Get root categories with optimized response
   */
  async getRootCategories(): Promise<UnifiedCategory[]> {
    return this.fetchWithCache<UnifiedCategory[]>('/roots');
  }

  /**
   * Get children of a specific category
   */
  async getChildrenCategories(parentId: number): Promise<UnifiedCategory[]> {
    return this.fetchWithCache<UnifiedCategory[]>(`/${parentId}/children`);
  }

  /**
   * Get category by ID with optional nested data
   */
  async getCategoryById(
    id: number,
    includeChildren = false,
    includeAncestors = false
  ): Promise<UnifiedCategory | null> {
    const params = new URLSearchParams();
    if (includeChildren) params.set('include_children', 'true');
    if (includeAncestors) params.set('include_ancestors', 'true');
    
    const queryString = params.toString();
    const endpoint = `/${id}${queryString ? `?${queryString}` : ''}`;
    
    try {
      return await this.fetchWithCache<UnifiedCategory>(endpoint);
    } catch (error) {
      if (error instanceof CategoryServiceError && error.code === 'FETCH_ERROR') {
        return null; // Category not found
      }
      throw error;
    }
  }

  /**
   * Search categories with debouncing support
   */
  async searchCategories(
    query: string,
    limit = 20
  ): Promise<UnifiedCategorySearchResult[]> {
    if (query.trim().length < 2) {
      throw new CategoryServiceError(
        'Search query must be at least 2 characters',
        'INVALID_QUERY'
      );
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
    });

    return this.fetchWithCache<UnifiedCategorySearchResult[]>(
      `/search?${params.toString()}`,
      {},
      false // Don't cache search results
    );
  }

  /**
   * Get category hierarchy for navigation
   */
  async getCategoryHierarchy(categoryId?: number): Promise<CategoryHierarchy> {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return this.fetchWithCache<CategoryHierarchy>(`/hierarchy${params}`);
  }

  /**
   * Get categories formatted for frontend consumption
   */
  async getCategoriesForFrontend(
    format: 'hierarchical' | 'flat' | 'leaf_only' = 'hierarchical'
  ): Promise<{
    categories: UnifiedCategory[];
    format: string;
    total: number;
  }> {
    return this.fetchWithCache<{
      categories: UnifiedCategory[];
      format: string;
      total: number;
    }>(`/frontend?format=${format}`);
  }

  /**
   * Clear cache - useful for cache invalidation
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Create a new category
   */
  async createCategory(
    name: string,
    parentId?: number
  ): Promise<UnifiedCategory> {
    const payload = {
      name: name.trim(),
      parent_id: parentId || null,
    };

    const response = await this.fetchWithCache<UnifiedCategory>(
      '/',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      false // Don't cache POST requests
    );

    // Clear cache after creating a new category
    this.clearCache();
    
    return response;
  }

  /**
   * Prefetch categories for better UX
   */
  async prefetchCategories(categoryIds: number[]): Promise<void> {
    const promises = categoryIds.map((id) =>
      this.getCategoryById(id, true, false).catch(() => null)
    );
    await Promise.all(promises);
  }
}

// Export singleton instance
export const categoryService = new OptimizedCategoryService();
export { CategoryServiceError };
export type { CategoryResponse, CategoryError };