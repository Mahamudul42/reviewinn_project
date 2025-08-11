import React from 'react';
import { MessageCircle, Zap, Star, TrendingUp } from 'lucide-react';
import EnhancedReviewFeedCard from '../../reviews/components/EnhancedReviewFeedCard';
import type { Review } from '../../../types';

interface ReviewsListProps {
  reviews: Review[];
  selectedRating: number | 'all';
  isSorting: boolean;
  className?: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  selectedRating,
  isSorting,
  className = ''
}) => {
  if (reviews.length === 0) {
    return (
      <div className={`w-full max-w-2xl mx-auto ${className}`}>
        <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
          {/* Empty State Header */}
          <div className="bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-md">
                  {selectedRating === 'all' ? 'No Reviews Yet' : `No ${selectedRating}-Star Reviews`}
                </h2>
                <p className="text-white/90 text-sm">Be the first to share your experience!</p>
              </div>
            </div>
          </div>
          
          {/* Empty State Content */}
          <div className="p-8 bg-gradient-to-br from-gray-50 to-slate-50 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">
              {selectedRating === 'all' 
                ? 'Be the first to write a review!' 
                : `Try selecting a different rating or view all reviews.`
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Reviews Header */}
      <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-md">
                  Reviews ({reviews.length})
                </h2>
                <p className="text-white/90 text-sm">Community feedback and experiences</p>
              </div>
            </div>
            {isSorting && (
              <div className="flex items-center gap-2 text-white">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Sorting...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review: Review, index: number) => (
          <div key={`${review.id}-${index}`} className="relative">
            {/* Review Card Enhancement */}
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 to-purple-500/20 rounded-xl blur opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <EnhancedReviewFeedCard
                review={review}
                hideEntityInfo={true}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer Stats */}
      <div className="mt-8 bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
          <div className="flex items-center justify-center gap-3">
            <TrendingUp className="h-5 w-5 text-white" />
            <span className="text-white font-bold">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'} Loaded
            </span>
            <span className="text-xl">⭐</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsList;