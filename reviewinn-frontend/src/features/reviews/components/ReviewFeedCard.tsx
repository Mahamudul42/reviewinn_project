import React, { useRef, useState } from 'react';
import type { Review, Entity, Comment } from '../../../types';
import { useReviewCard } from '../hooks/useReviewCard';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';
import { userInteractionService } from '../../../api/services';
import { API_CONFIG, API_ENDPOINTS } from '../../../api/config';
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
  onViewCountUpdate?: (reviewId: string, newCount: number) => void; // NEW: Callback for view count updates
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
  onGiveReviewClick,
  onViewCountUpdate
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
    localReactions,
    localUserReaction,
    topReactions,
    totalReactions,
    optimisticError,
    viewCount,
    commentCount,
    // Handlers
    handleReactionChange,
    handleTitleClick,
    handleViewDetailsClick,
    handleCommentClick,
    handleGiveReviewClick,
    // Comment count management
    updateCommentCount,
    incrementCommentCount,
    decrementCommentCount,
    refreshCommentCount,
    // Reaction data management
    updateReactionData,
    // View count management
    updateViewCount
  } = useReviewCard({
    review,
    entity,
    onEntityClick,
    onReactionChange,
    onGiveReviewClick,
    onViewCountUpdate
  });

  // Handler for menu actions
  const handleMenuAction = async (action: string) => {
    switch (action) {
      case 'edit_review':
        setShowEditModal(true);
        break;
      case 'delete_review':
        setShowDeleteModal(true);
        break;
      case 'save':
        await handleSaveReview();
        break;
      case 'report':
        await handleReportReview();
        break;
      case 'interested':
        await handleMarkAsInterested();
        break;
      case 'not_interested':
        await handleMarkAsNotInterested();
        break;
      case 'notify':
        await handleToggleNotifications();
        break;
      case 'block':
        await handleBlockUser();
        break;
      case 'unfollow':
        await handleUnfollowEntity();
        break;
      default:
        console.log('Menu action:', action);
        break;
    }
  };

  // Save/bookmark review
  const handleSaveReview = async () => {
    try {
      const isCurrentlyBookmarked = userInteractionService.getUserInteraction(review.id)?.isBookmarked;
      userInteractionService.updateUserInteraction(review.id, {
        reviewId: review.id,
        isBookmarked: !isCurrentlyBookmarked
      });
      
      // Show feedback
      const message = !isCurrentlyBookmarked ? 'Review saved!' : 'Review unsaved!';
      // You can add a toast notification here if available
      console.log(message);
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  // Report review
  const handleReportReview = async () => {
    try {
      const reason = await showReportDialog();
      if (reason) {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.REVIEWS.REPORT(review.id)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ reason })
        });
        
        if (response.ok) {
          console.log('Review reported successfully');
          // You can add a toast notification here
        }
      }
    } catch (error) {
      console.error('Error reporting review:', error);
    }
  };

  // Mark as interested
  const handleMarkAsInterested = async () => {
    try {
      userInteractionService.updateUserInteraction(review.id, {
        reviewId: review.id,
        isHelpful: true
      });
      console.log('Marked as interested');
    } catch (error) {
      console.error('Error marking as interested:', error);
    }
  };

  // Mark as not interested
  const handleMarkAsNotInterested = async () => {
    try {
      userInteractionService.updateUserInteraction(review.id, {
        reviewId: review.id,
        isHelpful: false
      });
      console.log('Marked as not interested');
    } catch (error) {
      console.error('Error marking as not interested:', error);
    }
  };

  // Toggle notifications
  const handleToggleNotifications = async () => {
    try {
      // This would need a notifications service implementation
      console.log('Toggle notifications for review');
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  // Block user
  const handleBlockUser = async () => {
    try {
      if (confirm(`Are you sure you want to block ${review.reviewerName || 'this user'}?`)) {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CIRCLES.BLOCK_USER}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ userId: review.reviewerId })
        });
        
        if (response.ok) {
          console.log('User blocked successfully');
          setIsHidden(true); // Hide the review
        }
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  // Unfollow entity
  const handleUnfollowEntity = async () => {
    try {
      if (entity && confirm(`Are you sure you want to unfollow ${entity.name}?`)) {
        // This would need an entity follow service implementation
        console.log('Unfollowed entity');
      }
    } catch (error) {
      console.error('Error unfollowing entity:', error);
    }
  };

  // Show report dialog
  const showReportDialog = (): Promise<string | null> => {
    return new Promise((resolve) => {
      const reason = prompt(
        'Please select a reason for reporting this review:\n' +
        '1. Inappropriate content\n' +
        '2. Spam\n' +
        '3. Fake review\n' +
        '4. Harassment\n' +
        '5. Other\n\n' +
        'Enter the number (1-5) or describe the issue:'
      );
      
      if (reason) {
        const reasons = {
          '1': 'Inappropriate content',
          '2': 'Spam',
          '3': 'Fake review',
          '4': 'Harassment',
          '5': 'Other'
        };
        
        const mappedReason = reasons[reason as keyof typeof reasons] || reason;
        resolve(mappedReason);
      } else {
        resolve(null);
      }
    });
  };

  // Handler for successful review update
  const handleReviewUpdate = (updatedReview: Review) => {
    // You might want to refresh the review data or update the parent component
    // For now, just close the modal
    setShowEditModal(false);
    console.log('Review updated:', updatedReview);
  };

  // Handler for review update from detail modal (reaction changes)
  const handleReviewUpdateFromModal = (updatedReview: Review) => {
    // Update the useReviewCard hook's local state with the new reaction data
    // This will propagate the changes to the ReviewCardActions component
    console.log('Review reaction data updated from modal:', updatedReview);
    
    // Update the local reaction state immediately
    updateReactionData({
      reactions: updatedReview.reactions,
      user_reaction: updatedReview.user_reaction,
      top_reactions: updatedReview.top_reactions,
      total_reactions: updatedReview.total_reactions,
      reaction_count: updatedReview.reaction_count
    });
  };

  // Handler for successful review deletion
  const handleReviewDelete = () => {
    // Hide the component when review is deleted
    setIsHidden(true);
    setShowDeleteModal(false);
  };

  // Don't render if hidden
  if (isHidden) return null;

  // Create updated review object with latest counts for modal
  const updatedReview = {
    ...review,
    view_count: viewCount,
    comment_count: commentCount,
    reactions: localReactions,
    user_reaction: localUserReaction,
    top_reactions: topReactions,
    total_reactions: totalReactions
  };

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
        className="w-full bg-white rounded-lg shadow-sm border border-gray-200 relative overflow-hidden transition-all duration-300 group hover:shadow-md hover:border-gray-300"
        style={{ transform: 'translateZ(0)' }}
        data-review-id={review.id}
        data-review-card="true"
      >
        <div className="p-3 sm:p-4 space-y-3 min-w-0 w-full">
          {/* Header Row - Unified Design */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-3 flex items-center justify-between gap-2 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
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
            <div className="flex items-center gap-1 flex-shrink-0">
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
        review={updatedReview}
        entity={entity}
        onReviewUpdate={handleReviewUpdateFromModal}
        onCommentAdd={onCommentAdd}
        onCommentDelete={onCommentDelete}
        onCommentReaction={onCommentReaction}
        onCommentCountUpdate={updateCommentCount}
        onCommentCountIncrement={incrementCommentCount}
        onCommentCountDecrement={decrementCommentCount}
        onRefreshCommentCount={refreshCommentCount}
        onViewCountUpdate={updateViewCount}
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
