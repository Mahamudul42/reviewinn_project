import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { EntityCategory } from '../../../types';
import type { SearchType, SearchFilters as SearchFiltersType } from '../types/searchTypes';

interface SearchFiltersProps {
  searchType: SearchType;
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  resultsCount: number;
  onClose?: () => void;
  isModal?: boolean;
}

const entityCategories = [
  { value: EntityCategory.PROFESSIONALS, label: 'Professionals', icon: '👨‍💼' },
  { value: EntityCategory.COMPANIES, label: 'Companies', icon: '🏢' },
  { value: EntityCategory.PLACES, label: 'Places', icon: '📍' },
  { value: EntityCategory.PRODUCTS, label: 'Products', icon: '📦' }
];

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
  { value: 'date', label: 'Date' },
  { value: 'popularity', label: 'Popularity' }
];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchType,
  filters,
  onFiltersChange,
  resultsCount,
  onClose,
  isModal = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    category: true,
    rating: false,
    date: false,
    sort: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFilter = <K extends keyof SearchFiltersType>(
    key: K,
    value: SearchFiltersType[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const removeFilter = (key: keyof SearchFiltersType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  const FilterSection: React.FC<{
    title: string;
    sectionKey: string;
    children: React.ReactNode;
  }> = ({ title, sectionKey, children }) => {
    const isExpanded = expandedSections[sectionKey];
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg mb-4 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-4 py-3 text-left font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <span className="text-base">{title}</span>
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="h-5 w-5 text-gray-500" />
          </div>
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 bg-gray-50">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 ${isModal ? 'rounded-xl shadow-2xl' : 'rounded-2xl shadow-lg border border-gray-200'} p-6`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Filter className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Search Filters</h3>
            <p className="text-sm text-gray-500">Refine your search results</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              Clear all
            </button>
          )}
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Active Filters */}
      {hasActiveFilters && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center mb-3">
            <h4 className="text-sm font-semibold text-blue-900">Active Filters</h4>
            <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 text-xs rounded-full font-medium">
              {Object.keys(filters).length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-white text-gray-700 border border-blue-200 shadow-sm"
              >
                <span className="font-medium text-blue-600">{key}:</span>
                <span className="ml-1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                <button
                  onClick={() => removeFilter(key as keyof SearchFiltersType)}
                  className="ml-2 p-0.5 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="h-3 w-3 text-red-500" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Filter Sections */}
      <div className="space-y-0">
        {/* Category Filter - Show for entities and all */}
        {(searchType === 'entities' || searchType === 'all') && (
          <FilterSection title="Category" sectionKey="category">
            <div className="space-y-2">
              {entityCategories.map((category) => (
                <label key={category.value} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.category === category.value}
                    onChange={(e) => 
                      updateFilter('category', e.target.checked ? category.value : undefined)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span className="text-sm text-gray-700">{category.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </FilterSection>
        )}

        {/* Rating Filter */}
        {(searchType === 'entities' || searchType === 'reviews' || searchType === 'all') && (
          <FilterSection title="Rating" sectionKey="rating">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) => 
                    updateFilter('minRating', e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Any rating</option>
                  <option value="1">1+ stars</option>
                  <option value="2">2+ stars</option>
                  <option value="3">3+ stars</option>
                  <option value="4">4+ stars</option>
                  <option value="5">5 stars only</option>
                </select>
              </div>
            </div>
          </FilterSection>
        )}

        {/* Verification Filter */}
        {(searchType === 'entities' || searchType === 'all') && (
          <FilterSection title="Verification" sectionKey="verification">
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verified || false}
                  onChange={(e) => updateFilter('verified', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Verified only</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasReviews || false}
                  onChange={(e) => updateFilter('hasReviews', e.target.checked || undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Has reviews</span>
              </label>
            </div>
          </FilterSection>
        )}

        {/* Sort */}
        <FilterSection title="Sort by" sectionKey="sort">
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="sortBy"
                  checked={filters.sortBy === option.value}
                  onChange={(e) => 
                    updateFilter('sortBy', e.target.checked ? option.value as any : undefined)
                  }
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
          
          {filters.sortBy && filters.sortBy !== 'relevance' && (
            <div className="mt-3">
              <select
                value={filters.sortOrder || 'desc'}
                onChange={(e) => updateFilter('sortOrder', e.target.value as 'asc' | 'desc')}
                className="w-full rounded-md border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="desc">High to Low</option>
                <option value="asc">Low to High</option>
              </select>
            </div>
          )}
        </FilterSection>
      </div>

      {/* Enhanced Results Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 bg-white rounded-lg p-4">
        <div className="text-center mb-4">
          <div className="text-lg font-semibold text-gray-900">
            {resultsCount > 0 ? (
              <span>{resultsCount.toLocaleString()} results found</span>
            ) : (
              <span>No results found</span>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {hasActiveFilters ? 'With current filters applied' : 'Try adding filters to refine your search'}
          </div>
        </div>
        
        {/* Apply Button for Modal */}
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
          >
            Apply Filters {hasActiveFilters && `(${Object.keys(filters).length})`}
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;