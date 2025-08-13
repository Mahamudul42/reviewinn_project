import React, { useRef } from 'react';
import { Search, X, UserPlus, Ban, Check, Clock } from 'lucide-react';
import UserDisplay from './UserDisplay';
import type { User } from '../../../types';
import '../circle-purple-buttons.css';

interface UserSearchProps {
  searchQuery: string;
  searchResults: User[];
  searchLoading: boolean;
  showDropdown: boolean;
  currentUser: User | null;
  isUserInCircle: (userId: string | number) => boolean;
  sentRequestsSet: Set<string | number>;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  onSendRequest: (user: User) => void;
  onBlockUser: (userId: string | number, userName: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({
  searchQuery,
  searchResults,
  searchLoading,
  showDropdown,
  currentUser,
  isUserInCircle,
  sentRequestsSet,
  onSearchChange,
  onClearSearch,
  onSendRequest,
  onBlockUser
}) => {
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Find People</h2>
      </div>
      
      {/* Search Input */}
      <div ref={searchRef} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search for people by name, username, or interests..."
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
          {searchQuery && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={onClearSearch}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchQuery.length >= 2 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-purple-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {searchResults.length === 0 && !searchLoading ? (
              <div className="p-4 text-center text-purple-400">
                <Search className="mx-auto h-8 w-8 text-purple-300 mb-2" />
                <p>No users found matching "{searchQuery}"</p>
                <p className="text-sm">Try searching by name, username, or interests</p>
              </div>
            ) : (
              <div className="py-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-3 hover:bg-purple-50 border-b border-purple-100 last:border-b-0"
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
                              className="circle-action-button-primary px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-1.5 shadow-md"
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>Add to Circle</span>
                            </button>
                            <button
                              onClick={() => onBlockUser(user.id, user.name)}
                              className="circle-action-button-primary px-2 py-1.5 rounded-lg text-xs transition-all duration-200 hover:scale-105 flex items-center"
                              title="Block user"
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                          </div>
                        ) : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Tips */}
      {searchQuery.length === 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
          <h3 className="font-medium text-purple-900 mb-2">Search Tips</h3>
          <ul className="text-sm text-purple-700 space-y-1">
            <li>• Search by name, username, or interests</li>
            <li>• Use at least 2 characters to start searching</li>
            <li>• Click on user names to view their profiles</li>
            <li>• Send circle requests to connect with reviewers</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserSearch;