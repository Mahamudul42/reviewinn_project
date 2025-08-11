import React from 'react';
import { X } from 'lucide-react';
import type { SearchResult } from '../../../types';

interface EntitySearchResultsProps {
  searchResults: SearchResult | null;
  isSearchMode: boolean;
  onClearSearch: () => void;
}

const EntitySearchResults: React.FC<EntitySearchResultsProps> = ({ 
  searchResults, 
  isSearchMode, 
  onClearSearch 
}) => {
  if (!isSearchMode || !searchResults) {
    return null;
  }

  return (
    <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <span className="text-sm font-bold text-blue-600">
              {searchResults.total}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {searchResults.total > 0 
                ? `Found ${searchResults.total} result${searchResults.total !== 1 ? 's' : ''}`
                : 'No results found'
              }
            </p>
            <p className="text-xs text-gray-500">
              {searchResults.total > 0 
                ? 'Showing relevant entities for your search'
                : 'Try adjusting your search terms or filters'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={onClearSearch}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <X className="h-4 w-4" />
          <span>Clear Search</span>
        </button>
      </div>
    </div>
  );
};

export default EntitySearchResults;