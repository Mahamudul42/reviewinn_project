import React from 'react';
import { TrendingUp } from 'lucide-react';
import { circleService } from '../../../api/services';
import UserDisplay from './UserDisplay';
import type { CircleSuggestion, User } from '../../../types';

interface SuggestionCardProps {
  suggestion: CircleSuggestion;
  currentUser: User | null;
  sentRequestsSet: Set<string>;
  onAddToCircle: (userId: string | number) => void;
  onError: (message: string) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, currentUser, sentRequestsSet, onAddToCircle, onError }) => {
  const [isAdding, setIsAdding] = React.useState(false);

  const userId = suggestion.user.id || suggestion.user.user_id;
  const userIdString = String(userId);
  const hasPendingRequest = sentRequestsSet.has(userIdString);

  const handleAddClick = async () => {
    if (hasPendingRequest) {
      onError(`Circle request already sent to ${suggestion.user.name || 'this user'}.`);
      return;
    }
    
    setIsAdding(true);
    try {
      if (!userId) {
        console.error('No valid user ID found in suggestion:', suggestion.user);
        onError('Error: User ID not found');
        return;
      }
      await onAddToCircle(userId);
    } finally {
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
            <button
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 ${
                hasPendingRequest 
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              onClick={handleAddClick}
              disabled={isAdding || hasPendingRequest}
            >
              {isAdding ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : hasPendingRequest ? (
                <span>Request Pending</span>
              ) : (
                <span>Add to Circle</span>
              )}
            </button>
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
  onAddToCircle: (userId: string | number, userName?: string) => void;
  onError: (message: string) => void;
}

const CircleSuggestions: React.FC<CircleSuggestionsProps> = ({
  suggestions,
  currentUser,
  sentRequestsSet,
  onAddToCircle,
  onError
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Suggested Members ({suggestions.length})</h2>
      </div>
      
      {suggestions.length === 0 ? (
        <div className="text-center py-8 text-purple-400">
          <TrendingUp size={48} className="mx-auto mb-2 text-purple-300" />
          <p>No suggestions available</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {suggestions.map((suggestion, index) => {
            try {
              return (
                <SuggestionCard
                  key={suggestion.user.id || index}
                  suggestion={suggestion}
                  currentUser={currentUser}
                  sentRequestsSet={sentRequestsSet}
                  onAddToCircle={(userId) => onAddToCircle(String(suggestion.user.id || suggestion.user.user_id || userId), suggestion.user.name)}
                  onError={onError}
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
      )}
    </div>
  );
};

export default CircleSuggestions;