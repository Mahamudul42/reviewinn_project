/**
 * Enhanced Category Search Modal
 * Provides search functionality and hierarchical navigation with clear visual separation
 * Supports adding new categories at any level
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  Plus,
  ChevronRight,
  FolderOpen,
  Tag,
  X
} from 'lucide-react';
import { Modal } from '../../../shared/design-system';
import { CategoryCard } from '../../../shared/design-system/components/CategoryCard';
import { Button } from '../../../shared/ui';
import { categoryService, CategoryServiceError } from '../../../api/services/categoryService.optimized';
import { cn } from '../../../shared/design-system/utils/cn';
import { purpleTheme, purpleStyles } from '../../../shared/design-system/utils/purpleTheme';
import type { UnifiedCategory } from '../../../types';

// Extended category type for modal usage
interface ExtendedUnifiedCategory extends UnifiedCategory {
  is_leaf?: boolean;
  is_root?: boolean;
}

interface CategorySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: UnifiedCategory) => void;
  selectedCategory?: UnifiedCategory | null;
}

interface ModalState {
  searchQuery: string;
  searchResults: ExtendedUnifiedCategory[];
  currentParent: UnifiedCategory | null;
  currentCategories: ExtendedUnifiedCategory[];
  breadcrumbs: UnifiedCategory[];
  loading: boolean;
  error: string | null;
  mode: 'search' | 'browse';
  showAddCategory: boolean;
  newCategoryName: string;
}

const CategorySearchModal: React.FC<CategorySearchModalProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
  selectedCategory,
}) => {
  const [state, setState] = useState<ModalState>({
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
  });

  // Load root categories function
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
  }, [isOpen]); // Remove loadRootCategories to prevent infinite loop

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
      
      setState(prev => {
        // Only add parent to breadcrumbs if it's not already the last item
        const lastBreadcrumb = prev.breadcrumbs[prev.breadcrumbs.length - 1];
        const newBreadcrumbs = lastBreadcrumb?.id === parent.id 
          ? prev.breadcrumbs 
          : [...prev.breadcrumbs, parent];
          
        return {
          ...prev,
          currentCategories: sortedChildren.map(c => ({ ...c, is_leaf: c.level > 2 })),
          loading: false,
          currentParent: parent,
          breadcrumbs: newBreadcrumbs,
          mode: 'browse',
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof CategoryServiceError 
          ? error.message 
          : 'Failed to load subcategories',
      }));
    }
  }, []);

  // Search categories
  const searchCategories = useCallback(async (query: string) => {
    if (query.length < 2) {
      setState(prev => ({ ...prev, searchResults: [], loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null, mode: 'search' }));
    
    try {
      const results = await categoryService.searchCategories(query);
      setState(prev => ({
        ...prev,
        searchResults: results.map(r => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          level: r.level,
          description: r.path_text,
          path: r.path_text,
          is_active: true,
          sort_order: 0,
          created_at: new Date().toISOString(),
          is_leaf: r.type === 'subcategory',
          is_root: r.type === 'root_category',
        })) as ExtendedUnifiedCategory[],
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Search failed',
      }));
    }
  }, []);

  // Handle search input
  const handleSearchChange = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    
    // Debounce search
    const timer = setTimeout(() => {
      searchCategories(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchCategories]);

  // Handle category click
  const handleCategoryClick = useCallback((category: ExtendedUnifiedCategory) => {
    if (category.is_leaf || state.mode === 'search') {
      onCategorySelect(category as UnifiedCategory);
    } else {
      loadChildrenCategories(category as UnifiedCategory);
    }
  }, [state.mode, onCategorySelect, loadChildrenCategories]);

  // Navigate back in breadcrumbs
  const navigateBack = useCallback(async (targetIndex?: number) => {
    if (targetIndex === undefined) {
      // Go back to root
      await loadRootCategories();
      return;
    }

    const targetParent = state.breadcrumbs[targetIndex];
    if (!targetParent) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const children = await categoryService.getChildrenCategories(targetParent.id);
      setState(prev => ({
        ...prev,
        currentCategories: children.map(c => ({ ...c, is_leaf: c.level > 2 })),
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

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    onCategorySelect(undefined as any);
  }, [onCategorySelect]);

  // Handle add new category
  const handleAddCategory = useCallback(async () => {
    if (!state.newCategoryName.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Create new category using the API
      await categoryService.createCategory(
        state.newCategoryName,
        state.currentParent?.id
      );
      
      // Close add category mode and clear current categories to prevent duplicates
      setState(prev => ({ 
        ...prev, 
        showAddCategory: false, 
        newCategoryName: '',
        currentCategories: [], // Clear current categories to prevent duplicates during reload
      }));
      
      // Refresh current categories
      if (state.currentParent) {
        await loadChildrenCategories(state.currentParent);
      } else {
        await loadRootCategories();
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof CategoryServiceError 
          ? error.message 
          : 'Failed to create new category',
      }));
    }
  }, [state.newCategoryName, state.currentParent, loadChildrenCategories, loadRootCategories]);

  // Display categories based on current mode
  const displayCategories = useMemo(() => {
    const categories = state.mode === 'search' ? state.searchResults : state.currentCategories;
    
    // Check for duplicates and log them for debugging
    const duplicateIds = categories
      .map(c => c.id)
      .filter((id, index, arr) => arr.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      console.warn('CategorySearchModal: Found duplicate category IDs:', duplicateIds);
      console.warn('Categories causing duplicates:', categories.filter(c => duplicateIds.includes(c.id)));
    }
    
    // Deduplicate categories by ID to prevent React key conflicts
    const uniqueCategories = categories.filter((category, index, arr) => 
      arr.findIndex(c => c.id === category.id) === index
    );
    return uniqueCategories;
  }, [state.mode, state.searchResults, state.currentCategories]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="bg-white rounded-xl shadow-xl w-full max-w-[700px] min-w-[600px] h-[85vh] max-h-[85vh] min-h-[600px] overflow-hidden"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Select Category
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                Search for existing categories or browse the hierarchy
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex-shrink-0 px-6">
          {/* Browse vs Search Toggle */}
          <div className="flex rounded-lg p-1 mb-6 border" style={purpleStyles.toggleBackground}>
          <button
            onClick={() => {
              setState(prev => ({ ...prev, mode: 'browse', searchQuery: '' }));
              if (state.currentCategories.length === 0) {
                loadRootCategories();
              }
            }}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center border',
              state.mode === 'browse' 
                ? 'text-white shadow-lg transform scale-[1.02]' 
                : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400'
            )}
            style={state.mode === 'browse' ? purpleStyles.toggleActive : purpleStyles.toggleInactive}
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Browse Hierarchy
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, mode: 'search', searchQuery: '' }))}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center border ml-1',
              state.mode === 'search' 
                ? 'text-white shadow-lg transform scale-[1.02]' 
                : 'bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400'
            )}
            style={state.mode === 'search' ? purpleStyles.toggleActive : purpleStyles.toggleInactive}
          >
            <Search className="w-4 h-4 mr-2" />
            Search Categories
          </button>
        </div>

        {/* Search Input */}
        {state.mode === 'search' && (
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search categories and subcategories..."
              value={state.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
        )}

        {/* Breadcrumbs for Browse Mode */}
        {state.mode === 'browse' && state.breadcrumbs.length > 0 && (
          <div className="flex items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigateBack();
                }}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                All Categories
              </button>
              
              {state.breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                  <button
                    onClick={() => {
                      navigateBack(index);
                    }}
                    className="text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            
            {/* Clear Selection Button */}
            {selectedCategory && (
              <button
                onClick={handleClearSelection}
                className="px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}
        
        {/* Clear Selection for Search Mode */}
        {state.mode === 'search' && selectedCategory && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleClearSelection}
              className="px-3 py-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
            >
              Clear Selection
            </button>
          </div>
        )}

          {/* Error Display */}
          {state.error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
              <button
                onClick={state.mode === 'search' ? () => searchCategories(state.searchQuery) : loadRootCategories}
                className="ml-auto px-3 py-1 text-sm font-medium text-red-700 hover:text-red-900 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Categories Content Container */}
          <div className="flex-1 overflow-y-auto px-6" style={{ maxHeight: 'calc(85vh - 200px)' }}>
            {/* Loading State */}
            {state.loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-3 text-neutral-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">
                    {state.mode === 'search' ? 'Searching...' : 'Loading categories...'}
                  </span>
                </div>
              </div>
            )}

            {/* Categories Grid */}
            {!state.loading && !state.error && displayCategories.length > 0 && (
              <div className="space-y-2 py-4">
                {displayCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    isSelected={selectedCategory?.id === category.id}
                    showChevron={!category.is_leaf && state.mode === 'browse'}
                    onClick={() => handleCategoryClick(category)}
                    size="sm"
                    variant="default"
                    className="w-full"
                    fullWidth={true}
                  />
                ))}
                
                {/* Add Category Option - Moved to bottom */}
                {state.mode === 'browse' && !state.showAddCategory && (
                  <div className="mt-4">
                    <button
                      onClick={() => setState(prev => ({ ...prev, showAddCategory: true }))}
                      className="w-full p-4 border-2 border-dashed border-primary-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-colors group flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 mr-2 text-primary-400 group-hover:text-primary-600" />
                      <span className="text-primary-600 group-hover:text-primary-700">
                        Add New Category
                        {state.currentParent && ` to ${state.currentParent.name}`}
                      </span>
                    </button>
                  </div>
                )}

                {/* Add Category Form - At bottom */}
                {state.showAddCategory && (
                  <div className="mt-4">
                    <div className="bg-primary-50 rounded-xl p-4 border-2 border-primary-200">
                      <h4 className="font-medium text-primary-900 mb-3">
                        Add New Category
                        {state.currentParent && ` to ${state.currentParent.name}`}
                      </h4>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={state.newCategoryName}
                          onChange={(e) => setState(prev => ({ ...prev, newCategoryName: e.target.value }))}
                          placeholder="Enter category name..."
                          className="flex-1 px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoFocus
                        />
                        <Button
                          onClick={handleAddCategory}
                          disabled={!state.newCategoryName.trim() || state.loading}
                          size="sm"
                          className={
                            state.newCategoryName.trim() 
                              ? "text-white border transition-all duration-200"
                              : "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                          }
                          style={
                            state.newCategoryName.trim() 
                              ? purpleStyles.button
                              : undefined
                          }
                        >
                          Add
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setState(prev => ({ ...prev, showAddCategory: false, newCategoryName: '' }))}
                          size="sm"
                          className={
                            state.newCategoryName.trim()
                              ? "border transition-all duration-200"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200 hover:border-gray-300"
                          }
                          style={
                            state.newCategoryName.trim()
                              ? {
                                  backgroundColor: purpleTheme.light,
                                  borderColor: purpleTheme.border,
                                  color: purpleTheme.primaryActive,
                                }
                              : undefined
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!state.loading && !state.error && displayCategories.length === 0 && (
              <div className="flex flex-col justify-center py-20">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {state.mode === 'search' ? (
                      <Search className="w-8 h-8 text-neutral-400" />
                    ) : (
                      <FolderOpen className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      {state.mode === 'search' 
                        ? (state.searchQuery.length < 2 ? 'Start searching' : 'No results found')
                        : 'No categories available'}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">
                      {state.mode === 'search' 
                        ? (state.searchQuery.length < 2 
                            ? 'Type at least 2 characters to search categories'
                            : `No categories match "${state.searchQuery}"`)
                        : 'No categories available at this level'
                      }
                    </p>
                    {state.mode === 'search' && state.searchQuery.length >= 2 && (
                      <button
                        onClick={() => setState(prev => ({ ...prev, searchQuery: '', searchResults: [] }))}
                        className="inline-flex items-center px-6 py-3 text-white rounded-lg transition-colors font-medium mt-4"
                        style={{
                          backgroundColor: '#9333ea',
                          borderColor: '#7c3aed'
                        }}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Select Button - Only show when category is selected */}
        {selectedCategory && (
          <div className="absolute bottom-6 right-6">
            <Button 
              variant="purple"
              onClick={() => onCategorySelect(selectedCategory)}
              size="lg"
              className="shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
            >
              Select "{selectedCategory.name}"
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CategorySearchModal;