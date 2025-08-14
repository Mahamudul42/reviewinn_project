import React, { useState, useMemo } from 'react';
import { TrendingUp, Users, Search, UserPlus, Sparkles } from 'lucide-react';
import { circleService } from '../../../api/services';
import UserDisplay from './UserDisplay';
import UserActionsMenu from './UserActionsMenu';
import { EmptyState } from '../../../shared/components/EmptyState';
import Pagination from '../../../shared/components/Pagination';
import type { CircleSuggestion, User } from '../../../types';
import '../circle-purple-buttons.css';

interface SuggestionCardProps {
  suggestion: CircleSuggestion;
  currentUser: User | null;
  sentRequestsSet: Set<string>;
  onAddToCircle: (userId: string | number, userName?: string) => Promise<void>;
  onError: (message: string) => void;
  onBlockUser: (userId: string, userName: string) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, currentUser, sentRequestsSet, onAddToCircle, onError, onBlockUser }) => {
  const [isAdding, setIsAdding] = React.useState(false);

  const userId = suggestion.user.id || suggestion.user.user_id;
  const userIdString = String(userId);

  console.log('💡 SuggestionCard render:', {
    userName: suggestion.user.name,
    userId: userIdString
  });

  const handleAddClick = async () => {
    console.log('🎯 SuggestionCard handleAddClick:', {
      userName: suggestion.user.name,
      userId: userIdString
    });
    
    setIsAdding(true);
    console.log('⏳ Setting isAdding to true');
    
    try {
      if (!userId) {
        console.error('❌ No valid user ID found in suggestion:', suggestion.user);
        onError('Error: User ID not found');
        return;
      }
      
      console.log('📤 Calling onAddToCircle with userId:', userId);
      await onAddToCircle(userId, suggestion.user.name);
      console.log('✅ onAddToCircle completed successfully');
      
    } catch (error) {
      console.error('❌ Error in handleAddClick:', error);
    } finally {
      console.log('🔄 Setting isAdding to false');
      setIsAdding(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="space-y-3">
        <UserDisplay 
          user={{
            id: suggestion.user.id || suggestion.user.user_id || '',
            name: suggestion.user.name || 'Unknown User',
            username: suggestion.user.username || 'username',
            avatar: suggestion.user.avatar
          }}
          size="lg"
          actions={currentUser ? (
            <div className="flex items-center space-x-2">
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 circle-action-button-primary"
                onClick={handleAddClick}
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add to Circle</span>
                )}
              </button>
              <UserActionsMenu
                userId={userIdString}
                userName={suggestion.user.name || 'Unknown User'}
                userType="suggestion"
                onBlock={onBlockUser}
              />
            </div>
          ) : undefined}
        />
        
        <div className="space-y-2">
          <div>
            <span className={`font-medium ${circleService.getTasteMatchColor(suggestion.taste_match_score || 0)}`}>
              {(suggestion.taste_match_score || 0).toFixed(1)}% taste match
            </span>
            {(suggestion.mutual_connections || 0) > 0 && (
              <span className="text-sm text-purple-600 ml-2">
                • {suggestion.mutual_connections} mutual connections
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1">
            {(suggestion.reasons || []).map((reason, reasonIndex) => (
              <span key={reasonIndex} className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                {reason}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CircleSuggestionsProps {
  suggestions: CircleSuggestion[];
  currentUser: User | null;
  sentRequestsSet: Set<string>;
  onAddToCircle: (userId: string | number, userName?: string) => Promise<void>;
  onError: (message: string) => void;
  onBlockUser: (userId: string, userName: string) => void;
}

const CircleSuggestions: React.FC<CircleSuggestionsProps> = ({
  suggestions,
  currentUser,
  sentRequestsSet,
  onAddToCircle,
  onError,
  onBlockUser
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter out suggestions that already have sent requests, then paginate
  const filteredSuggestions = useMemo(() => {
    return suggestions.filter(suggestion => {
      const userId = String(suggestion.user.id || suggestion.user.user_id || '');
      const hasPendingRequest = sentRequestsSet.has(userId);
      
      if (hasPendingRequest) {
        console.log('🚫 Filtering out suggestion with pending request:', suggestion.user.name, userId);
      }
      
      return !hasPendingRequest;
    });
  }, [suggestions, sentRequestsSet]);

  // Calculate paginated suggestions from filtered results
  const paginatedSuggestions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredSuggestions.slice(startIndex, endIndex);
  }, [filteredSuggestions, currentPage, itemsPerPage]);

  // Reset to first page when suggestions change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [suggestions.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Suggested Members ({filteredSuggestions.length})</h2>
      </div>
      
      {filteredSuggestions.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm">
          <EmptyState
            icon={<Sparkles className="w-16 h-16" />}
            title={suggestions.length === 0 ? "No Suggestions Yet" : "All Suggestions Sent"}
            description={suggestions.length === 0 
              ? "We're working on finding the perfect reviewers for your circle based on your interests and review history. Check back soon!"
              : "Great! You've sent circle requests to all available suggestions. Check the 'Sent' tab to see your pending requests."
            }
            action={
              <div className="flex flex-col space-y-3">
                <button className="circle-action-button-primary px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Search Users</span>
                </button>
                <button className="bg-white text-purple-600 border border-purple-200 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-all duration-200 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Friends</span>
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="grid gap-4 p-4">
            {paginatedSuggestions.map((suggestion, index) => {
            try {
              return (
                <SuggestionCard
                  key={suggestion.user.id || index}
                  suggestion={suggestion}
                  currentUser={currentUser}
                  sentRequestsSet={sentRequestsSet}
                  onAddToCircle={(userId) => onAddToCircle(String(suggestion.user.id || suggestion.user.user_id || userId), suggestion.user.name)}
                  onError={onError}
                  onBlockUser={onBlockUser}
                />
              );
            } catch (renderError) {
              console.error('Error rendering suggestion:', renderError, suggestion);
              return (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">Error rendering suggestion</p>
                </div>
              );
            }
            })}
          </div>
          
          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={filteredSuggestions.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default CircleSuggestions;