import React from 'react';
import { MessageCircle } from 'lucide-react';
import EnhancedReviewFeedCard from '../../reviews/components/EnhancedReviewFeedCard';
import type { Review, Entity } from '../../../types';

interface ReviewSearchResultsProps {
  reviews: Review[];
  entities?: Entity[];
  query: string;
  hasMoreResults?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onClose?: () => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
}

const ReviewSearchResults: React.FC<ReviewSearchResultsProps> = ({
  reviews,
  entities = [],
  query,
  hasMoreResults = false,
  isLoadingMore = false,
  onLoadMore,
  onClose,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction
}) => {
  // Create entity lookup for quick access
  const entityLookup = entities.reduce((acc, entity) => {
    acc[entity.id] = entity;
    return acc;
  }, {} as Record<string, Entity>);
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mt-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-600">
            No reviews match "{query}". Try different keywords or browse recent reviews below.
          </p>
        </div>
      </div>
    );
  }

  // Remove duplicates and ensure unique reviews (same as homepage)
  const uniqueReviews = reviews.filter((review, index, self) => 
    index === self.findIndex(r => r.id === review.id)
  );

  return (
    <div className="w-full max-w-2xl py-8 h-full">
      <div className="space-y-6">
        {/* Search Results Header - With card background */}
        <div className="bg-white bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 outline outline-2 outline-yellow-500 shadow-lg rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results
              </h3>
              <p className="text-sm text-gray-600">
                Found {uniqueReviews.length} review{uniqueReviews.length !== 1 ? 's' : ''} for "{query}"
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-yellow-100 rounded-lg"
                title="Close search results"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Reviews Feed - Identical to homepage */}
        {uniqueReviews.map((review, index) => (
          <EnhancedReviewFeedCard
            key={`search-result-${review.id}-${index}`}
            review={review}
            entity={entityLookup[review.entityId || ''] || review.entity}
            onCommentAdd={onCommentAdd}
            onCommentDelete={onCommentDelete}
            onCommentReaction={onCommentReaction}
          />
        ))}
      
        {/* Load More Button - Identical to homepage */}
        {hasMoreResults && (
          <div className="flex justify-center pt-6">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                isLoadingMore
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {isLoadingMore ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Load More Reviews'
              )}
            </button>
          </div>
        )}
        
        {/* No more results message - Identical to homepage */}
        {!hasMoreResults && uniqueReviews.length > 0 && (
          <div className="text-center py-6 text-gray-500">
            <p>You've reached the end of all search results!</p>
          </div>
        )}
        
        {/* No reviews message - Identical to homepage */}
        {uniqueReviews.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Results Found</h3>
            <p className="text-gray-500">Try different keywords or browse recent reviews!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSearchResults;