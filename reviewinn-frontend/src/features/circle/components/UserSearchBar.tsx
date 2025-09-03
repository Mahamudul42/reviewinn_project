import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, UserPlus, Check, Clock, Ban } from 'lucide-react';
import { circleService } from '../../../api/services';
import UserFilterModal from './UserFilterModal';
import UserDisplay from './UserDisplay';
import type { User } from '../../../types';

interface UserSearchBarProps {
  onSearchResults: (results: User[]) => void;
  onUserSelect: (user: User) => void;
  currentUser: User | null;
  isUserInCircle: (userId: string | number) => boolean;
  sentRequestsSet: Set<string | number>;
  onSendRequest: (user: User) => void;
  onBlockUser: (userId: string | number, userName: string) => void;
  placeholder?: string;
  initialQuery?: string;
  showDropdown?: boolean; // Control whether to show the dropdown or not
}

interface UserFilters {
  trustLevel?: string;
  minTasteMatch?: number;
  hasReviews?: boolean;
  sortBy?: 'name' | 'taste_match' | 'review_count' | 'level';
  sortOrder?: 'asc' | 'desc';
}

const UserSearchBar: React.FC<UserSearchBarProps> = ({
  onSearchResults,
  onUserSelect,
  currentUser,
  isUserInCircle,
  sentRequestsSet,
  onSendRequest,
  onBlockUser,
  placeholder = "Search for people by name, username, or interests...",
  initialQuery = "",
  showDropdown: enableDropdown = true // Default to true for backward compatibility
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({});
  const [filterCount, setFilterCount] = useState(0);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const performSearch = useCallback(async (searchQuery: string, filters: UserFilters) => {
    setIsLoading(true);
    try {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        onSearchResults([]);
        return;
      }

      const response = await circleService.searchUsers({ 
        query: searchQuery, 
        limit: 20,
        ...filters
      });
      
      const results = response.users || [];
      setSearchResults(results);
      setShowDropdown(true);
      onSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setShowDropdown(false);
      onSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove onSearchResults from dependency array to prevent infinite re-renders

  const handleSearch = () => {
    if (query.trim().length < 2) {
      // Show a brief message if query is too short
      setSearchResults([]);
      setShowDropdown(true);
      return;
    }
    performSearch(query, appliedFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    onSearchResults([]);
  };

  const handleFilterApply = (filters: UserFilters) => {
    setAppliedFilters(filters);
    
    // Count applied filters
    const count = Object.values(filters).filter(value => value !== undefined && value !== null).length;
    setFilterCount(count);
    
    // Note: Not automatically searching - user needs to click search button
    // This reduces server load and gives user control over when to search
  };

  // Clear results when query becomes empty
  useEffect(() => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      onSearchResults([]);
    }
  }, [query]); // Remove onSearchResults from dependency array to prevent infinite re-renders

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-search-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Screen reader helper text */}
      <div id="search-help" className="sr-only">
        Enter at least 2 characters to search for users. Use the arrow keys to navigate results when available.
      </div>
      {/* Main Search Bar - YouTube Style */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-2xl user-search-container">
          <div className="flex items-center bg-white border border-gray-300 rounded-full shadow-sm hover:shadow-md focus-within:shadow-lg focus-within:border-purple-500 transition-all duration-200">
            <input
              type="text"
              className="flex-1 px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none text-base"
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              aria-label="Search for users by name, username, or interests"
              aria-describedby="search-help"
              role="searchbox"
              aria-autocomplete="list"
              aria-expanded={enableDropdown && showDropdown}
              aria-haspopup="listbox"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
                aria-label="Clear search"
                type="button"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className={`px-6 py-3 rounded-r-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-l border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                query.trim().length >= 2 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              aria-label={query.trim().length < 2 ? 'Enter at least 2 characters to search' : 'Search for users'}
              type="button"
            >
              {isLoading ? (
                <div 
                  className={`animate-spin rounded-full h-5 w-5 border-2 border-t-transparent ${
                    query.trim().length >= 2 ? 'border-white' : 'border-gray-400'
                  }`}
                  role="status"
                  aria-label="Searching"
                />
              ) : (
                <Search className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Search Results Dropdown - Only show if dropdown is enabled */}
          {enableDropdown && showDropdown && (
            <div 
              className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
              role="listbox"
              aria-label="Search results"
            >
              {query.trim().length < 2 ? (
                <div className="p-4 text-center text-gray-500">
                  <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p>Please enter at least 2 characters to search</p>
                  <p className="text-sm">Then click the search button or press Enter</p>
                </div>
              ) : isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent mx-auto mb-2" />
                  <p>Searching for users...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p>No users found matching "{query}"</p>
                  <p className="text-sm">Try searching by name, username, or interests</p>
                  <p className="text-xs text-gray-400 mt-1">Note: Users with pending requests or already in your circle are filtered out</p>
                </div>
              ) : (
                <div className="py-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <UserDisplay 
                        user={{
                          id: user.id,
                          name: user.name,
                          username: user.username,
                          avatar: user.avatar
                        }}
                        size="md"
                        subtitle={user.stats ? `Level ${user.level} • ${user.stats.totalReviews} reviews` : undefined}
                        badge={
                          currentUser?.id === user.id ? (
                            <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200">
                              That's You!
                            </span>
                          ) : isUserInCircle(user.id) ? (
                            <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-medium border border-green-200 flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Circle Member</span>
                            </span>
                          ) : sentRequestsSet.has(user.id) ? (
                            <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 rounded-full text-xs font-medium border border-orange-200 flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Request Pending</span>
                            </span>
                          ) : undefined
                        }
                        actions={
                          currentUser?.id !== user.id && !isUserInCircle(user.id) && !sentRequestsSet.has(user.id) ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => onSendRequest(user)}
                                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs font-medium hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-1.5"
                                aria-label={`Send friend request to ${user.name}`}
                                type="button"
                              >
                                <UserPlus className="w-3 h-3" aria-hidden="true" />
                                <span>Add to Circle</span>
                              </button>
                              <button
                                onClick={() => onBlockUser(user.id, user.name)}
                                className="px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center"
                                aria-label={`Block user ${user.name}`}
                                type="button"
                              >
                                <Ban className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          ) : undefined
                        }
                        onClick={() => onUserSelect(user)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className={`relative flex items-center space-x-2 px-4 py-3 border-2 rounded-xl transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
            filterCount > 0 
              ? 'bg-purple-50 border-purple-200 text-purple-700' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
          aria-label={filterCount > 0 ? `Search filters: ${filterCount} filter(s) applied` : 'Add search filters'}
          type="button"
        >
          <Filter className="h-5 w-5" aria-hidden="true" />
          <span className="font-medium">Filter</span>
          {filterCount > 0 && (
            <span 
              className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center"
              aria-label={`${filterCount} filters applied`}
            >
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Modal */}
      <UserFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        initialFilters={appliedFilters}
      />
    </div>
  );
};

export default UserSearchBar;