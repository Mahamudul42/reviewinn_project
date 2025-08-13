import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import ReviewSearchHeader from './components/ReviewSearchHeader';
import SearchResults from './components/SearchResults';
import SearchFilterModal from './components/SearchFilterModal';
import { searchService } from '../../api/services/searchService';
import { useConfirmation } from '../../shared/components/ConfirmationSystem';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

import type { 
  SearchType, 
  SearchFilters as SearchFiltersType, 
  UnifiedSearchResult 
} from './types/searchTypes';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useConfirmation();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  // Search state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<SearchType>(
    (searchParams.get('type') as SearchType) || 'all'
  );
  const [filters, setFilters] = useState<SearchFiltersType>({});
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Debounced search function
  const performSearch = useCallback(async (
    searchQuery: string, 
    type: SearchType, 
    searchFilters: SearchFiltersType
  ) => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const results = await searchService.search({
        query: searchQuery,
        type,
        filters: searchFilters,
        page: 1,
        limit: 20
      });

      setSearchResults(results);

      // Update URL with search parameters
      const newSearchParams = new URLSearchParams();
      newSearchParams.set('q', searchQuery);
      newSearchParams.set('type', type);
      
      // Add filters to URL
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          newSearchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      setSearchParams(newSearchParams);
    } catch (error) {
      console.error('Search failed:', error);
      showError('Search failed. Please try again.');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams, showError]);

  // Manual search handler
  const handleManualSearch = () => {
    if (query.trim()) {
      performSearch(query, searchType, filters);
    }
  };

  // Initialize from URL parameters
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    const urlType = searchParams.get('type') as SearchType;
    
    if (urlQuery) {
      setQuery(urlQuery);
      setSearchType(urlType || 'all');
      
      // Parse filters from URL
      const urlFilters: SearchFiltersType = {};
      for (const [key, value] of searchParams.entries()) {
        if (key !== 'q' && key !== 'type') {
          try {
            urlFilters[key as keyof SearchFiltersType] = JSON.parse(value);
          } catch {
            urlFilters[key as keyof SearchFiltersType] = value as any;
          }
        }
      }
      setFilters(urlFilters);
    }
  }, [searchParams]);

  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handleTypeChange = (newType: SearchType) => {
    setSearchType(newType);
  };

  const handleFiltersChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    if (query.trim()) {
      performSearch(query, searchType, filters);
    }
  };

  const handleLoadMore = async () => {
    if (!searchResults || !query.trim()) return;

    setLoading(true);
    try {
      const nextPage = Math.floor(searchResults.entities.length / 20) + 1;
      const moreResults = await searchService.search({
        query,
        type: searchType,
        filters,
        page: nextPage,
        limit: 20
      });

      setSearchResults(prev => prev ? {
        ...moreResults,
        entities: [...prev.entities, ...moreResults.entities],
        reviews: [...(prev.reviews || []), ...(moreResults.reviews || [])],
        users: [...(prev.users || []), ...(moreResults.users || [])]
      } : moreResults);
    } catch (error) {
      console.error('Load more failed:', error);
      showError('Failed to load more results.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThreePanelLayout
      pageTitle="🔍 Search ReviewInn"
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Popular Searches & Trends"
      centerPanelWidth="700px"
      headerGradient="from-purple-600 via-blue-600 to-indigo-800"
      centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      variant="full-width"
    >
      {/* Search Middle Panel Content */}
      <div className="w-full space-y-6">
        {/* Review Search Header */}
        <ReviewSearchHeader
          query={query}
          searchType={searchType}
          onQueryChange={handleQueryChange}
          onTypeChange={handleTypeChange}
          onSearch={handleManualSearch}
          totalResults={searchResults?.total || 0}
          loading={loading}
          onShowFilters={() => setShowFilterModal(true)}
          hasActiveFilters={Object.keys(filters).length > 0}
          activeFiltersCount={Object.keys(filters).length}
        />

        {/* Review Search Results */}
        <div className="mt-4">
          {loading && !searchResults && (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!loading && !hasSearched && (
            <div className="text-center py-20">
              <div className="text-2xl font-medium text-gray-600 mb-4">
                Search for entities, reviews, and users
              </div>
              <div className="text-gray-500 text-lg">
                Enter your search term above to get started
              </div>
            </div>
          )}

          {!loading && hasSearched && (!searchResults || searchResults.total === 0) && (
            <div className="text-center py-20">
              <div className="text-2xl font-medium text-gray-700 mb-4">
                No results found for "{query}"
              </div>
              <div className="text-gray-500 text-lg mb-6">
                Try different keywords or remove search filters
              </div>
              <div className="text-gray-400">
                Search suggestions:
                <div className="mt-2 space-x-2">
                  <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">restaurants</span>
                  <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">products</span>
                  <span className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">companies</span>
                </div>
              </div>
            </div>
          )}

          {searchResults && searchResults.total > 0 && (
            <SearchResults
              results={searchResults}
              searchType={searchType}
              query={query}
              onLoadMore={handleLoadMore}
              loading={loading}
              hasMore={searchResults.hasMore}
              currentUser={currentUser}
              authState={{ isLoading: authLoading }}
              onRequireAuth={() => {
                if (authLoading) return;
                if (!currentUser) {
                  navigate('/login', { state: { from: `/search?${searchParams.toString()}` } });
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <SearchFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        searchType={searchType}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
      />

      {/* Review search CSS */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </ThreePanelLayout>
  );
};

export default SearchPage;