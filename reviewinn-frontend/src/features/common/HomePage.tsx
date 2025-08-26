import React, { useState } from 'react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';

// Center Content (Home)
import { useHomeData } from './hooks/useHomeData';
import { useReviewManagement } from './hooks/useReviewManagement';
import ReviewFeed from './components/ReviewFeed';
import AddReviewStatusBar from './components/AddReviewStatusBar';
import ReviewSearchResults from './components/ReviewSearchResults';
import type { Entity, Review } from '../../types';

// Modal Components
import AddReviewModal from '../reviews/components/AddReviewModal';
import type { ReviewFormData } from '../../types';

const HomePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Debug authentication state
  console.log('🏠 HomePage auth state:', {
    isAuthenticated,
    hasUser: !!user,
    userId: user?.id,
    authLoading,
    userName: user?.name
  });
  
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

  // Search state
  const [searchMode, setSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Review[]>([]);
  const [searchEntities, setSearchEntities] = useState<Entity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);

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

  // Search handlers
  const handleSearchResults = (results: Review[], entities: Entity[], query: string, hasMore?: boolean) => {
    setSearchResults(results);
    setSearchEntities(entities);
    setSearchQuery(query);
    setHasMoreSearchResults(hasMore || false);
    setSearchMode(results.length > 0 || query.length > 0);
  };

  const handleCloseSearch = () => {
    setSearchMode(false);
    setSearchResults([]);
    setSearchEntities([]);
    setSearchQuery('');
    setHasMoreSearchResults(false);
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
        <div className="space-y-6">
          {/* Add Review Status Bar with Search */}
          <AddReviewStatusBar
            userAvatar={displayUser.avatar || 'https://ui-avatars.com/api/?name=Guest&background=gray&color=ffffff'}
            userName={displayUser.name || 'Guest'}
            onClick={handleShowReviewModal}
            onSearchResults={handleSearchResults}
          />

          {/* Show search results or normal feed */}
          {searchMode ? (
            <ReviewSearchResults
              reviews={searchResults}
              entities={searchEntities}
              query={searchQuery}
              hasMoreResults={hasMoreSearchResults}
              onClose={handleCloseSearch}
              onCommentAdd={handleCommentAdd}
              onCommentDelete={handleCommentDelete}
              onCommentReaction={handleCommentReaction}
            />
          ) : (
            <ReviewFeed
              reviews={reviews}
              entities={reviews.map(r => r.entity).filter(Boolean) as Entity[]}
              hasMoreReviews={hasMoreReviews}
              loadingMore={loadingMore}
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