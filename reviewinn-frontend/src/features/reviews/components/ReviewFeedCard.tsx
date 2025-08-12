import React, { useRef, useState } from 'react';
import type { Review, Entity, Comment } from '../../../types';
import { useReviewCard } from '../hooks/useReviewCard';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';
import ReviewCardUserInfo from './ReviewCardUserInfo';
import ReviewCardEntityInfo from './ReviewCardEntityInfo';
import ReviewCardUnifiedContent from './ReviewCardUnifiedContent';
import ReviewCardActions from './ReviewCardActions';
import ReviewCardSubRatings from '../../../shared/molecules/ReviewCardSubRatings';
import ReviewCardMenu from './ReviewCardMenu';
import AuthModal from '../../auth/components/AuthModal';
import ReviewDetailModal from './ReviewDetailModal';
import ReviewEditModal from './ReviewEditModal';
import ReviewDeleteModal from './ReviewDeleteModal';

interface ReviewFeedCardProps {
  review: Review & {
    reactions?: Record<string, number>;
    user_reaction?: string;
    comments?: Comment[];
  };
  entity?: Entity;
  hideEntityInfo?: boolean;
  onEntityClick?: (entityId: string) => void;
  onReactionChange?: (reviewId: string, reaction: string | null) => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  showFullContent?: boolean;
  isShareable?: boolean;
  onGiveReviewClick?: (entity: Entity) => void; // NEW: Callback for give review button
}

const ReviewFeedCard: React.FC<ReviewFeedCardProps> = ({ 
  review, 
  entity,
  hideEntityInfo = false,
  onEntityClick,
  onReactionChange,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  showFullContent = false,
  isShareable = false,
  onGiveReviewClick
}) => {
  const menuButtonRef = useRef<HTMLButtonElement>(null!);
  
  // Local state for edit/delete modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Use the custom hook for all state management
  const {
    // State
    isHidden,
    setIsHidden,
    menuOpen,
    setMenuOpen,
    showAuthModal,
    setShowAuthModal,
    showReviewDetailModal,
    setShowReviewDetailModal,
    isAuthenticated,
    localReactions,
    localUserReaction,
    topReactions,
    totalReactions,
    optimisticError,
    viewCount,
    commentCount,
    // Handlers
    handleEntityClick,
    handleReactionChange,
    handleTitleClick,
    handleViewDetailsClick,
    handleCommentClick,
    handleGiveReviewClick,
    // Comment count management
    updateCommentCount,
    incrementCommentCount,
    decrementCommentCount,
    refreshCommentCount
  } = useReviewCard({
    review,
    entity,
    onEntityClick,
    onReactionChange,
    onGiveReviewClick
  });

  // Handler for menu actions
  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'edit_review':
        setShowEditModal(true);
        break;
      case 'delete_review':
        setShowDeleteModal(true);
        break;
      default:
        console.log('Menu action:', action);
        break;
    }
  };

  // Handler for successful review update
  const handleReviewUpdate = (updatedReview: Review) => {
    // You might want to refresh the review data or update the parent component
    // For now, just close the modal
    setShowEditModal(false);
    console.log('Review updated:', updatedReview);
  };

  // Handler for successful review deletion
  const handleReviewDelete = () => {
    // Hide the component when review is deleted
    setIsHidden(true);
    setShowDeleteModal(false);
  };

  // Don't render if hidden
  if (isHidden) return null;

  // Get highlights for sub-ratings
  const highlights: string[] = Array.isArray(review.pros) && review.pros.length > 0 
    ? review.pros 
    : ['Participation matters', 'Inspirational', 'Group projects'];

  // Map backend topReactions (array of strings) to expected frontend format for ReviewCardActions
  const mappedTopReactions = Array.isArray(topReactions)
    ? topReactions.map(type => ({
        type,
        count: localReactions?.[type] || 0
      }))
    : [];

  return (
    <>
      <div 
        className="w-full bg-white rounded-lg shadow-sm border border-gray-200 relative overflow-visible transition-all duration-300 group hover:shadow-md hover:border-gray-300"
        style={{ transform: 'translateZ(0)' }}
        data-review-id={review.id}
        data-review-card="true"
      >
        <div className="p-4 space-y-3">
          {/* Header Row - Unified Design */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-4">
              {/* User Info */}
              <ReviewCardUserInfo
                reviewerName={review.reviewerName || 'Anonymous'}
                reviewerAvatar={review.reviewerAvatar}
                reviewerId={review.reviewerId}
                reviewerUsername={review.reviewerUsername}
              />
              
              {/* Date */}
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-gray-500">
                  {review.createdAt ? formatTimeAgo(new Date(review.createdAt)) : ''}
                </span>
              </div>
            </div>

            {/* Action Buttons - Cohesive Design */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetailsClick();
                }}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow"
                title="Click to view full review details"
              >
                📖 View Details
              </button>
              
              <button 
                ref={menuButtonRef} 
                className="w-7 h-7 text-gray-500 hover:text-gray-700 hover:bg-white flex items-center justify-center transition-all duration-200 border border-transparent hover:border-gray-200 rounded-md" 
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                title="More options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
              
              <button 
                className="w-7 h-7 text-gray-500 hover:text-red-500 hover:bg-white flex items-center justify-center transition-all duration-200 border border-transparent hover:border-gray-200 rounded-md" 
                title="Hide review" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHidden(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Entity Info Card */}
          {!hideEntityInfo && (
            <ReviewCardEntityInfo
              review={review}
              entity={entity}
            />
          )}

          {/* Unified Review Content */}
          <ReviewCardUnifiedContent
            review={review}
            onTitleClick={handleTitleClick}
          />

          {/* Sub-ratings */}
          <ReviewCardSubRatings 
            subRatings={review.ratings || review.criteria || {}} 
            pros={review.pros}
            cons={review.cons}
          />

          {/* Actions */}
          <ReviewCardActions
            reactions={localReactions}
            userReaction={localUserReaction}
            onReactionChange={handleReactionChange}
            commentCount={commentCount}
            views={viewCount || 0}
            topReactions={mappedTopReactions}
            totalReactions={totalReactions}
            onCommentClick={handleCommentClick}
            onGiveReviewClick={handleGiveReviewClick}
            showAuthModal={showAuthModal}
            setShowAuthModal={setShowAuthModal}
            isAuthenticated={isAuthenticated}
            reviewId={review.id}
            reviewTitle={review.title}
            entityName={entity?.name}
            review={review}
            entity={entity}
          />
          
          {/* Error Display */}
          {optimisticError && (
            <div className="text-xs text-red-500 mt-1">{optimisticError}</div>
          )}
        </div>

        {/* Menu Component */}
        <ReviewCardMenu 
          open={menuOpen} 
          onClose={() => setMenuOpen(false)} 
          onAction={handleMenuAction}
          menuButtonRef={menuButtonRef}
          review={review}
        />
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <ReviewDetailModal 
        open={showReviewDetailModal} 
        onClose={() => setShowReviewDetailModal(false)} 
        review={review}
        entity={entity}
        onCommentAdd={onCommentAdd}
        onCommentDelete={onCommentDelete}
        onCommentReaction={onCommentReaction}
        onCommentCountUpdate={updateCommentCount}
        onCommentCountIncrement={incrementCommentCount}
        onCommentCountDecrement={decrementCommentCount}
        onRefreshCommentCount={refreshCommentCount}
      />

      {/* Edit Review Modal */}
      <ReviewEditModal
        review={review}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleReviewUpdate}
      />

      {/* Delete Review Modal */}
      <ReviewDeleteModal
        review={review}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleReviewDelete}
      />
    </>
  );
};

export default ReviewFeedCard;
