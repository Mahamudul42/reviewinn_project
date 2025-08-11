import React from 'react';
import type { Review, Entity } from '../../types';

interface PlatformLeftPanelProps {
  reviews: Review[];
  entities: Record<string, Entity>;
  categoryFilter: string | null;
  onCategoryFilter: (category: string | null) => void;
  loading?: boolean;
  error?: string | null;
}

const PlatformLeftPanel: React.FC<PlatformLeftPanelProps> = ({ 
  reviews, 
  entities, 
  categoryFilter, 
  onCategoryFilter,
  loading = false,
  error = null
}) => {

  // Helper functions
  const getTotalReactions = (review: Review) => {
    if (review.total_reactions) return review.total_reactions;
    if (review.reactions) {
      return Object.values(review.reactions).reduce((sum, count) => sum + (count || 0), 0);
    }
    return 0;
  };

  const formatRating = (rating: number | undefined) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  // Calculate analytics
  const trendingReview = reviews.length > 0 
    ? reviews.reduce((prev, current) => 
        getTotalReactions(current) > getTotalReactions(prev) ? current : prev
      )
    : null;

  const categoryCount = reviews.reduce((acc, review) => {
    const category = review.category || 'uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.keys(categoryCount).length > 0 
    ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
    : null;

  const entityArray = Object.values(entities);
  const topEntity = entityArray.length > 0
    ? entityArray.reduce((prev, current) => {
        const prevReviews = reviews.filter(r => r.entityId === prev.id);
        const currentReviews = reviews.filter(r => r.entityId === current.id);
        return currentReviews.length > prevReviews.length ? current : prev;
      })
    : null;

  const topEntityData = topEntity ? {
    reviewCount: reviews.filter(r => r.entityId === topEntity.id).length,
    totalReactions: reviews.filter(r => r.entityId === topEntity.id).reduce((sum, r) => sum + getTotalReactions(r), 0)
  } : null;

  const reviewerStats = reviews.reduce((acc, review) => {
    const reviewer = review.reviewerName;
    if (!acc[reviewer]) {
      acc[reviewer] = { 
        count: 0, 
        totalReactions: 0, 
        avatar: review.reviewerAvatar 
      };
    }
    acc[reviewer].count++;
    acc[reviewer].totalReactions += getTotalReactions(review);
    return acc;
  }, {} as Record<string, { count: number; totalReactions: number; avatar?: string }>);

  const topReviewer = Object.keys(reviewerStats).length > 0
    ? Object.keys(reviewerStats).reduce((prev, current) => 
        reviewerStats[current].count > reviewerStats[prev].count ? current : prev
      )
    : null;

  const topReviewerData = topReviewer ? reviewerStats[topReviewer] : null;

  const trendingTopics = Object.keys(categoryCount)
    .sort((a, b) => categoryCount[b] - categoryCount[a])
    .slice(0, 3);

  const categories = Array.from(new Set(reviews.map(r => r.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Discover</h2>
            <p className="text-sm text-gray-600">Find trending content and insights</p>
          </div>
        </div>
      </div>

      {/* Category Selector */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          Categories
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              !categoryFilter 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onCategoryFilter(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                categoryFilter === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => onCategoryFilter(cat)}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Review Card */}
      {trendingReview ? (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            Trending Review
          </h3>
          <div className="flex items-start gap-3">
            <img 
              src={trendingReview.reviewerAvatar || 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=ffffff&size=48&rounded=true'} 
              alt={trendingReview.reviewerName} 
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">{trendingReview.reviewerName}</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs text-gray-500">{new Date(trendingReview.createdAt).toLocaleDateString()}</span>
              </div>
              <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-1">{trendingReview.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{trendingReview.content}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  {getTotalReactions(trendingReview)} reactions
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {formatRating(trendingReview.overallRating)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-sm text-gray-500">Be the first to write a review!</p>
        </div>
      )}

      {/* Top Entity Card */}
      {topEntity && topEntityData ? (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 bg-yellow-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
              </svg>
            </div>
            Top Entity
          </h3>
          <div className="flex items-start gap-3">
            <img 
              src={topEntity.avatar || 'https://ui-avatars.com/api/?name=Entity&background=10b981&color=ffffff&size=48&rounded=true'} 
              alt={topEntity.name} 
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{topEntity.name}</h4>
                {topEntity.isVerified && (
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{topEntity.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{topEntityData.reviewCount} reviews</span>
                <span>{topEntityData.totalReactions} reactions</span>
                <span>{formatRating(topEntity.averageRating)} rating</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No entities yet</h3>
          <p className="text-sm text-gray-500">Add entities to see top performers!</p>
        </div>
      )}

      {/* Top Reviewer Card */}
      {topReviewer && topReviewerData ? (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
              </svg>
            </div>
            Top Reviewer
          </h3>
          <div className="flex items-start gap-3">
            <img 
              src={topReviewerData.avatar || 'https://ui-avatars.com/api/?name=Reviewer&background=8b5cf6&color=ffffff&size=48&rounded=true'} 
              alt={topReviewer} 
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm mb-2">{topReviewer}</h4>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{topReviewerData.count} reviews</span>
                <span>{topReviewerData.totalReactions} reactions</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No reviewers yet</h3>
          <p className="text-sm text-gray-500">Start reviewing to become top reviewer!</p>
        </div>
      )}

      {/* Trending Topics Card */}
      {trendingTopics.length > 0 ? (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
            </div>
            Trending Topics
          </h3>
          <div className="space-y-2">
            {trendingTopics.map((topic, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{topic.replace('_', ' ')}</span>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {categoryCount[topic]} reviews
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No trending topics yet</h3>
          <p className="text-sm text-gray-500">Start reviewing to see what's hot!</p>
        </div>
      )}

      {/* Most Active Category Card */}
      {Object.keys(categoryCount).length > 0 && (
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            Most Active Category
          </h3>
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-1 capitalize">
              {topCategory?.replace('_', ' ')}
            </h4>
            <p className="text-sm text-gray-500">{categoryCount[topCategory || '']} reviews</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformLeftPanel;
