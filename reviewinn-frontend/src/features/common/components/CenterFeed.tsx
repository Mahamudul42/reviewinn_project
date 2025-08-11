import React, { useState } from 'react';
import AddReviewStatusBar from './AddReviewStatusBar';
import ReviewFeed from './ReviewFeed';
import ReviewSearchResults from './ReviewSearchResults';
import type { Review, Entity } from '../../../types';

interface CenterFeedProps {
  userAvatar: string;
  userName: string;
  onAddReviewClick: () => void;
  reviewBarRef: React.RefObject<HTMLDivElement | null>;
  reviews: Review[];
  entities: Entity[];
  hasMoreReviews?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  onGiveReviewClick?: (entity: Entity) => void;
  publicReviewsLimit?: number;
}

const CenterFeed: React.FC<CenterFeedProps> = ({ 
  userAvatar, 
  userName, 
  onAddReviewClick, 
  reviewBarRef, 
  reviews, 
  entities,
  hasMoreReviews = false,
  loadingMore = false,
  onLoadMore,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  onGiveReviewClick,
  publicReviewsLimit = 15
}) => {
  const [searchResults, setSearchResults] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showingSearchResults, setShowingSearchResults] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);

  const handleSearchResults = (results: Review[], searchEntities: any[], query: string, hasMore = false) => {
    setSearchResults(results);
    setSearchQuery(query);
    setSearchHasMore(hasMore);
    setSearchPage(1); // Reset page when new search
    setShowingSearchResults(results.length > 0 || query.length > 0);
  };

  const handleCloseSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setShowingSearchResults(false);
    setSearchHasMore(false);
    setSearchLoadingMore(false);
    setSearchPage(1);
  };

  const handleLoadMoreSearchResults = async () => {
    // This would need to be implemented in the search service for pagination
    setSearchLoadingMore(true);
    // Simulate load more - in real implementation, you'd call search service with next page
    setTimeout(() => {
      setSearchLoadingMore(false);
      // For now, just disable hasMore after first load more
      setSearchHasMore(false);
    }, 1000);
  };

  return (
    <div className="w-full max-w-2xl py-8 h-full">
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
            entities={entities}
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
          <div className="relative px-8">
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
              publicReviewsLimit={publicReviewsLimit}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CenterFeed; 