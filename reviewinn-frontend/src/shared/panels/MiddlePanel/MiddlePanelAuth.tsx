import React from 'react';
import AddReviewStatusBar from '../../../features/common/components/AddReviewStatusBar';
import ReviewFeed from '../../../features/common/components/ReviewFeed';
import ReviewSearchResults from '../../../features/common/components/ReviewSearchResults';
import { useSearchState } from '../hooks';
import PanelLoadingState from '../components/PanelLoadingState';
import type { Review, Entity } from '../../../types';

interface MiddlePanelAuthProps {
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
  onReactionChange?: (reviewId: string, reaction: string | null) => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  onGiveReviewClick?: (entity: Entity) => void;
  onViewCountUpdate?: (reviewId: string, newCount: number) => void;
}

/**
 * Authenticated version of the middle panel
 * Shows unlimited content and full functionality for authenticated users
 */
const MiddlePanelAuth: React.FC<MiddlePanelAuthProps> = ({ 
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
  onReactionChange,
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
          title="Your Feed"
          subtitle="Loading personalized reviews..."
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
              onReactionChange={onReactionChange}
              onCommentAdd={onCommentAdd}
              onCommentDelete={onCommentDelete}
              onCommentReaction={onCommentReaction}
              onGiveReviewClick={onGiveReviewClick}
              onViewCountUpdate={onViewCountUpdate}
              publicReviewsLimit={undefined} // No limit for authenticated users
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MiddlePanelAuth;