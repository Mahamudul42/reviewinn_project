import React, { useRef, useState, useMemo } from 'react';
import { Search, X, UserPlus, Ban, Check, Clock, Users } from 'lucide-react';
import UserDisplay from './UserDisplay';
import UserSearchBar from './UserSearchBar';
import { EmptyState } from '../../../shared/components/EmptyState';
import Pagination from '../../../shared/components/Pagination';
import type { User } from '../../../types';
import '../circle-purple-buttons.css';

interface UserSearchProps {
  searchResults: User[];
  currentUser: User | null;
  isUserInCircle: (userId: string | number) => boolean;
  sentRequestsSet: Set<string | number>;
  onSearchResults: (results: User[]) => void;
  onUserSelect: (user: User) => void;
  onSendRequest: (user: User) => void;
  onBlockUser: (userId: string | number, userName: string) => void;
  onSwitchToSuggestions?: () => void;
  onSwitchToMembers?: () => void;
}

const UserSearch: React.FC<UserSearchProps> = ({
  searchResults,
  currentUser,
  isUserInCircle,
  sentRequestsSet,
  onSearchResults,
  onUserSelect,
  onSendRequest,
  onBlockUser,
  onSwitchToSuggestions,
  onSwitchToMembers
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const itemsPerPage = 10;

  // Calculate paginated search results
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return searchResults.slice(startIndex, endIndex);
  }, [searchResults, currentPage, itemsPerPage]);

  // Reset to first page when search results change and mark that a search has been performed
  React.useEffect(() => {
    setCurrentPage(1);
    setHasSearched(true);
  }, [searchResults.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Find People ({searchResults.length})
        </h2>
      </div>

      {/* Search Bar */}
      <UserSearchBar
        onSearchResults={(results) => {
          setHasSearched(true);
          onSearchResults(results);
        }}
        onUserSelect={onUserSelect}
        currentUser={currentUser}
        isUserInCircle={isUserInCircle}
        sentRequestsSet={sentRequestsSet}
        onSendRequest={onSendRequest}
        onBlockUser={onBlockUser}
        placeholder="Search for people by name, username, or interests..."
        showDropdown={false} // Disable dropdown since we show results below
      />
      
      {/* Show results or empty state */}
      {!hasSearched ? (
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm">
          <EmptyState
            icon={<Search className="w-16 h-16" />}
            title="Start Your Search"
            description="Use the search bar above to find people by name, username, or interests. Connect with reviewers who share your tastes and build your trusted circle!"
            action={
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={onSwitchToSuggestions}
                  className="circle-action-button-primary px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Browse Suggestions</span>
                </button>
                <button 
                  onClick={onSwitchToMembers}
                  className="bg-white text-purple-600 border border-purple-200 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>View Circle Members</span>
                </button>
              </div>
            }
          />
        </div>
      ) : searchResults.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-orange-50 border border-orange-200 rounded-xl p-8 shadow-sm">
          <EmptyState
            icon={<Search className="w-16 h-16 text-orange-500" />}
            title="No Results Found"
            description="We couldn't find any users matching your search. Try using different keywords, checking spelling, or adjusting your search filters."
            action={
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => setHasSearched(false)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-all duration-200 hover:scale-105 flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Try Different Keywords</span>
                </button>
                <button 
                  onClick={onSwitchToSuggestions}
                  className="bg-white text-orange-600 border border-orange-200 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-all duration-200 flex items-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Browse Suggestions Instead</span>
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search Results Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Search className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Search Results</h3>
                  <p className="text-sm text-purple-600">
                    Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} • Showing {Math.min(itemsPerPage, searchResults.length)} per page
                  </p>
                </div>
              </div>
              <div className="text-sm text-purple-600 font-medium">
                Page {currentPage} of {Math.ceil(searchResults.length / itemsPerPage)}
              </div>
            </div>
          </div>

          {/* Search Results Cards Grid */}
          <div className="grid gap-4">
            {paginatedResults.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:border-purple-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <UserDisplay 
                      user={user}
                      size="lg"
                      subtitle={user.stats ? `Level ${user.level} • ${user.stats.totalReviews} reviews` : `Level ${user.level || 1}`}
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
                      onClick={() => onUserSelect(user)}
                    />
                    
                    {/* Additional User Info */}
                    {user.bio && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    
                    {/* User Stats Row */}
                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                      {user.stats?.totalReviews && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>{user.stats.totalReviews} reviews</span>
                        </span>
                      )}
                      {user.level && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Level {user.level}</span>
                        </span>
                      )}
                      {user.joinedAt && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Member since {new Date(user.joinedAt).getFullYear()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="ml-6 flex flex-col space-y-2">
                    {currentUser?.id !== user.id && !isUserInCircle(user.id) && !sentRequestsSet.has(user.id) && (
                      <>
                        <button
                          onClick={() => onSendRequest(user)}
                          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2 group-hover:scale-105"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Add to Circle</span>
                        </button>
                        <button
                          onClick={() => onBlockUser(user.id, user.name)}
                          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-red-100 hover:text-red-600 transition-colors flex items-center space-x-2"
                          title="Block user"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Block</span>
                        </button>
                      </>
                    )}
                    
                    {/* View Profile Button (always shown) */}
                    <button
                      onClick={() => onUserSelect(user)}
                      className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced Pagination */}
          {searchResults.length > itemsPerPage && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <Pagination
                currentPage={currentPage}
                totalItems={searchResults.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;