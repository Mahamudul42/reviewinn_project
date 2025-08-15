import React, { useState } from 'react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';

// Center Content (Home)
import { useHomeData } from './hooks/useHomeData';
import { useReviewManagement } from './hooks/useReviewManagement';
import { MiddlePanelPublic, MiddlePanelAuth } from '../../shared/panels/MiddlePanel';
import type { Entity } from '../../types';

// Modal Components
import AddReviewModal from '../reviews/components/AddReviewModal';
import type { ReviewFormData } from '../../types';

const HomePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Data hooks - using the enhanced home data hook
  const {
    reviews,
    loading: centerLoading,
    error: centerError,
    hasMoreReviews,
    loadingMore,
    handleLoadMore,
    updateViewCount
  } = useHomeData();

  // Review management hooks
  const {
    reviewBarRef,
    handleReviewSubmit,
    handleReactionChange,
    handleCommentAdd: reviewHandleCommentAdd,
    handleCommentDelete: reviewHandleCommentDelete,
    handleCommentReaction: reviewHandleCommentReaction,
  } = useReviewManagement();

  // Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [preselectedEntity, setPreselectedEntity] = useState<Entity | null>(null);

  // Modal handlers
  const handleShowReviewModal = () => {
    // Don't do anything if auth is still loading
    if (authLoading) {
      return;
    }
    
    // Check if user is authenticated before showing review modal
    if (!isAuthenticated || !user) {
      // Trigger auth modal instead
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setPreselectedEntity(null);
  };

  const handleGiveReviewClick = (entity: Entity) => {
    if (!isAuthenticated || !user) {
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    setPreselectedEntity(entity);
    setShowReviewModal(true);
  };

  // Comment handlers - use the review management ones
  const handleCommentAdd = reviewHandleCommentAdd;
  const handleCommentDelete = reviewHandleCommentDelete;
  const handleCommentReaction = reviewHandleCommentReaction;

  // Review submission handler
  const handleModalReviewSubmit = async (entity: Entity, reviewData: ReviewFormData) => {
    try {
      const result = await handleReviewSubmit(entity, reviewData);
      if (result.success) {
        handleCloseReviewModal();
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to submit review' };
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const displayUser = user || {
    name: 'Guest',
    avatar: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=ffffff'
  };

  return (
    <ThreePanelLayout 
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Insights & New Entities"
    >
      {centerError ? (
        <div style={{ textAlign: 'center', padding: '32px', background: 'white', borderRadius: '16px' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>😔</div>
          <p style={{ color: '#6b7280' }}>Unable to load home content: {centerError}</p>
        </div>
      ) : (
        <div>
          {isAuthenticated ? (
            <MiddlePanelAuth
              userAvatar={displayUser.avatar || ''}
              userName={displayUser.name || 'Guest'}
              onAddReviewClick={handleShowReviewModal}
              reviewBarRef={reviewBarRef}
              reviews={reviews}
              entities={[]} // TODO: Get entities from reviews or fetch separately
              hasMoreReviews={hasMoreReviews}
              loadingMore={loadingMore}
              loading={centerLoading}
              onLoadMore={handleLoadMore}
              onReactionChange={handleReactionChange}
              onCommentAdd={handleCommentAdd}
              onCommentDelete={handleCommentDelete}
              onCommentReaction={handleCommentReaction}
              onGiveReviewClick={handleGiveReviewClick}
              onViewCountUpdate={updateViewCount}
            />
          ) : (
            <MiddlePanelPublic
              userAvatar={displayUser.avatar || ''}
              userName={displayUser.name || 'Guest'}
              onAddReviewClick={handleShowReviewModal}
              reviewBarRef={reviewBarRef}
              reviews={reviews}
              entities={[]} // TODO: Get entities from reviews or fetch separately
              hasMoreReviews={hasMoreReviews}
              loadingMore={loadingMore}
              loading={centerLoading}
              onLoadMore={handleLoadMore}
              onReactionChange={handleReactionChange}
              onCommentAdd={handleCommentAdd}
              onCommentDelete={handleCommentDelete}
              onCommentReaction={handleCommentReaction}
              onGiveReviewClick={handleGiveReviewClick}
              onViewCountUpdate={updateViewCount}
            />
          )}
        </div>
      )}

      {/* Write Review Modal */}
      <AddReviewModal
        open={showReviewModal}
        onClose={handleCloseReviewModal}
        onReviewSubmit={handleModalReviewSubmit}
        userName={displayUser.name || 'Guest'}
        userAvatar={displayUser.avatar || 'https://ui-avatars.com/api/?name=Guest&background=gray&color=ffffff'}
        preselectedEntity={preselectedEntity || undefined}
      />
    </ThreePanelLayout>
  );
};

export default HomePage;