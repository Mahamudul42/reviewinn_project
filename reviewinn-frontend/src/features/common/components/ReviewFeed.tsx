import React from 'react';
import ReviewFeedCard from '../../reviews/components/ReviewFeedCard';
import AdaptiveGatedContent from '../../../shared/components/AdaptiveGatedContent';
import FloatingAuthPrompt from '../../../shared/components/FloatingAuthPrompt';
import GatingErrorBoundary from '../../../shared/components/GatingErrorBoundary';
import LoadingStateManager from '../../../shared/components/LoadingStateManager';
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
  loading?: boolean;
  error?: string | Error | null;
  onLoadMore?: () => void;
  onReactionChange?: (reviewId: string, reaction: string | null) => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  onGiveReviewClick?: (entity: Entity) => void;
  onViewCountUpdate?: (reviewId: string, newCount: number) => void;
  publicReviewsLimit?: number;
  onAuthRequired?: () => void;
  onRetry?: () => void;
}

const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 outline outline-2 outline-yellow-500";
const reviewCardStyle = `${cardBg} shadow-lg rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 transform`;

const ReviewFeed: React.FC<ReviewFeedProps> = ({ 
  reviews, 
  entities, 
  hasMoreReviews = false, 
  loadingMore = false, 
  loading = false,
  error = null,
  onLoadMore,
  onReactionChange,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  onGiveReviewClick,
  onViewCountUpdate,
  publicReviewsLimit = getPublicLimit('reviews'),
  onAuthRequired,
  onRetry
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

  // Use LoadingStateManager for better loading and error handling
  return (
    <GatingErrorBoundary>
      <LoadingStateManager
        loading={loading || isLoading}
        error={error}
        isEmpty={uniqueReviews.length === 0 && !loading && !isLoading}
        skeletonType="review"
        skeletonCount={6}
        loadingText="Loading reviews..."
        emptyTitle="No reviews found"
        emptyMessage="Be the first to share your experience! Add a review to get the conversation started."
        emptyAction={
          <button
            onClick={() => onAuthRequired?.()}
            className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Write a Review
          </button>
        }
        onRetry={onRetry}
        className="min-h-[400px]"
      >
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
          </div>
        </AdaptiveGatedContent>

        {/* Floating Auth Prompt */}
        <FloatingAuthPrompt
          itemsViewed={visibleReviews.length}
          totalItems={uniqueReviews.length}
          limit={publicReviewsLimit}
          onAuthSuccess={handleAuthSuccess}
        />
      </LoadingStateManager>
    </GatingErrorBoundary>
  );
};

export default ReviewFeed; 