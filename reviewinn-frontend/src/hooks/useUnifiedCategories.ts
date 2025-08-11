import { useState, useEffect, useCallback } from 'react';

// Types for unified categories
export interface UnifiedCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  level: number;
  path: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, any>;
  is_root: boolean;
  is_leaf: boolean;
  children?: UnifiedCategory[];
  ancestors?: UnifiedCategory[];
  breadcrumb?: Array<{ id: number; name: string; slug: string; level: number }>;
}

interface UseUnifiedCategoriesResult {
  categories: UnifiedCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getCategoryById: (id: number) => UnifiedCategory | null;
  getCategoriesByLevel: (level: number) => UnifiedCategory[];
  getLeafCategories: () => UnifiedCategory[];
  getRootCategories: () => UnifiedCategory[];
  searchCategories: (query: string) => UnifiedCategory[];
}

export const useUnifiedCategories = (
  includeInactive: boolean = false
): UseUnifiedCategoriesResult => {
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/unified-categories/`;
      const params = new URLSearchParams();
      if (includeInactive) {
        params.append('include_inactive', 'true');
      }
      
      const response = await fetch(`${apiUrl}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Helper functions
  const getCategoryById = useCallback((id: number): UnifiedCategory | null => {
    const findCategory = (cats: UnifiedCategory[]): UnifiedCategory | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findCategory(categories);
  }, [categories]);

  const getCategoriesByLevel = useCallback((level: number): UnifiedCategory[] => {
    const findCategoriesByLevel = (cats: UnifiedCategory[]): UnifiedCategory[] => {
      let result: UnifiedCategory[] = [];
      for (const cat of cats) {
        if (cat.level === level) {
          result.push(cat);
        }
        if (cat.children) {
          result = result.concat(findCategoriesByLevel(cat.children));
        }
      }
      return result;
    };
    return findCategoriesByLevel(categories);
  }, [categories]);

  const getLeafCategories = useCallback((): UnifiedCategory[] => {
    const findLeafCategories = (cats: UnifiedCategory[]): UnifiedCategory[] => {
      let result: UnifiedCategory[] = [];
      for (const cat of cats) {
        if (cat.is_leaf) {
          result.push(cat);
        }
        if (cat.children) {
          result = result.concat(findLeafCategories(cat.children));
        }
      }
      return result;
    };
    return findLeafCategories(categories);
  }, [categories]);

  const getRootCategories = useCallback((): UnifiedCategory[] => {
    return categories.filter(cat => cat.is_root);
  }, [categories]);

  const searchCategories = useCallback((query: string): UnifiedCategory[] => {
    if (!query.trim()) return [];
    
    const searchQuery = query.toLowerCase();
    const findMatching = (cats: UnifiedCategory[]): UnifiedCategory[] => {
      let result: UnifiedCategory[] = [];
      for (const cat of cats) {
        if (cat.name.toLowerCase().includes(searchQuery) || 
            cat.description?.toLowerCase().includes(searchQuery)) {
          result.push(cat);
        }
        if (cat.children) {
          result = result.concat(findMatching(cat.children));
        }
      }
      return result;
    };
    return findMatching(categories);
  }, [categories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    getCategoryById,
    getCategoriesByLevel,
    getLeafCategories,
    getRootCategories,
    searchCategories
  };
};

// Hook for getting specific category types
export const useRootCategories = () => {
  const { categories, loading, error, refetch } = useUnifiedCategories();
  const rootCategories = categories.filter(cat => cat.is_root);
  
  return {
    rootCategories,
    loading,
    error,
    refetch
  };
};

// Hook for getting leaf categories (selectable ones)
export const useLeafCategories = () => {
  const { categories, loading, error, refetch, getLeafCategories } = useUnifiedCategories();
  
  return {
    leafCategories: getLeafCategories(),
    loading,
    error,
    refetch
  };
};

// Hook for category search with debouncing
export const useCategorySearch = (query: string, debounceMs: number = 300) => {
  const { searchCategories, loading: categoriesLoading } = useUnifiedCategories();
  const [searchResults, setSearchResults] = useState<UnifiedCategory[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeoutId = setTimeout(() => {
      const results = searchCategories(query);
      setSearchResults(results);
      setSearching(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, searchCategories, debounceMs]);

  return {
    searchResults,
    searching: searching || categoriesLoading
  };
};