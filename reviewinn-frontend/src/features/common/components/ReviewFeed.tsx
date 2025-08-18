import React from 'react';
import ReviewFeedCard from '../../reviews/components/ReviewFeedCard';
import AdaptiveGatedContent from '../../../shared/components/AdaptiveGatedContent';
import FloatingAuthPrompt from '../../../shared/components/FloatingAuthPrompt';
import GatingErrorBoundary from '../../../shared/components/GatingErrorBoundary';
import { useReviewGating } from '../../../shared/hooks/useGatedContent';
import { GATING_CONFIG, getGateMessage, getPublicLimit } from '../../../config/gating';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
// Use Vite environment variables directly
const isDevelopment = import.meta.env.DEV;
import type { Review, Entity } from '../../../types';

interface ReviewFeedProps {
  reviews?: Review[];
  entities?: Entity[];
  hasMoreReviews?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onReactionChange?: (reviewId: string, reaction: string | null) => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  onGiveReviewClick?: (entity: Entity) => void;
  onViewCountUpdate?: (reviewId: string, newCount: number) => void;
  publicReviewsLimit?: number;
  onAuthRequired?: () => void;
}

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 outline outline-2 outline-yellow-500";
const reviewCardStyle = `${cardBg} shadow-lg rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 transform`;

const ReviewFeed: React.FC<ReviewFeedProps> = ({ 
  reviews, 
  entities, 
  hasMoreReviews = false, 
  loadingMore = false, 
  onLoadMore,
  onReactionChange,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  onGiveReviewClick,
  onViewCountUpdate,
  publicReviewsLimit = getPublicLimit('reviews'),
  onAuthRequired
}) => {
  // Remove duplicates and ensure unique reviews - handle undefined reviews
  const uniqueReviews = (reviews || []).filter((review, index, self) => 
    index === self.findIndex(r => r.id === review.id)
  );

  // Get authentication status from proper hook
  const { isAuthenticated, isLoading } = useUnifiedAuth();
  
  // Use gating logic
  const {
    visibleItems: visibleReviews,
    isGated,
    gatedItemsCount,
    shouldShowGate,
    canAccess,
    requiresAuth
  } = useReviewGating(uniqueReviews, isAuthenticated, publicReviewsLimit);

  // Handle authentication success
  const handleAuthSuccess = () => {
    // Refresh the page or trigger a data reload
    window.location.reload();
  };

  // Debug logging - only in development
  if (isDevelopment) {
    console.log('🔍 ReviewFeed Debug:', {
      isAuthenticated,
      isLoading,
      uniqueReviewsLength: uniqueReviews.length,
      visibleReviewsLength: visibleReviews.length,
      publicReviewsLimit,
      shouldShowGate,
      isGated,
      gatedItemsCount
    });
  }

  // Show loading state while auth is initializing to prevent flashing
  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <GatingErrorBoundary>
      <AdaptiveGatedContent
        totalItems={uniqueReviews.length}
        preferredLimit={publicReviewsLimit}
        onAuthSuccess={handleAuthSuccess}
        gateMessage={getGateMessage('reviews')}
      >
        <div className="space-y-6">
          {visibleReviews.map((review, index) => (
            <ReviewFeedCard
              key={`review-${review.id}-${index}`}
              review={review}
              entity={review.entity || (entities || []).find(e => e.id === review.entityId)}
              onReactionChange={onReactionChange}
              onCommentAdd={onCommentAdd}
              onCommentDelete={onCommentDelete}
              onCommentReaction={onCommentReaction}
              onGiveReviewClick={onGiveReviewClick}
              onViewCountUpdate={onViewCountUpdate}
            />
          ))}
        
          {/* Load More Button - Only show if authenticated or within limit */}
          {hasMoreReviews && isAuthenticated && (
            <div className="flex justify-center pt-6">
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  loadingMore
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {loadingMore ? (
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
          
          {/* No more reviews message - Only for authenticated users */}
          {!hasMoreReviews && isAuthenticated && uniqueReviews.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              <p>You've reached the end of all reviews!</p>
            </div>
          )}
          
          {/* No reviews message */}
          {uniqueReviews.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500">Be the first to write a review!</p>
            </div>
          )}
        </div>
      </AdaptiveGatedContent>

      {/* Floating Auth Prompt */}
      <FloatingAuthPrompt
        itemsViewed={visibleReviews.length}
        totalItems={uniqueReviews.length}
        limit={publicReviewsLimit}
        onAuthSuccess={handleAuthSuccess}
      />
    </GatingErrorBoundary>
  );
};

export default ReviewFeed; 