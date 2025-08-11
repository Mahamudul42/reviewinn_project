/**
 * useCategorySearch - Custom hook for managing category search state and logic
 */

import { useState, useCallback, useEffect } from 'react';
import { categoryService, CategoryServiceError } from '../../../api/services/categoryService.optimized';
import type { UnifiedCategory, UnifiedCategorySearchResult, UnifiedCategoryCreate } from '../../../types';

interface CategorySearchState {
  searchQuery: string;
  searchResults: UnifiedCategorySearchResult[];
  currentParent: UnifiedCategory | null;
  currentCategories: (UnifiedCategory & { is_leaf?: boolean })[];
  breadcrumbs: UnifiedCategory[];
  loading: boolean;
  error: string | null;
  mode: 'browse' | 'search';
  showAddCategory: boolean;
  newCategoryName: string;
}

const initialState: CategorySearchState = {
  searchQuery: '',
  searchResults: [],
  currentParent: null,
  currentCategories: [],
  breadcrumbs: [],
  loading: false,
  error: null,
  mode: 'browse',
  showAddCategory: false,
  newCategoryName: '',
};

export const useCategorySearch = (isOpen: boolean) => {
  const [state, setState] = useState<CategorySearchState>(initialState);

  // Load root categories
  const loadRootCategories = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const categories = await categoryService.getRootCategories();
      
      // Ensure proper sorting by sort_order, then by name
      const sortedCategories = categories.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });
      
      setState(prev => ({
        ...prev,
        currentCategories: sortedCategories.map(c => ({ ...c, is_leaf: c.level > 2 })),
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
      // Ensure proper sorting by sort_order, then by name
      const sortedChildren = children.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
      });
      
      setState(prev => ({
        ...prev,
        currentCategories: sortedChildren.map(c => ({ ...c, is_leaf: c.level > 2 })),
        loading: false,
        currentParent: parent,
        breadcrumbs: [...prev.breadcrumbs, parent],
        mode: 'browse',
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

  // Search categories
  const searchCategories = useCallback(async (query: string) => {
    if (query.length < 2) {
      setState(prev => ({ 
        ...prev, 
        mode: 'browse',
        searchResults: [],
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, mode: 'search' }));
    
    try {
      const results = await categoryService.searchCategories(query);
      
      setState(prev => ({
        ...prev,
        searchResults: results.map(c => ({ 
          ...c, 
          sort_order: 0,
        })),
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof CategoryServiceError 
          ? error.message 
          : 'Failed to search categories',
      }));
    }
  }, []);

  // Handle add new category
  const handleAddCategory = useCallback(async () => {
    if (!state.newCategoryName.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const newCategory = await categoryService.createCategory(
        state.newCategoryName.trim(),
        state.currentParent?.id
      );

      // Refresh current category list
      if (state.currentParent) {
        await loadChildrenCategories(state.currentParent);
      } else {
        await loadRootCategories();
      }

      setState(prev => ({
        ...prev,
        showAddCategory: false,
        newCategoryName: '',
        loading: false,
      }));

      return newCategory;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof CategoryServiceError 
          ? error.message 
          : 'Failed to create category',
      }));
      throw error;
    }
  }, [state.newCategoryName, state.currentParent, loadChildrenCategories, loadRootCategories]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState(prev => ({
        ...prev,
        searchQuery: '',
        searchResults: [],
        currentParent: null,
        currentCategories: [],
        breadcrumbs: [],
        loading: false,
        error: null,
        mode: 'browse',
        showAddCategory: false,
        newCategoryName: '',
      }));
      loadRootCategories();
    }
  }, [isOpen, loadRootCategories]);

  return {
    state,
    setState,
    loadRootCategories,
    loadChildrenCategories,
    searchCategories,
    handleAddCategory,
  };
};
