import React, { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { EntityCategory } from '../../../types';
import type { SearchType, SearchFilters as SearchFiltersType } from '../types/searchTypes';

interface YouTubeSearchFiltersProps {
  searchType: SearchType;
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  resultsCount: number;
  hasActiveFilters: boolean;
}

const YouTubeSearchFilters: React.FC<YouTubeSearchFiltersProps> = ({
  searchType,
  filters,
  onFiltersChange,
  resultsCount,
  hasActiveFilters
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

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

  const toggleDropdown = (dropdown: string) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  // Filter options data
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date', label: 'Upload date' },
    { value: 'rating', label: 'Rating' },
    { value: 'name', label: 'Name' }
  ];

  const categoryOptions = [
    { value: EntityCategory.PROFESSIONALS, label: 'Professionals', icon: '👨‍💼' },
    { value: EntityCategory.COMPANIES, label: 'Companies', icon: '🏢' },
    { value: EntityCategory.PLACES, label: 'Places', icon: '📍' },
    { value: EntityCategory.PRODUCTS, label: 'Products', icon: '📦' }
  ];

  const ratingOptions = [
    { value: 1, label: '1+ stars' },
    { value: 2, label: '2+ stars' },
    { value: 3, label: '3+ stars' },
    { value: 4, label: '4+ stars' },
    { value: 5, label: '5 stars only' }
  ];

  const FilterDropdown: React.FC<{
    title: string;
    value: string | number | undefined;
    options: Array<{ value: any; label: string; icon?: string }>;
    onChange: (value: any) => void;
    dropdownKey: string;
  }> = ({ title, value, options, onChange, dropdownKey }) => (
    <div className="relative">
      <button
        onClick={() => toggleDropdown(dropdownKey)}
        className={`flex items-center space-x-2 px-4 py-2 border rounded-full text-sm transition-all duration-200 ${
          value !== undefined
            ? 'bg-black text-white border-black'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
        }`}
      >
        <span>{value !== undefined ? `${title}: ${options.find(o => o.value === value)?.label || value}` : title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === dropdownKey ? 'rotate-180' : ''}`} />
      </button>
      
      {activeDropdown === dropdownKey && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
          <div className="py-2">
            {value !== undefined && (
              <button
                onClick={() => {
                  onChange(undefined);
                  setActiveDropdown(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-sm"
              >
                Clear {title.toLowerCase()}
              </button>
            )}
            {value !== undefined && <div className="border-t border-gray-100 my-1"></div>}
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setActiveDropdown(null);
                }}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center ${
                  value === option.value ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      {/* Filters Pills Row - YouTube Style */}
      <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
        {/* Sort Filter */}
        <FilterDropdown
          title="Sort by"
          value={filters.sortBy}
          options={sortOptions}
          onChange={(value) => updateFilter('sortBy', value)}
          dropdownKey="sort"
        />

        {/* Category Filter - Show for entities and all */}
        {(searchType === 'entities' || searchType === 'all') && (
          <FilterDropdown
            title="Category"
            value={filters.category}
            options={categoryOptions}
            onChange={(value) => updateFilter('category', value)}
            dropdownKey="category"
          />
        )}

        {/* Rating Filter */}
        {(searchType === 'entities' || searchType === 'reviews' || searchType === 'all') && (
          <FilterDropdown
            title="Rating"
            value={filters.minRating}
            options={ratingOptions}
            onChange={(value) => updateFilter('minRating', value)}
            dropdownKey="rating"
          />
        )}

        {/* Verified Filter */}
        {(searchType === 'entities' || searchType === 'all') && (
          <button
            onClick={() => updateFilter('verified', !filters.verified)}
            className={`px-4 py-2 border rounded-full text-sm transition-all duration-200 ${
              filters.verified
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            Verified only
          </button>
        )}

        {/* Has Reviews Filter */}
        {(searchType === 'entities' || searchType === 'all') && (
          <button
            onClick={() => updateFilter('hasReviews', !filters.hasReviews)}
            className={`px-4 py-2 border rounded-full text-sm transition-all duration-200 ${
              filters.hasReviews
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            Has reviews
          </button>
        )}

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-full text-sm border border-red-200 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 text-xs text-gray-500">
          {Object.keys(filters).length} filter{Object.keys(filters).length !== 1 ? 's' : ''} applied
          {resultsCount > 0 && ` • ${resultsCount.toLocaleString()} results`}
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
};

export default YouTubeSearchFilters;