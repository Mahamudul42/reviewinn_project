import React from 'react';
import AddReviewStatusBar from '../../../features/common/components/AddReviewStatusBar';
import ReviewFeed from '../../../features/common/components/ReviewFeed';
import ReviewSearchResults from '../../../features/common/components/ReviewSearchResults';
import { PANEL_LIMITS } from '../config';
import { useSearchState } from '../hooks';
import PanelLoadingState from '../components/PanelLoadingState';
import type { Review, Entity } from '../../../types';

interface MiddlePanelPublicProps {
  userAvatar: string;
  userName: string;
  onAddReviewClick: () => void;
  reviewBarRef: React.RefObject<HTMLDivElement | null>;
  reviews: Review[];
  entities: Entity[];
  hasMoreReviews?: boolean;
  loadingMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  onGiveReviewClick?: (entity: Entity) => void;
  onViewCountUpdate?: (reviewId: string, newCount: number) => void;
}

/**
 * Public version of the middle panel
 * Shows limited content with gating for unauthenticated users
 */
const MiddlePanelPublic: React.FC<MiddlePanelPublicProps> = ({ 
  userAvatar, 
  userName, 
  onAddReviewClick, 
  reviewBarRef, 
  reviews, 
  entities,
  hasMoreReviews = false,
  loadingMore = false,
  loading = false,
  onLoadMore,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  onGiveReviewClick,
  onViewCountUpdate,
}) => {
  const {
    searchResults,
    searchEntities,
    searchQuery,
    showingSearchResults,
    searchHasMore,
    searchLoadingMore,
    handleSearchResults,
    handleCloseSearch,
    handleLoadMoreSearchResults,
  } = useSearchState();

  if (loading) {
    return (
      <div className="w-full max-w-2xl py-8" style={{ minHeight: '100%' }}>
        <PanelLoadingState
          title="Review Feed"
          subtitle="Loading latest reviews..."
          cardCount={6}
          className=""
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl py-8" style={{ minHeight: '100%' }}>
      <div className="space-y-6">
        <AddReviewStatusBar 
          userAvatar={userAvatar} 
          userName={userName} 
          onClick={onAddReviewClick} 
          barRef={reviewBarRef}
          onSearchResults={handleSearchResults}
        />
        
        {showingSearchResults ? (
          <ReviewSearchResults 
            reviews={searchResults}
            entities={searchEntities}
            query={searchQuery}
            hasMoreResults={searchHasMore}
            isLoadingMore={searchLoadingMore}
            onLoadMore={handleLoadMoreSearchResults}
            onClose={handleCloseSearch}
            onCommentAdd={onCommentAdd}
            onCommentDelete={onCommentDelete}
            onCommentReaction={onCommentReaction}
          />
        ) : (
          <div className="relative">
            <ReviewFeed 
              reviews={reviews} 
              entities={entities}
              hasMoreReviews={hasMoreReviews}
              loadingMore={loadingMore}
              onLoadMore={onLoadMore}
              onCommentAdd={onCommentAdd}
              onCommentDelete={onCommentDelete}
              onCommentReaction={onCommentReaction}
              onGiveReviewClick={onGiveReviewClick}
              onViewCountUpdate={onViewCountUpdate}
              publicReviewsLimit={PANEL_LIMITS.PUBLIC_REVIEWS}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MiddlePanelPublic;