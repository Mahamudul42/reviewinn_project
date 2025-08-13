import React, { useState, useEffect, useCallback } from 'react';
import { EntityCategory } from '../../../types/index';
import { categoryService } from '../../../api/services/categoryService.optimized';
import CategoryFilterModal from './CategoryFilterModal';

// Local type definitions to fix import issue
interface UnifiedCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  path: string;
  level: number;
  icon?: string;
  color?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

interface UnifiedCategorySearchResult {
  id: number;
  name: string;
  slug: string;
  level: number;
  path_text: string;
  type: 'root_category' | 'subcategory';
  display_name: string;
  category_id: number;
}

interface EntityListFiltersProps {
  selectedRootCategory: UnifiedCategory | null;
  setSelectedRootCategory: (category: UnifiedCategory | null) => void;
  selectedFinalCategory: UnifiedCategory | null;
  setSelectedFinalCategory: (category: UnifiedCategory | null) => void;
  sortBy: 'name' | 'rating' | 'reviewCount' | 'createdAt';
  setSortBy: (sortBy: 'name' | 'rating' | 'reviewCount' | 'createdAt') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  showVerified: boolean;
  setShowVerified: (show: boolean) => void;
  showWithReviews: boolean;
  setShowWithReviews: (show: boolean) => void;
}

const EntityListFilters: React.FC<EntityListFiltersProps> = ({
  selectedRootCategory,
  setSelectedRootCategory,
  selectedFinalCategory,
  setSelectedFinalCategory,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  showVerified,
  setShowVerified,
  showWithReviews,
  setShowWithReviews,
}) => {
  // Use the exported category service instance
  
  // State for category search
  const [rootCategoryQuery, setRootCategoryQuery] = useState('');
  const [finalCategoryQuery, setFinalCategoryQuery] = useState('');
  const [rootCategoryResults, setRootCategoryResults] = useState<UnifiedCategorySearchResult[]>([]);
  const [finalCategoryResults, setFinalCategoryResults] = useState<UnifiedCategorySearchResult[]>([]);
  const [showRootDropdown, setShowRootDropdown] = useState(false);
  const [showFinalDropdown, setShowFinalDropdown] = useState(false);
  const [rootCategories, setRootCategories] = useState<UnifiedCategory[]>([]);
  
  // Category filter modal state
  const [showCategoryFilterModal, setShowCategoryFilterModal] = useState(false);

  // Load root categories on mount
  useEffect(() => {
    const loadRootCategories = async () => {
      try {
        const categories = await categoryService.getRootCategories();
        setRootCategories(categories);
      } catch (error) {
        console.error('Error loading root categories:', error);
      }
    };
    loadRootCategories();
  }, []);

  // Search categories with debouncing
  const searchCategories = useCallback(async (query: string, isRoot = false) => {
    if (query.length < 2) {
      if (isRoot) {
        setRootCategoryResults([]);
      } else {
        setFinalCategoryResults([]);
      }
      return;
    }

    try {
      const results = await categoryService.searchCategories(query, 10);
      if (isRoot) {
        // Filter only root categories (level 1)
        setRootCategoryResults(results.filter(r => r.type === 'root_category'));
      } else {
        setFinalCategoryResults(results);
      }
    } catch (error) {
      console.error('Error searching categories:', error);
    }
  }, [categoryService]);

  // Debounced search handlers
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCategories(rootCategoryQuery, true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [rootCategoryQuery, searchCategories]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchCategories(finalCategoryQuery, false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [finalCategoryQuery, searchCategories]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown="root"]')) {
        setShowRootDropdown(false);
      }
      if (!target.closest('[data-dropdown="final"]')) {
        setShowFinalDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort options
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'rating', label: 'Rating' },
    { value: 'reviewCount', label: 'Review Count' },
    { value: 'createdAt', label: 'Date Added' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 space-y-6">

      {/* Active Filters Summary */}
      {(selectedRootCategory || selectedFinalCategory || showVerified || showWithReviews) && (
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2">Active filters:</span>
              {selectedRootCategory && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {selectedRootCategory.name}
                </span>
              )}
              {selectedFinalCategory && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {selectedFinalCategory.name}
                </span>
              )}
              {showVerified && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verified
                </span>
              )}
              {showWithReviews && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Has Reviews
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedRootCategory(null);
                setSelectedFinalCategory(null);
                setRootCategoryQuery('');
                setFinalCategoryQuery('');
                setShowVerified(false);
                setShowWithReviews(false);
                setSortBy('name');
                setSortOrder('asc');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
      
      {/* Category Filter Modal */}
      <CategoryFilterModal
        isOpen={showCategoryFilterModal}
        onClose={() => setShowCategoryFilterModal(false)}
        onCategorySelect={(category) => {
          if (category) {
            // Set as root category if it's level 1, otherwise as final category
            if (category.level === 1) {
              setSelectedRootCategory(category);
              setRootCategoryQuery(category.name);
            } else {
              setSelectedFinalCategory(category);
              setFinalCategoryQuery(category.name);
            }
          }
        }}
        selectedCategory={selectedRootCategory || selectedFinalCategory}
        title="Filter by Category"
        placeholder="Search categories to filter entities..."
      />
    </div>
  );
};

export default EntityListFilters;