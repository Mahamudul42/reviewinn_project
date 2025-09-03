import React, { useState, useEffect } from 'react';
import { Loader2, Search, Plus } from 'lucide-react';
import EntityListCard from '../components/EntityListCard';
import { PurpleButton } from '../design-system/components/PurpleButton';
import type { Entity, SearchResult } from '../../types';
import { entityService } from '../../api/services/entityService';

interface SearchBarProps {
  onSearchResults: (results: SearchResult) => void;
  onEntitySelect: (entity: Entity) => void;
  placeholder?: string;
  maxResults?: number;
  onShowAdvancedSearch?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearchResults, 
  onEntitySelect, 
  placeholder = "Search for entities...",
  maxResults = 5,
  onShowAdvancedSearch
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);

  useEffect(() => {
    const performSearch = async () => {
      if (query.length === 0) {
        setSearchResults(null);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await entityService.searchEntities(query);
        setSearchResults(results);
        onSearchResults(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, onSearchResults]);

  const handleEntityClick = (entity: Entity) => {
    onEntitySelect(entity);
    setShowSuggestions(false);
    setQuery(entity.name);
  };
  const entitiesToShow = searchResults ? searchResults.entities.slice(0, maxResults) : [];
  const hasMore = searchResults ? searchResults.entities.length > maxResults : false;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .search-dropdown {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }
        .search-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .search-dropdown::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 3px;
        }
        .search-dropdown::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .search-dropdown::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg shadow-lg transition-all duration-200"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          role="combobox"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-describedby="search-status"
          aria-label="Search for entities"
        />
      </div>
      {/* Live region for search announcements */}
      <div
        id="search-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isLoading && "Searching..."}
        {!isLoading && searchResults && (
          `Found ${searchResults.entities.length} result${searchResults.entities.length === 1 ? '' : 's'} for "${query}"`
        )}
        {!isLoading && query.length > 0 && searchResults?.entities.length === 0 && (
          `No results found for "${query}"`
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {showSuggestions && searchResults && (
        <div 
          className="search-dropdown absolute z-[2000] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-[500px] overflow-y-auto" 
          style={{ animation: 'fadeInUp 0.2s ease-out' }}
          role="listbox"
          aria-label="Search results"
        >
          {entitiesToShow.length > 0 && (
            <div className="px-6 py-4 text-sm font-semibold text-gray-900 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h6m-6 4h6m-6 4h6" />
                </svg>
                Found {entitiesToShow.length} Entit{entitiesToShow.length === 1 ? 'y' : 'ies'}
              </div>
            </div>
          )}
          <div className="p-2 space-y-2">
            {entitiesToShow.map((entity, index) => (
              <div 
                key={entity.id} 
                className="hover:bg-blue-50 rounded-xl transition-colors p-1"
                role="option"
                aria-selected={false}
                aria-posinset={index + 1}
                aria-setsize={entitiesToShow.length}
              >
                <EntityListCard
                  entity={entity}
                  onClick={() => handleEntityClick(entity)}
                  variant="default"
                  showEngagementMetrics={true}
                  showActions={false}
                  showCategories={true}
                  className="!border-gray-200 !shadow-sm hover:!shadow-md hover:!border-blue-300 transition-all duration-200"
                />
              </div>
            ))}
          </div>
          {hasMore && onShowAdvancedSearch && (
            <div className="px-4 py-3 text-center">
              <button
                className="text-sm text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                onClick={onShowAdvancedSearch}
                type="button"
                aria-label={`See all ${searchResults.entities.length} results in advanced search`}
              >
                See more results in advanced search
              </button>
            </div>
          )}
          {entitiesToShow.length === 0 && query.length > 0 && (
            <div className="px-6 py-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">
                No entities found
              </div>
              <div className="text-sm text-gray-500 mb-4">
                No entities match "{query}". Try different keywords or add a new entity.
              </div>
              <PurpleButton
                size="sm"
                onClick={() => {
                  setShowSuggestions(false);
                  // Navigate to entities page add-entity tab with pre-filled search term
                  window.location.href = `/entities?tab=add-entity&name=${encodeURIComponent(query)}`;
                }}
                className="inline-flex items-center gap-2 transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add "{query}" as a new entity
              </PurpleButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
