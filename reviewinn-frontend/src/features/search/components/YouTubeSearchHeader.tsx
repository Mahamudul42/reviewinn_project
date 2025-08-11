import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Mic, Camera, Filter } from 'lucide-react';
import type { SearchType } from '../types/searchTypes';

interface YouTubeSearchHeaderProps {
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

const YouTubeSearchHeader: React.FC<YouTubeSearchHeaderProps> = ({
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock search suggestions (like YouTube)
  const mockSuggestions = [
    'restaurants near me',
    'best laptops 2024',
    'product reviews',
    'company reviews',
    'doctor reviews',
    'software recommendations',
    'travel destinations',
    'restaurant recommendations'
  ];

  useEffect(() => {
    if (query.length > 0) {
      const filtered = mockSuggestions.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(focused && filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query, focused]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    onQueryChange('');
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onQueryChange(suggestion);
    setShowSuggestions(false);
  };

  const formatResultsCount = (count: number) => {
    if (count === 0) return '';
    if (count < 1000) return `About ${count.toLocaleString()} results`;
    if (count < 1000000) return `About ${(count / 1000).toFixed(0)}K results`;
    return `About ${(count / 1000000).toFixed(1)}M results`;
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4">
        {/* Main Search Bar - YouTube Style */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative flex-1 max-w-2xl">
            {/* Search Input Container */}
            <div className={`flex items-center border-2 rounded-full overflow-hidden transition-all duration-200 ${
              focused ? 'border-blue-500 shadow-lg' : 'border-gray-300 hover:border-gray-400'
            }`}>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full px-4 py-3 text-base outline-none"
                  placeholder="Search ReviewInn"
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  onFocus={() => {
                    setFocused(true);
                    if (query.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowSuggestions(false);
                      inputRef.current?.blur();
                    }
                  }}
                />
                
                {query && (
                  <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center border-l border-gray-300">
                <button className="px-6 py-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Search className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Voice Search Button */}
            <button className="ml-3 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              <Mic className="h-5 w-5 text-gray-600" />
            </button>

            {/* Visual Search Button */}
            <button className="ml-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
              <Camera className="h-5 w-5 text-gray-600" />
            </button>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute top-full left-0 right-14 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 py-2 z-50"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Search className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-800">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results Count and Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {loading ? (
              <span>Searching...</span>
            ) : (
              query && <span>{formatResultsCount(totalResults)}</span>
            )}
          </div>

          {/* Filter Button */}
          <button
            onClick={onShowFilters}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              hasActiveFilters
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Type Tabs - YouTube Style */}
        <div className="flex items-center space-x-1 mt-4 border-b border-gray-200">
          {[
            { key: 'all', label: 'All', icon: '🔍' },
            { key: 'entities', label: 'Entities', icon: '🏢' },
            { key: 'reviews', label: 'Reviews', icon: '⭐' },
            { key: 'users', label: 'Users', icon: '👤' }
          ].map((type) => (
            <button
              key={type.key}
              onClick={() => onTypeChange(type.key as SearchType)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-all duration-200 ${
                searchType === type.key
                  ? 'border-black text-black font-medium'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YouTubeSearchHeader;