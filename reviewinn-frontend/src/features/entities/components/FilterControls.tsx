import React from 'react';
import { ChevronDown, Clock, Filter, Zap, Target } from 'lucide-react';
import type { Review } from '../../../types';
import StarRating from '../../../shared/atoms/StarRating';

interface FilterControlsProps {
  allReviews: Review[];
  displayedReviews: Review[];
  selectedRating: number | 'all';
  timeSort: 'newest' | 'oldest';
  showSortDropdown: boolean;
  isSorting: boolean;
  onRatingChange: (rating: number | 'all') => void;
  onTimeSortChange: (sort: 'newest' | 'oldest') => void;
  onToggleSortDropdown: () => void;
  className?: string;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  allReviews,
  displayedReviews,
  selectedRating,
  timeSort,
  showSortDropdown,
  isSorting,
  onRatingChange,
  onTimeSortChange,
  onToggleSortDropdown,
  className = ''
}) => {
  return (
    <div className={className}>
      <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Colorful Header */}
        <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white drop-shadow-md">Filter & Sort Reviews</h3>
              <p className="text-white/90 text-sm">
                {selectedRating === 'all' 
                  ? `Showing all ${displayedReviews.length} reviews` 
                  : `Showing ${displayedReviews.length} ${selectedRating}-star reviews`
                } • {timeSort === 'newest' ? 'Newest first' : 'Oldest first'}
              </p>
            </div>
            <div className="ml-auto">
              <Target className="h-5 w-5 text-yellow-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-6 bg-gradient-to-br from-gray-50 to-violet-50">
          <div className="space-y-6">
            {/* Rating Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded">
                  <StarRating 
                    rating={1} 
                    maxRating={1} 
                    size="xs" 
                    showValue={false} 
                    style="golden" 
                    className="scale-75"
                  />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Filter by Rating</h4>
              </div>
              <div className="space-y-2">
                {/* All Reviews Option */}
                <button
                  onClick={() => onRatingChange('all')}
                  disabled={isSorting}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    selectedRating === 'all'
                      ? 'bg-violet-50 border-2 border-violet-300 text-violet-700 shadow-md'
                      : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                  } ${isSorting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-sm font-medium">All Reviews</span>
                  <span className="text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white px-2 py-1 rounded">{allReviews.length}</span>
                </button>

                {/* Individual Star Ratings */}
                <div className="grid grid-cols-2 gap-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = allReviews.filter(review => Math.floor(review.overallRating || 0) === rating).length;
                    const percentage = allReviews.length > 0 ? Math.round((count / allReviews.length) * 100) : 0;
                    
                    return (
                      <button
                        key={rating}
                        onClick={() => onRatingChange(rating)}
                        disabled={isSorting || count === 0}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                          selectedRating === rating
                            ? 'bg-violet-50 border-2 border-violet-300 text-violet-700 shadow-md'
                            : count === 0
                            ? 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                        } ${isSorting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{rating}</span>
                          <StarRating 
                            rating={1} 
                            maxRating={1} 
                            size="xs" 
                            showValue={false} 
                            style="golden" 
                            className="scale-75"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold">{count}</span>
                          <span className="text-xs text-gray-500">({percentage}%)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Time Sort */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded">
                  <Clock className="h-3 w-3 text-white" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Sort by Time</h4>
              </div>
              <div className="relative">
                <button
                  onClick={onToggleSortDropdown}
                  disabled={isSorting}
                  className="w-full flex items-center justify-between p-3 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">
                      {timeSort === 'newest' ? 'Newest First' : 'Oldest First'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showSortDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => onTimeSortChange('newest')}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                        timeSort === 'newest' ? 'bg-violet-50 text-violet-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Newest First
                    </button>
                    <button
                      onClick={() => onTimeSortChange('oldest')}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${
                        timeSort === 'oldest' ? 'bg-violet-50 text-violet-600 font-medium' : 'text-gray-700'
                      }`}
                    >
                      Oldest First
                    </button>
                  </div>
                )}
              </div>

              {isSorting && (
                <div className="mt-3 flex items-center gap-2 text-violet-600 text-sm">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-violet-600 border-t-transparent"></div>
                  <Zap className="h-3 w-3" />
                  <span>Sorting...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;