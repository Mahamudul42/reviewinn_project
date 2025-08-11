import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, Filter } from 'lucide-react';
import type { SearchType } from '../types/searchTypes';

interface SearchHeaderProps {
  query: string;
  searchType: SearchType;
  onQueryChange: (query: string) => void;
  onTypeChange: (type: SearchType) => void;
  totalResults: number;
  loading: boolean;
  onShowFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount?: number;
}

const searchTypes: Array<{ key: SearchType; label: string; icon: string }> = [
  { key: 'all', label: 'All', icon: '🔍' },
  { key: 'entities', label: 'Entities', icon: '🏢' },
  { key: 'reviews', label: 'Reviews', icon: '⭐' },
  { key: 'users', label: 'Users', icon: '👤' }
];

const SearchHeader: React.FC<SearchHeaderProps> = ({
  query,
  searchType,
  onQueryChange,
  onTypeChange,
  totalResults,
  loading,
  onShowFilters,
  hasActiveFilters,
  activeFiltersCount = 0
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input on mount
    if (inputRef.current && !query) {
      inputRef.current.focus();
    }
  }, []);

  const handleClear = () => {
    onQueryChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatResultsCount = (count: number) => {
    if (count === 0) return 'No results';
    if (count === 1) return '1 result';
    if (count < 1000) return `${count} results`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K results`;
    return `${(count / 1000000).toFixed(1)}M results`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Search Input with Filter Button */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          ) : (
            <Search className="h-6 w-6 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          className={`block w-full pl-14 pr-24 py-4 border-2 rounded-xl bg-white text-gray-900 placeholder-gray-500 text-lg transition-all duration-200 ${
            focused 
              ? 'border-blue-500 ring-4 ring-blue-500/20' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          placeholder="Search entities, reviews, users..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 space-x-2">
          {query && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          
          {/* Enhanced Filter Button */}
          <button
            onClick={onShowFilters}
            className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-sm border ${
              hasActiveFilters
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            title="Search Filters"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="bg-white text-blue-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Type Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {searchTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => onTypeChange(type.key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                searchType === type.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        {query && (
          <div className="text-sm text-gray-600">
            {loading ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </span>
            ) : (
              <span>{formatResultsCount(totalResults)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHeader;