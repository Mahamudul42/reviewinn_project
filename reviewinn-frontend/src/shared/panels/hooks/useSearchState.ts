import { useState } from 'react';
import type { Review } from '../../../types';

/**
 * Shared search state management for middle panel components
 * Handles search results, query, pagination, and loading states
 */
export const useSearchState = () => {
  const [searchResults, setSearchResults] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);

  const handleSearchResults = (results: Review[], searchEntities: any[], query: string, hasMore = false) => {
    setSearchResults(results);
    setSearchQuery(query);
    setSearchHasMore(hasMore);
    setSearchPage(1);
    setShowingSearchResults(results.length > 0 || query.length > 0);
  };

  const handleCloseSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setShowingSearchResults(false);
    setSearchHasMore(false);
    setSearchLoadingMore(false);
    setSearchPage(1);
  };

  const handleLoadMoreSearchResults = async () => {
    setSearchLoadingMore(true);
    setTimeout(() => {
      setSearchLoadingMore(false);
      setSearchHasMore(false);
    }, 1000);
  };

  return {
    // State
    searchResults,
    searchQuery,
    showingSearchResults,
    searchHasMore,
    searchLoadingMore,
    searchPage,
    
    // Actions
    handleSearchResults,
    handleCloseSearch,
    handleLoadMoreSearchResults,
  };
};