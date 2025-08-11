/**
 * CategoryList - Renders the list of categories with loading and empty states
 */

import React from 'react';
import { Search, FolderOpen, Loader2 } from 'lucide-react';
import { CategoryCard } from '../../../../shared/design-system/components/CategoryCard';
import type { UnifiedCategory, UnifiedCategorySearchResult } from '../../../../types';

interface CategoryListProps {
  categories: (UnifiedCategory & { is_leaf?: boolean })[];
  searchResults: UnifiedCategorySearchResult[];
  selectedCategoryId?: number;
  loading: boolean;
  error: string | null;
  mode: 'browse' | 'search';
  searchQuery: string;
  onCategoryClick: (category: UnifiedCategory) => void;
  onCategorySelect: (category: UnifiedCategory) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  searchResults,
  selectedCategoryId,
  loading,
  error,
  mode,
  searchQuery,
  onCategoryClick,
  onCategorySelect
}) => {
  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="text-neutral-600">Loading categories...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-neutral-600 text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  // Determine which categories to display
  const rawCategories = mode === 'search' ? searchResults : categories;
  // Deduplicate categories by ID to prevent React key conflicts
  const displayCategories = rawCategories.filter((category, index, arr) => 
    arr.findIndex(c => c.id === category.id) === index
  );

  // Empty State
  if (displayCategories.length === 0) {
    return (
      <div className="flex flex-col justify-center py-20">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
            {mode === 'search' ? (
              <Search className="w-8 h-8 text-neutral-400" />
            ) : (
              <FolderOpen className="w-8 h-8 text-neutral-400" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {mode === 'search' 
                ? (searchQuery.length < 2 ? 'Start searching' : 'No results found')
                : 'No categories available'}
            </h3>
            <p className="text-neutral-600 text-left">
              {mode === 'search' 
                ? (searchQuery.length < 2 
                    ? 'Type at least 2 characters to search for categories.'
                    : `No categories found matching "${searchQuery}". Try different keywords.`)
                : 'There are no categories to display at the moment.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Categories List
  return (
    <div className="space-y-2">
      {displayCategories.map((category) => {
        // Handle both UnifiedCategory and UnifiedCategorySearchResult
        const categoryData = 'path' in category ? category : {
          ...category,
          path: category.path_text || '',
          is_active: true,
          created_at: new Date().toISOString(),
          sort_order: 0,
          description: undefined,
          color: undefined,
          icon: undefined,
          updated_at: undefined,
        };
        
        const isLeaf = 'is_leaf' in category ? category.is_leaf : category.level > 2;
        
        return (
          <CategoryCard
            key={category.id}
            category={categoryData}
            isSelected={selectedCategoryId === category.id}
            showChevron={mode === 'browse' && !isLeaf}
            fullWidth={true}
            onClick={() => {
              if (mode === 'search' || isLeaf) {
                onCategorySelect(categoryData);
              } else {
                onCategoryClick(categoryData);
              }
            }}
          />
        );
      })}
    </div>
  );
};
