import React, { Suspense, lazy, memo } from 'react';
import type { Review } from '../../../types';

// Lazy load the heavy review components
const ReviewFeedCard = lazy(() => import('../../reviews/components/ReviewFeedCard'));

interface LazyReviewsListProps {
  reviews: Review[];
  selectedRating: number | 'all';
  isSorting: boolean;
  className?: string;
}

// Skeleton for individual review card
const ReviewCardSkeleton: React.FC = () => (
  <div className="bg-white border-2 border-gray-200 rounded-xl shadow-lg p-6 animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-300 rounded w-full"></div>
      <div className="h-4 bg-gray-300 rounded w-4/5"></div>
      <div className="h-4 bg-gray-300 rounded w-3/5"></div>
    </div>
    <div className="flex gap-4">
      <div className="h-8 bg-gray-300 rounded w-16"></div>
      <div className="h-8 bg-gray-300 rounded w-20"></div>
      <div className="h-8 bg-gray-300 rounded w-14"></div>
    </div>
  </div>
);

// Reviews list skeleton
const ReviewsListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <ReviewCardSkeleton key={i} />
    ))}
  </div>
);

// Memoized review item to prevent unnecessary re-renders
const ReviewItem: React.FC<{ review: Review; index: number }> = memo(({ review, index }) => (
  <Suspense fallback={<ReviewCardSkeleton />}>
    <ReviewFeedCard
      review={review}
      hideEntityInfo={true}
      showFullContent={index < 2} // Auto-expand first 2 reviews
    />
  </Suspense>
));

ReviewItem.displayName = 'ReviewItem';

const LazyReviewsList: React.FC<LazyReviewsListProps> = memo(({
  reviews,
  selectedRating,
  isSorting,
  className = ''
}) => {
  // Empty state
  if (reviews.length === 0) {
    return (
      <div className={className}>
        <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-500 via-slate-500 to-gray-600 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <span className="text-white text-xl">📝</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow-md">
                  {selectedRating === 'all' ? 'No Reviews Yet' : `No ${selectedRating}-Star Reviews`}
                </h2>
                <p className="text-white/90 text-sm">Be the first to share your experience!</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-gradient-to-br from-gray-50 to-slate-50 text-center">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">
              {selectedRating === 'all' 
                ? 'Be the first to write a review!' 
                : `Try selecting a different rating or view all reviews.`
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Loading state during sorting */}
      {isSorting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-gray-700 font-medium">Sorting reviews...</span>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Header */}
      <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <span className="text-white text-xl">💬</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white drop-shadow-md">
                {selectedRating === 'all' 
                  ? `All Reviews (${reviews.length})` 
                  : `${selectedRating}-Star Reviews (${reviews.length})`
                }
              </h2>
              <p className="text-white/90 text-sm">
                Real experiences from our community
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <Suspense fallback={<ReviewsListSkeleton />}>
        <div className="space-y-6">
          {reviews.map((review, index) => (
            <ReviewItem 
              key={`${review.id}-${selectedRating}-${index}`} 
              review={review} 
              index={index}
            />
          ))}
        </div>
      </Suspense>

      {/* Load more indicator (for future pagination) */}
      {reviews.length > 10 && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600">
            <span>Showing {reviews.length} reviews</span>
          </div>
        </div>
      )}
    </div>
  );
});

LazyReviewsList.displayName = 'LazyReviewsList';

export default LazyReviewsList;