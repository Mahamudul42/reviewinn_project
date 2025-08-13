import React, { Suspense, lazy, useState } from 'react';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { useOptimizedEntityDetail } from '../../hooks/useOptimizedEntityDetail';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

// Import optimized components
import EntityErrorBoundary from './components/EntityErrorBoundary';
import EntityPageSkeleton from './components/EntityPageSkeleton';
import AddReviewModal from '../reviews/components/AddReviewModal';

// Lazy load heavy components for better performance
const EntityListCard = lazy(() => import('../../shared/components/EntityListCard'));
const EntityDescription = lazy(() => import('./components/EntityDescription'));
const EntityRolesSection = lazy(() => import('./components/EntityRolesSection'));
const EntityActions = lazy(() => import('./components/EntityActions'));
const EntityManagementActions = lazy(() => import('./components/EntityManagementActions'));
const FilterControls = lazy(() => import('./components/FilterControls'));
const LazyReviewsList = lazy(() => import('./components/LazyReviewsList'));
const RatingBreakdown = lazy(() => import('./components/RatingBreakdown').then(module => ({ default: module.RatingBreakdown })));

const EntityDetailPage: React.FC = () => {
  // Get current user using centralized auth
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Use the optimized hook with caching and performance improvements
  const {
    entity,
    allReviews,
    displayedReviews,
    isLoading,
    error,
    selectedRating,
    timeSort,
    isSorting,
    showSortDropdown,
    hasReviews,
    totalReviews,
    averageRating,
    filteredReviewsCount,
    isEntityNotFound,
    canWriteReview,
    isInitialLoad,
    isFromCache,
    handleRatingChange,
    handleTimeSortChange,
    handleToggleSortDropdown,
    refreshEntity,
    clearError,
    navigate,
  } = useOptimizedEntityDetail({
    enableViewTracking: true,
    enablePrefetch: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes cache
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleOpenReviewModal = () => {
    if (!currentUser) {
      window.location.href = '/login';
      return;
    }
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
  };

  const handleSubmitReview = async (entity: any, reviewData: any) => {
    console.log('Submitting review for:', entity.name, reviewData);
    
    // Check authentication first
    if (!currentUser || !isAuthenticated) {
      console.log('User not authenticated, opening auth modal');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }

    try {
      // Import review service dynamically to avoid circular imports
      const { reviewService } = await import('../../api/services');
      
      // Add entity ID to review data
      const completeReviewData = {
        ...reviewData,
        entityId: entity.id || entity.entity_id
      };
      
      console.log('Submitting review with data:', completeReviewData);
      
      // Submit the review
      const newReview = await reviewService.createReview(completeReviewData);
      console.log('Review submitted successfully:', newReview);
      
      // Refresh entity to show new review
      refreshEntity();
      
      // Close modal
      handleCloseReviewModal();
      
      // Emit event to update user profile with new review
      const eventDetail = { 
        review: newReview,
        userId: currentUser.id,
        timestamp: Date.now(),
        source: 'EntityDetailPage'
      };
      
      console.log('🔥 EntityDetailPage: Emitting reviewCreated event for profile update:', {
        reviewId: newReview.id,
        reviewTitle: newReview.title,
        userId: currentUser.id,
        userIdType: typeof currentUser.id
      });
      
      window.dispatchEvent(new CustomEvent('reviewCreated', { detail: eventDetail }));
      
      // Show success message
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          type: 'success',
          title: 'Review Submitted',
          message: 'Your review has been posted successfully!'
        }
      }));
      
    } catch (error) {
      console.error('Failed to submit review:', error);
      
      // Check if it's an auth error
      if (error?.status === 401 || error?.message?.includes('401')) {
        console.log('Authentication error, opening auth modal');
        window.dispatchEvent(new CustomEvent('openAuthModal'));
        return;
      }
      
      // Show error message
      window.dispatchEvent(new CustomEvent('showNotification', {
        detail: {
          type: 'error',
          title: 'Review Submission Failed',
          message: error?.message || 'Failed to submit review. Please try again.'
        }
      }));
    }
  };


  // Show skeleton during initial load for better UX
  if (isLoading && isInitialLoad) {
    return (
      <ThreePanelLayout 
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Insights & Related"
      >
        <EntityPageSkeleton />
      </ThreePanelLayout>
    );
  }

  if (error || !entity) {
    return (
      <ThreePanelLayout 
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Insights & Related"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isEntityNotFound ? 'Entity Not Found' : 'Error Loading Entity'}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Go Back Home
              </button>
              {!isEntityNotFound && (
                <button
                  onClick={refreshEntity}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  return (
    <EntityErrorBoundary>
      <ThreePanelLayout 
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Related Entities & Insights"
        pageTitle={`${entity?.name || 'Entity'} Details`}
      >
        {/* Entity Detail Middle Panel Content */}
        <div className="w-full space-y-6 px-8">
          {/* Page Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Entity Details</h2>
            <p className="text-gray-600">Detailed information about {entity.name}</p>
          </div>

          {/* Entity Card */}
          <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
            <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}>
              <EntityListCard 
                entity={entity as any} 
                showEngagementMetrics={true}
                showActions={true}
                className="w-full"
                onClick={() => {}} // Prevent navigation since we're already on the entity page
              />
            </Suspense>
          </div>

          {/* Entity Description */}
          <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
            <Suspense fallback={<div className="h-32 bg-gray-100 rounded-xl animate-pulse" />}>
              <EntityDescription entity={entity} />
            </Suspense>
          </div>

          {/* Entity Roles Section - Show multiple professional roles */}
          <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
            <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse" />}>
              <EntityRolesSection 
                entity={entity}
                onRoleSelect={(roleId) => {
                  console.log('Selected role:', roleId);
                  // TODO: Filter reviews by role
                }}
                onWriteReview={(roleId) => {
                  console.log('Write review for role:', roleId);
                  handleOpenReviewModal();
                }}
              />
            </Suspense>
          </div>

          {/* Entity Actions & Management */}
          <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
            <Suspense fallback={<div className="h-16 bg-gray-100 rounded-xl animate-pulse" />}>
              <EntityActions 
                entity={entity}
                onWriteReview={handleOpenReviewModal}
                onBookmark={() => {
                  console.log('Bookmark:', entity.name);
                }}
                onShare={() => {
                  console.log('Share:', entity.name);
                }}
                onExternalLink={() => {
                  console.log('External link for:', entity.name);
                }}
              />
            </Suspense>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <Suspense fallback={<div className="h-16 bg-gray-100 rounded-xl animate-pulse" />}>
                <EntityManagementActions
                  entity={entity}
                  onEntityUpdate={(updatedEntity) => {
                    // Refresh the entity data
                    refreshEntity();
                  }}
                  onEntityDelete={() => {
                    // Redirect to home page after deletion
                    navigate('/');
                  }}
                  className="justify-center"
                />
              </Suspense>
            </div>
          </div>

          {/* Reviews Section */}
          {hasReviews ? (
            <div className="space-y-6">
              {/* Rating Breakdown */}
              <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">📊 Rating Breakdown</h3>
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
                  <RatingBreakdown
                    reviews={allReviews}
                    totalReviews={totalReviews}
                    averageRating={averageRating}
                  />
                </Suspense>
              </div>

              {/* Filter Controls */}
              <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">🔍 Filter & Sort Reviews</h3>
                <Suspense fallback={<div className="h-16 bg-gray-100 rounded-xl animate-pulse" />}>
                  <FilterControls
                    allReviews={allReviews}
                    displayedReviews={displayedReviews}
                    selectedRating={selectedRating}
                    timeSort={timeSort}
                    showSortDropdown={showSortDropdown}
                    isSorting={isSorting}
                    onRatingChange={handleRatingChange}
                    onTimeSortChange={handleTimeSortChange}
                    onToggleSortDropdown={handleToggleSortDropdown}
                  />
                </Suspense>
              </div>

              {/* Reviews List */}
              <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">💬 Reviews ({filteredReviewsCount})</h3>
                <LazyReviewsList
                  reviews={displayedReviews}
                  selectedRating={selectedRating}
                  isSorting={isSorting}
                />
              </div>
            </div>
          ) : null}

          {/* No Reviews Message */}
          {!hasReviews && (
            <div className="bg-white border-2 border-gray-800 shadow-lg rounded-xl p-6">
              <div className="text-center py-12">
                <div className="mx-auto mb-6 w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">📝</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Be the first to review this entity and help others discover it!
                </p>
                {canWriteReview && (
                  <button
                    onClick={handleOpenReviewModal}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Write First Review
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <AddReviewModal
          open={isReviewModalOpen}
          onClose={handleCloseReviewModal}
          onReviewSubmit={handleSubmitReview}
          userName={currentUser?.name || 'Guest User'}
          userAvatar={currentUser?.avatar || '/default-avatar.png'}
          preselectedEntity={entity}
        />

      </ThreePanelLayout>
    </EntityErrorBoundary>
  );
};

export default EntityDetailPage;
