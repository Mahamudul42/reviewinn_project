import React, { useState, useEffect } from 'react';
import { Loader2, Search } from 'lucide-react';
import EntityListCard from '../components/EntityListCard';
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
        />
      </div>
      {/* Search Results Dropdown */}
      {showSuggestions && searchResults && (
        <div className="absolute z-[2000] w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-96 overflow-y-auto animate-fade-in-up">
          {entitiesToShow.length > 0 && (
            <div className="px-6 py-3 text-sm font-semibold text-gray-900 bg-gray-50 border-b rounded-t-2xl">
              Found Entities
            </div>
          )}
          {entitiesToShow.map((entity) => (
            <div key={entity.id} className="px-4 py-2 hover:bg-blue-50 rounded-xl transition-colors">
              <EntityListCard
                entity={entity}
                onClick={() => handleEntityClick(entity)}
                variant="compact"
                showEngagementMetrics={false}
                showActions={false}
              />
            </div>
          ))}
          {hasMore && onShowAdvancedSearch && (
            <div className="px-4 py-3 text-center">
              <button
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={onShowAdvancedSearch}
              >
                See more results in advanced search
              </button>
            </div>
          )}
          {entitiesToShow.length === 0 && query.length > 0 && (
            <div className="px-4 py-6 text-center">
              <div className="text-sm text-gray-500 mb-2">
                No entities found for "{query}"
              </div>
              <button
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => {
                  setShowSuggestions(false);
                  // Navigate to add entity page with pre-filled search term
                  window.location.href = `/add-entity?name=${encodeURIComponent(query)}`;
                }}
              >
                Add "{query}" as a new entity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
