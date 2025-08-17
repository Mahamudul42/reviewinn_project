import React, { useState, useEffect } from 'react';
import ReviewFeed from '../../common/components/ReviewFeed';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { GroupType, ReviewScope } from '../types';
import type { Review, Entity } from '../../../types';

// Transform API review to Review format (same as homepage)
const transformApiReviewToReview = (apiReview: any): Review => {
  return {
    id: apiReview.review_id.toString(),
    entityId: apiReview.entity?.entity_id?.toString() || '',
    reviewerId: apiReview.user?.user_id?.toString() || '',
    reviewerName: apiReview.user?.name || 'Anonymous',
    reviewerUsername: apiReview.user?.username,
    reviewerAvatar: apiReview.user?.avatar,
    userId: apiReview.user?.user_id?.toString(),
    title: apiReview.title || '',
    content: apiReview.content || '',
    overallRating: apiReview.overall_rating || 0,
    ratings: apiReview.ratings || {},
    criteria: apiReview.ratings || {},
    pros: apiReview.pros || [],
    cons: apiReview.cons || [],
    images: apiReview.images || [],
    isAnonymous: apiReview.is_anonymous || false,
    isVerified: apiReview.is_verified || false,
    view_count: apiReview.view_count || 0,
    total_reactions: apiReview.reaction_count || 0,
    comment_count: apiReview.comment_count || 0,
    commentCount: apiReview.comment_count || 0,
    reactions: apiReview.top_reactions || {},
    top_reactions: Object.keys(apiReview.top_reactions || {}),
    user_reaction: apiReview.user_reaction || undefined,
    createdAt: apiReview.created_at,
    updatedAt: apiReview.updated_at,
    entity: {
      id: apiReview.entity?.entity_id?.toString() || '',
      name: apiReview.entity?.name || 'Unknown Entity',
      description: apiReview.entity?.description || '',
      avatar: apiReview.entity?.avatar,
      imageUrl: apiReview.entity?.imageUrl || apiReview.entity?.avatar,
      category: apiReview.entity?.root_category?.name,
      averageRating: apiReview.entity?.average_rating || 0,
      reviewCount: apiReview.entity?.review_count || 0,
      view_count: apiReview.entity?.view_count || 0,
      is_verified: apiReview.entity?.is_verified || false,
      is_claimed: apiReview.entity?.is_claimed || false,
      root_category: apiReview.entity?.root_category,
      final_category: apiReview.entity?.final_category,
      root_category_name: apiReview.entity?.root_category?.name,
      final_category_name: apiReview.entity?.final_category?.name,
      root_category_id: apiReview.entity?.root_category?.id,
      final_category_id: apiReview.entity?.final_category?.id,
    },
    // Add group information for display
    groupName: 'General Community' // Default group name, can be enhanced later
  };
};

// Add group name display component
const GroupNameBadge: React.FC<{ groupName: string }> = ({ groupName }) => (
  <div className="mb-3 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
      <span className="text-sm font-medium text-purple-700">
        📋 {groupName}
      </span>
    </div>
  </div>
);

interface GroupFeedProps {
  groupId?: string;
  className?: string;
}

const GroupFeed: React.FC<GroupFeedProps> = ({ groupId, className = '' }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchGroupFeed = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // For now, fetch from homepage reviews as we don't have a specific group feed endpoint yet
        const token = localStorage.getItem('reviewinn_jwt_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('http://localhost:8000/api/v1/homepage/reviews?page=1&limit=20', {
          method: 'GET',
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          // Transform API reviews to Review format (same as homepage)
          const transformedReviews = result.data.map(transformApiReviewToReview);
          const transformedEntities = transformedReviews.map(r => r.entity).filter(Boolean) as Entity[];
          
          setReviews(transformedReviews);
          setEntities(transformedEntities);
          setHasMoreReviews(result.pagination?.has_more || false);
        } else {
          setReviews([]);
          setEntities([]);
        }
      } catch (err) {
        console.error('Error fetching group feed:', err);
        setError(err instanceof Error ? err.message : 'Failed to load feed');
        setReviews([]);
        setEntities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupFeed();
  }, [groupId]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMoreReviews) return;
    
    setLoadingMore(true);
    try {
      // Implementation for loading more reviews
      // For now, just disable loading more
      setLoadingMore(false);
    } catch (err) {
      console.error('Error loading more reviews:', err);
      setLoadingMore(false);
    }
  };

  const handleReactionChange = (reviewId: string, reaction: string | null) => {
    // Handle reaction changes
    console.log('Reaction change:', reviewId, reaction);
  };

  const handleCommentAdd = (reviewId: string, content: string, parentId?: string) => {
    // Handle comment additions
    console.log('Comment add:', reviewId, content, parentId);
  };

  const handleCommentDelete = (reviewId: string, commentId: string) => {
    // Handle comment deletions
    console.log('Comment delete:', reviewId, commentId);
  };

  const handleCommentReaction = (reviewId: string, commentId: string, reaction: string | null) => {
    // Handle comment reactions
    console.log('Comment reaction:', reviewId, commentId, reaction);
  };

  const handleGiveReviewClick = (entity: Entity) => {
    // Handle give review click
    console.log('Give review click:', entity);
  };

  const handleViewCountUpdate = (reviewId: string, newCount: number) => {
    // Handle view count updates
    console.log('View count update:', reviewId, newCount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <p>Unable to load group feed: {error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {reviews.map((review) => (
        <div key={review.id}>
          {/* Group Name Badge */}
          <GroupNameBadge groupName={review.groupName || 'General Community'} />
          
          {/* Use the same ReviewFeed component as homepage, but just for one review */}
          <ReviewFeed
            reviews={[review]}
            entities={[review.entity]}
            hasMoreReviews={false}
            loadingMore={false}
            onLoadMore={handleLoadMore}
            onReactionChange={handleReactionChange}
            onCommentAdd={handleCommentAdd}
            onCommentDelete={handleCommentDelete}
            onCommentReaction={handleCommentReaction}
            onGiveReviewClick={handleGiveReviewClick}
            onViewCountUpdate={handleViewCountUpdate}
          />
        </div>
      ))}
      
      {/* Load More */}
      {hasMoreReviews && (
        <div className="text-center py-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Posts'}
          </button>
        </div>
      )}
    </div>
  );
};

export default GroupFeed;