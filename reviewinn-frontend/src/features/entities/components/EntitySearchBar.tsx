import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { entityService } from '../../../api/services';
import EntityFilterModal from './EntityFilterModal';
import type { Entity, SearchResult, SearchFilters } from '../../../types';
import { EntityCategory } from '../../../types';

interface EntitySearchBarProps {
  onSearchResults: (results: SearchResult) => void;
  onEntitySelect: (entity: Entity) => void;
  placeholder?: string;
  initialQuery?: string;
}

const EntitySearchBar: React.FC<EntitySearchBarProps> = ({
  onSearchResults,
  onEntitySelect,
  placeholder = "Search entities...",
  initialQuery = ""
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<any>({});
  const [filterCount, setFilterCount] = useState(0);

  // Initial load with no filters when component mounts
  useEffect(() => {
    performSearch('', {});
  }, []);

  const performSearch = async (searchQuery: string, filters: any) => {
    setIsLoading(true);
    console.log('🔍 EntitySearchBar: Performing search with:', { searchQuery, filters });
    try {
      let results: SearchResult;
      
      if (searchQuery.trim().length === 0) {
        // Get all entities with current filters
        const searchParams = {
          page: 1,
          limit: 20,
          category: filters.category,
          sortBy: filters.sortBy || 'createdAt',
          sortOrder: filters.sortOrder || 'desc',
          verified: filters.isVerified,
          claimed: filters.isClaimed,
          minRating: filters.minRating,
          hasReviews: filters.hasReviews,
          // New JSONB category filters
          root_category_id: filters.selectedRootCategory?.id,
          final_category_id: filters.selectedFinalCategory?.id
        };
        console.log('🔍 EntitySearchBar: API call params:', searchParams);
        results = await entityService.getEntities(searchParams);
        console.log('🔍 EntitySearchBar: API results received:', results);
      } else {
        // Search with query and filters
        const searchFilters: SearchFilters = {
          category: filters.category,
          sortBy: filters.sortBy || 'rating',
          sortOrder: filters.sortOrder || 'desc'
        };
        results = await entityService.searchEntities(searchQuery, searchFilters);
      }
      
      onSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      onSearchResults({ entities: [], total: 0, hasMore: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    performSearch(query, appliedFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    performSearch('', appliedFilters);
  };

  const handleFilterApply = (filters: any) => {
    console.log('🎯 EntitySearchBar: Filter applied:', filters);
    setAppliedFilters(filters);
    
    // Count applied filters
    const count = Object.values(filters).filter(value => value !== undefined && value !== null).length;
    console.log('🎯 EntitySearchBar: Filter count:', count);
    setFilterCount(count);
    
    // Trigger search with new filters
    performSearch(query, filters);
  };

  // Auto-search when filters change
  useEffect(() => {
    if (Object.keys(appliedFilters).length > 0) {
      performSearch(query, appliedFilters);
    }
  }, [appliedFilters]);

  return (
    <div className="w-full space-y-4">
      {/* Main Search Bar - Exact YouTube Style */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-2xl">
          <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-blue-500 transition-all duration-200">
            <input
              type="text"
              className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none text-base"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            {query && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {/* YouTube Style Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-r-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-300"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className={`relative flex items-center space-x-2 px-4 py-3 border-2 rounded-xl transition-all duration-200 shadow-sm ${
            filterCount > 0 
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-5 w-5" />
          <span className="font-medium">Filter</span>
          {filterCount > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Modal */}
      <EntityFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        initialFilters={appliedFilters}
      />
    </div>
  );
};

export default EntitySearchBar;