/**
 * Category Filter Modal for Entity Listing
 * Simplified category search modal for filtering entities by category
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  X,
  Loader2, 
  AlertCircle, 
  ChevronRight,
  FolderOpen,
  Tag,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { categoryService, CategoryServiceError } from '../../../api/services/categoryService.optimized';
import type { UnifiedCategory } from '../../../types';

interface CategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: UnifiedCategory | null) => void;
  selectedCategory?: UnifiedCategory | null;
  title?: string;
  placeholder?: string;
}

interface ModalState {
  searchQuery: string;
  searchResults: UnifiedCategory[];
  rootCategories: UnifiedCategory[];
  loading: boolean;
  error: string | null;
  mode: 'search' | 'browse';
}

const CategoryFilterModal: React.FC<CategoryFilterModalProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
  selectedCategory,
  title = "Select Category to Filter",
  placeholder = "Search categories to filter entities..."
}) => {
  const [state, setState] = useState<ModalState>({
    searchQuery: '',
    searchResults: [],
    rootCategories: [],
    loading: false,
    error: null,
    mode: 'browse'
  });

  // Load root categories on mount
  useEffect(() => {
    if (isOpen) {
      loadRootCategories();
    }
  }, [isOpen]);

  const loadRootCategories = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const categories = await categoryService.getRootCategories();
      setState(prev => ({
        ...prev,
        rootCategories: categories,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load categories',
        loading: false
      }));
    }
  }, []);

  // Search categories with debouncing
  const searchCategories = useCallback(async (query: string) => {
    if (query.length < 2) {
      setState(prev => ({
        ...prev,
        searchResults: [],
        mode: 'browse'
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, mode: 'search' }));
    
    try {
      const results = await categoryService.searchCategories(query, 20);
      const unifiedResults = results.map(result => ({
        id: result.id,
        name: result.name,
        slug: result.slug,
        path: result.path_text,
        level: result.level,
        icon: result.type === 'root_category' ? '📂' : '📄',
        color: result.type === 'root_category' ? '#3b82f6' : '#6b7280',
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        description: result.path_text
      })) as UnifiedCategory[];

      setState(prev => ({
        ...prev,
        searchResults: unifiedResults,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Search failed',
        loading: false
      }));
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCategories(state.searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [state.searchQuery, searchCategories]);

  const handleSearchChange = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };

  const handleCategoryClick = (category: UnifiedCategory) => {
    onCategorySelect(category);
    onClose();
  };

  const handleClearSelection = () => {
    onCategorySelect(null);
    onClose();
  };

  const renderCategoryItem = (category: UnifiedCategory) => (
    <button
      key={category.id}
      onClick={() => handleCategoryClick(category)}
      className={`
        w-full p-3 text-left rounded-lg border transition-all duration-200
        ${selectedCategory?.id === category.id
          ? 'border-blue-500 bg-blue-50 text-blue-900'
          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
        }
      `}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {category.level === 1 ? (
            <FolderOpen className="h-5 w-5 text-blue-600" />
          ) : (
            <Tag className="h-5 w-5 text-gray-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {category.name}
          </p>
          {category.path && category.path !== category.name && (
            <p className="text-xs text-gray-500 truncate mt-1">
              {category.path}
            </p>
          )}
        </div>
        {selectedCategory?.id === category.id && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 100001 }}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div 
          className="inline-block w-full my-8 text-left align-middle transition-all transform bg-white rounded-xl shadow-2xl"
          style={{
            maxWidth: '500px',
            minWidth: '400px',
            maxHeight: 'calc(100vh - 40px)',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 100002,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                title="Back to filters"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col" style={{ height: 'calc(100% - 140px)' }}>
            {/* Search Bar - Fixed */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={placeholder}
                  autoFocus
                />
                {state.searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Current Selection */}
              {selectedCategory && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        Selected: {selectedCategory.name}
                      </span>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Results Area */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              {/* Loading State */}
              {state.loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-sm text-gray-600">
                    {state.mode === 'search' ? 'Searching...' : 'Loading categories...'}
                  </span>
                </div>
              )}

              {/* Error State */}
              {state.error && (
                <div className="flex items-center justify-center py-8 text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm">{state.error}</span>
                </div>
              )}

              {/* Results */}
              {!state.loading && !state.error && (
                <div className="space-y-2">
                  {state.mode === 'search' && state.searchResults.length > 0 && (
                    <>
                      <div className="text-xs text-gray-500 font-medium mb-2">
                        Search Results ({state.searchResults.length})
                      </div>
                      {state.searchResults.map(renderCategoryItem)}
                    </>
                  )}

                  {state.mode === 'browse' && state.rootCategories.length > 0 && (
                    <>
                      <div className="text-xs text-gray-500 font-medium mb-2">
                        Browse Categories
                      </div>
                      {state.rootCategories.map(renderCategoryItem)}
                    </>
                  )}

                  {/* No results */}
                  {state.mode === 'search' && state.searchResults.length === 0 && state.searchQuery.length >= 2 && (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No categories found for "{state.searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {state.mode === 'search' && state.searchResults.length > 0 
                  ? `${state.searchResults.length} results found`
                  : state.mode === 'browse' && state.rootCategories.length > 0
                  ? `${state.rootCategories.length} categories available`
                  : 'Start typing to search categories'
                }
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryFilterModal;