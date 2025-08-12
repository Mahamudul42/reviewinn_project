import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Edit3, X, ArrowRight } from 'lucide-react';
import { PurpleButton } from '../../../shared/design-system/components/PurpleButton';
import { searchService } from '../../../api/services/searchService';
import type { Review } from '../../../types';

interface AddReviewStatusBarProps {
  userAvatar: string;
  userName: string;
  onClick: () => void;
  barRef?: React.RefObject<HTMLDivElement | null>;
  onSearchResults?: (results: Review[], entities: any[], query: string, hasMore?: boolean) => void;
}

type Mode = 'split' | 'search';

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 outline outline-2 outline-yellow-500";

const AddReviewStatusBar: React.FC<AddReviewStatusBarProps> = ({ 
  userAvatar, 
  userName, 
  onClick, 
  barRef,
  onSearchResults 
}) => {
  const [mode, setMode] = useState<Mode>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Review[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);

  // Lightweight suggestions fetcher (for autocomplete)
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const suggestions = await searchService.searchSuggestions(query.trim(), 6);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setSelectedSuggestion(-1);
    } catch (error) {
      console.error('Suggestions failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Store the callback in a ref to avoid dependency issues
  const onSearchResultsRef = useRef(onSearchResults);
  useEffect(() => {
    onSearchResultsRef.current = onSearchResults;
  }, [onSearchResults]);

  // Full search function (only triggered on button click or Enter)
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      onSearchResultsRef.current?.([], [], '');
      return;
    }

    setIsSearching(true);
    setShowSuggestions(false); // Hide suggestions when performing actual search
    
    try {
      const results = await searchService.search({
        query: query.trim(),
        type: 'all',
        page: 1,
        limit: 20,
        filters: {
          sortBy: 'relevance',
          sortOrder: 'desc'
        }
      });
      
      // Don't filter entities - pass all entities so reviews can find their entities
      const entities = results.entities || [];
      
      const reviews = results.reviews || [];
      const hasMore = results.hasMore || reviews.length >= 20; // Assume more if we got 20 results
      setSearchResults(reviews);
      onSearchResultsRef.current?.(reviews, entities, query.trim(), hasMore);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      onSearchResultsRef.current?.([], [], query.trim(), false);
    } finally {
      setIsSearching(false);
    }
  }, []); // No dependencies needed now

  // Debounce suggestions (light-weight operation during typing)
  useEffect(() => {
    if (mode === 'search' && searchQuery) {
      const timeoutId = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 150); // Faster for suggestions

      return () => clearTimeout(timeoutId);
    } else if (mode === 'split') {
      setSearchResults([]);
      setSuggestions([]);
      setShowSuggestions(false);
      onSearchResultsRef.current?.([], [], '', false);
    }
  }, [searchQuery, mode, fetchSuggestions]); // Remove onSearchResults from dependencies

  // Handle search input changes (only for suggestions, no heavy search)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedSuggestion(-1);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Only clear results if query becomes too short, don't trigger search during typing
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchResults([]);
      onSearchResults?.([], [], '', false);
    }
  };

  // Handle keyboard navigation and search triggers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setMode('split');
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);
      onSearchResults?.([], [], '', false);
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        // Use selected suggestion
        const selectedQuery = suggestions[selectedSuggestion];
        setSearchQuery(selectedQuery);
        setShowSuggestions(false);
        performSearch(selectedQuery);
      } else {
        // Use current query
        performSearch(searchQuery);
      }
      return;
    }
    
    // Handle arrow key navigation for suggestions
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => prev > -1 ? prev - 1 : -1);
      }
    }
  };

  // Handle search activation
  const handleSearchClick = () => {
    setMode('search');
  };

  // Handle write activation
  const handleWriteClick = () => {
    onClick();
  };

  // Clear search and return to split mode
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestion(-1);
    setIsSearching(false);
    onSearchResults?.([], [], '', false);
    setMode('split');
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  // Manual search trigger (button click)
  const triggerSearch = () => {
    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(false);
      performSearch(searchQuery);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion);
  };

  // Render search mode
  if (mode === 'search') {
    return (
      <div className="relative w-full">
        <div
          ref={barRef}
          className={`flex items-center gap-3 p-4 shadow-lg rounded-xl transition-all duration-200 ${cardBg}`}
        >
          <img 
            src={userAvatar} 
            alt={userName} 
            className="w-10 h-10 rounded-full object-cover border border-gray-300" 
          />
          <div className="flex-1 flex items-center gap-2">
            <Search className="w-4 h-4 text-purple-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search reviews..."
              className="flex-1 bg-transparent text-gray-700 text-sm placeholder-gray-500 focus:outline-none h-10 py-2"
              autoFocus
            />
            
            {/* Show search button when typing */}
            {searchQuery.trim().length >= 2 && !isSearching && (
              <PurpleButton
                onClick={triggerSearch}
                size="sm"
                className="h-10 px-3 py-2 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1.5 text-sm font-medium"
                title="Click to search"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </PurpleButton>
            )}
            
            {/* Show clear button when there's text */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-purple-50"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Show loading spinner only when actively searching */}
            {isSearching && searchQuery.trim().length >= 2 && (
              <div className="h-10 w-10 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-purple-600 transition-colors duration-200 rounded-lg hover:bg-purple-50 h-10 w-10 flex items-center justify-center"
              title="Back to options"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* YouTube-style suggestions dropdown - Full container width */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto w-full">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left hover:bg-gray-50 transition-colors duration-150 flex items-center ${
                  index === selectedSuggestion ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === suggestions.length - 1 ? 'rounded-b-xl' : ''}`}
                onMouseEnter={() => setSelectedSuggestion(index)}
                onMouseLeave={() => setSelectedSuggestion(-1)}
              >
                {/* Align with avatar + icon spacing */}
                <div className="flex items-center gap-3 py-3 px-4 w-full">
                  <div className="w-10"></div> {/* Avatar space */}
                  <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm flex-1">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render split mode (default)
  return (
    <div
      ref={barRef}
      className={`flex items-center gap-3 p-4 shadow-lg rounded-xl transition-all duration-200 ${cardBg}`}
    >
      <img 
        src={userAvatar} 
        alt={userName} 
        className="w-10 h-10 rounded-full object-cover border border-gray-300" 
      />
      
      {/* Search Section */}
      <div 
        className="flex-1 flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-purple-50 group"
        onClick={handleSearchClick}
      >
        <Search className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
        <span className="text-sm text-gray-600 group-hover:text-purple-700 font-medium">
          Search reviews
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300"></div>

      {/* Write Section */}
      <div 
        className="flex-1 flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-all duration-200 hover:bg-yellow-50 group"
        onClick={handleWriteClick}
      >
        <Edit3 className="w-4 h-4 text-yellow-600 group-hover:text-yellow-700" />
        <span className="text-sm text-gray-600 group-hover:text-yellow-700 font-medium">
          Write a review, {userName}
        </span>
      </div>
    </div>
  );
};

export default AddReviewStatusBar; 