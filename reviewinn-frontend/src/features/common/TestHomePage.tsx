import React, { memo, useMemo } from 'react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import { MiddlePanelPublic } from '../../shared/panels/MiddlePanel';
import { MiddlePanelAuth } from '../../shared/panels/MiddlePanel';
import { useTestHomeData } from './hooks/useTestHomeData';
import HomepageHeader from './components/HomepageHeader';
import HomepageErrorBoundary from './components/HomepageErrorBoundary';

const TestHomePage: React.FC = () => {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const {
    reviews,
    loading,
    error,
    hasMoreReviews,
    loadingMore,
    handleLoadMore
  } = useTestHomeData();

  // Memoized user display data
  const displayUser = useMemo(() => {
    return currentUser || {
      name: 'Guest',
      avatar: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=ffffff'
    };
  }, [currentUser]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleCommentAdd = useMemo(() => 
    async (reviewId: string, content: string, parentId?: string) => {
      console.log('Comment add not implemented in test page:', reviewId, content, parentId);
    }, []
  );

  const handleCommentDelete = useMemo(() => 
    async (reviewId: string, commentId: string) => {
      console.log('Comment delete not implemented in test page:', reviewId, commentId);
    }, []
  );

  const handleCommentReaction = useMemo(() => 
    async (reviewId: string, commentId: string, reaction: string | null) => {
      console.log('Comment reaction not implemented in test page:', reviewId, commentId, reaction);
    }, []
  );

  const handleAddReviewClick = useMemo(() => 
    () => {
      console.log('Add review modal would open here');
    }, []
  );



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Loading test home data..." />
        </div>
      </div>
    );
  }

  if (error) {
    throw new Error(error);
  }

  return (
    <HomepageErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <HomepageHeader reviewCount={reviews.length} />

        {/* Main content area - Fully responsive */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-7xl">
          <div className="flex justify-center w-full">
            {/* Responsive width container */}
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
              {isAuthenticated ? (
                <MiddlePanelAuth
                  userAvatar={displayUser.avatar || ''}
                  userName={displayUser.name || 'Guest'}
                  onAddReviewClick={handleAddReviewClick}
                  reviewBarRef={React.createRef()}
                  reviews={reviews}
                  entities={[]} // No entities for test page
                  hasMoreReviews={hasMoreReviews}
                  loadingMore={loadingMore}
                  loading={false}
                  onLoadMore={handleLoadMore}
                  onCommentAdd={handleCommentAdd}
                  onCommentDelete={handleCommentDelete}
                  onCommentReaction={handleCommentReaction}
                  onGiveReviewClick={() => console.log('Give review would open here')}
                />
              ) : (
                <MiddlePanelPublic
                  userAvatar={displayUser.avatar || ''}
                  userName={displayUser.name || 'Guest'}
                  onAddReviewClick={handleAddReviewClick}
                  reviewBarRef={React.createRef()}
                  reviews={reviews}
                  entities={[]} // No entities for test page
                  hasMoreReviews={hasMoreReviews}
                  loadingMore={loadingMore}
                  loading={false}
                  onLoadMore={handleLoadMore}
                  onCommentAdd={handleCommentAdd}
                  onCommentDelete={handleCommentDelete}
                  onCommentReaction={handleCommentReaction}
                  onGiveReviewClick={() => console.log('Give review would open here')}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </HomepageErrorBoundary>
  );
};

export default memo(TestHomePage);