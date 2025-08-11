/**
 * Modern CategorySelector Component
 * Follows accessibility guidelines and modern UX patterns
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Search, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { CategoryCard } from '../design-system/components/CategoryCard';
import { categoryService, CategoryServiceError } from '../../api/services/categoryService.optimized';
import { cn } from '../design-system/utils/cn';
import type { UnifiedCategory } from '../../types';

interface CategorySelectorProps {
  onCategorySelect: (category: UnifiedCategory) => void;
  selectedCategory?: UnifiedCategory;
  mode?: 'single' | 'hierarchical';
  allowSearch?: boolean;
  className?: string;
}

interface CategoryState {
  categories: UnifiedCategory[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  currentParent: UnifiedCategory | null;
  breadcrumbs: UnifiedCategory[];
}

const CategorySelector: React.FC<CategorySelectorProps> = memo(({
  onCategorySelect,
  selectedCategory,
  mode = 'hierarchical',
  allowSearch = true,
  className,
}) => {
  const [state, setState] = useState<CategoryState>({
    categories: [],
    loading: true,
    error: null,
    searchQuery: '',
    currentParent: null,
    breadcrumbs: [],
  });

  // Load initial root categories
  const loadRootCategories = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const categories = await categoryService.getRootCategories();
      setState(prev => ({
        ...prev,
        categories,
        loading: false,
        currentParent: null,
        breadcrumbs: [],
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof CategoryServiceError 
          ? error.message 
          : 'Failed to load categories',
      }));
    }
  }, []);

  // Load children categories
  const loadChildrenCategories = useCallback(async (parent: UnifiedCategory) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const children = await categoryService.getChildrenCategories(parent.id);
      
      if (children.length === 0) {
        // No children, select this category
        onCategorySelect(parent);
        return;
      }

      setState(prev => ({
        ...prev,
        categories: children,
        loading: false,
        currentParent: parent,
        breadcrumbs: [...prev.breadcrumbs, parent],
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof CategoryServiceError 
          ? error.message 
          : 'Failed to load subcategories',
      }));
    }
  }, [onCategorySelect]);

  // Handle category click
  const handleCategoryClick = useCallback((category: UnifiedCategory) => {
    if (mode === 'single' || category.is_leaf) {
      onCategorySelect(category);
    } else {
      loadChildrenCategories(category);
    }
  }, [mode, onCategorySelect, loadChildrenCategories]);

  // Navigate back in breadcrumbs
  const navigateBack = useCallback(async (targetParent?: UnifiedCategory) => {
    if (!targetParent) {
      // Go back to root
      await loadRootCategories();
      return;
    }

    const targetIndex = state.breadcrumbs.findIndex(b => b.id === targetParent.id);
    if (targetIndex === -1) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const children = await categoryService.getChildrenCategories(targetParent.id);
      setState(prev => ({
        ...prev,
        categories: children,
        loading: false,
        currentParent: targetParent,
        breadcrumbs: prev.breadcrumbs.slice(0, targetIndex + 1),
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to navigate back',
      }));
    }
  }, [state.breadcrumbs, loadRootCategories]);

  // Search categories
  const searchCategories = useCallback(async (query: string) => {
    if (query.length < 2) {
      await loadRootCategories();
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const results = await categoryService.searchCategories(query);
      setState(prev => ({
        ...prev,
        categories: results.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          level: r.level,
          description: r.path_text,
          is_leaf: r.type === 'subcategory',
          is_root: r.type === 'root_category',
        })) as UnifiedCategory[],
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Search failed',
      }));
    }
  }, [loadRootCategories]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.searchQuery !== '') {
        searchCategories(state.searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [state.searchQuery]); // Remove searchCategories from dependencies

  // Load initial data
  useEffect(() => {
    loadRootCategories();
  }, []); // Remove loadRootCategories from dependencies to prevent infinite loop

  // Memoized filtered categories for performance
  const displayCategories = useMemo(() => {
    return state.categories.filter(category => 
      category.name.toLowerCase().includes(state.searchQuery.toLowerCase())
    );
  }, [state.categories, state.searchQuery]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Search Bar */}
      {allowSearch && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="block w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
      )}

      {/* Breadcrumbs */}
      {mode === 'hierarchical' && state.breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateBack()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Categories
          </button>
          
          {state.breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <span className="text-neutral-400">/</span>
              <button
                onClick={() => navigateBack(crumb)}
                className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Error State */}
      {state.error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Error loading categories</p>
            <p className="text-sm text-red-600">{state.error}</p>
          </div>
          <button
            onClick={loadRootCategories}
            className="ml-auto px-3 py-1 text-sm font-medium text-red-700 hover:text-red-900 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {state.loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-neutral-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading categories...</span>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      {!state.loading && !state.error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory?.id === category.id}
              showChevron={!category.is_leaf && mode === 'hierarchical'}
              onClick={() => handleCategoryClick(category)}
              size="md"
              variant="default"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!state.loading && !state.error && displayCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-neutral-400" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No categories found
          </h3>
          <p className="text-neutral-600 mb-6">
            {state.searchQuery 
              ? `No categories match "${state.searchQuery}"`
              : 'No categories available at this level'
            }
          </p>
          {state.searchQuery && (
            <button
              onClick={() => setState(prev => ({ ...prev, searchQuery: '' }))}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
});

CategorySelector.displayName = 'CategorySelector';

export { CategorySelector };
export type { CategorySelectorProps };