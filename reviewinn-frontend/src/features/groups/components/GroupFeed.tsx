import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Users, TrendingUp } from 'lucide-react';
import ReviewFeed from '../../common/components/ReviewFeed';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { Button } from '../../../shared/design-system/components/Button';
import { GroupType, ReviewScope } from '../types';
import type { Review, Entity } from '../../../types';
import { createAuthenticatedRequestInit } from '../../../shared/utils/auth';

// Group-specific review mappings
const getGroupSpecificReviews = (groupId: string, apiReviews: any[]) => {
  // Create different review assignments for different groups
  const groupReviewMap: Record<string, string[]> = {
    '1': ['East West University Alumni'], // EWU Alumni
    '2': ['Dhaka Food Lovers'], // Food group
    '3': ['Tech Professionals Bangladesh'], // Tech group
    '4': ['Chittagong Business Network'], // Business group
    '5': ['Cricket Fans Bangladesh'], // Cricket group
    '6': ['Travel Enthusiasts BD'], // Travel group
    '7': ['Photography Club Dhaka'], // Photography group
  };

  const groupName = groupReviewMap[groupId] ? groupReviewMap[groupId][0] : 'General Community';
  
  // Filter and assign reviews to specific groups based on content/entity type
  let filteredReviews = apiReviews;
  
  // Group-specific filtering logic
  if (groupId === '2') { // Food group
    filteredReviews = apiReviews.filter(review => 
      review.entity?.root_category?.name?.toLowerCase().includes('food') ||
      review.entity?.final_category?.name?.toLowerCase().includes('restaurant') ||
      review.content?.toLowerCase().includes('food') ||
      review.content?.toLowerCase().includes('restaurant')
    );
  } else if (groupId === '3') { // Tech group
    filteredReviews = apiReviews.filter(review => 
      review.entity?.root_category?.name?.toLowerCase().includes('tech') ||
      review.entity?.final_category?.name?.toLowerCase().includes('software') ||
      review.content?.toLowerCase().includes('software') ||
      review.content?.toLowerCase().includes('app')
    );
  }
  
  // If no specific reviews found, show a subset of all reviews
  if (filteredReviews.length === 0) {
    filteredReviews = apiReviews.slice(0, 3); // Show first 3 reviews as group content
  }
  
  return { filteredReviews, groupName };
};

// Transform API review to Review format (same as homepage)
const transformApiReviewToReview = (apiReview: any, groupName: string): Review => {
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
    groupName: groupName
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


// Empty State Component for Groups
const GroupEmptyState: React.FC<{ groupName?: string, isNewGroup?: boolean }> = ({ 
  groupName = 'this group',
  isNewGroup = false 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        
        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {isNewGroup ? `Welcome to ${groupName}!` : `No reviews yet in ${groupName}`}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {isNewGroup 
              ? "This is a brand new group! Be the first to share a review and start building this community."
              : "This group is just getting started. Be the first to share your experiences and help others discover great places, services, and products."
            }
          </p>
        </div>

        {/* Action Items */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-blue-700">Share reviews</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-sm text-green-700">Connect with members</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <span className="text-sm text-purple-700">Discover new places</span>
            </div>
          </div>

          {/* Call to Action */}
          <div className="pt-4">
            <Button 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => {
                // This could open a review modal or navigate to add review page
                console.log('Open add review modal for group');
              }}
            >
              Write the First Review
            </Button>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-gray-50 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-gray-900 mb-2">💡 Getting Started Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Review places and services relevant to this group's interests</li>
            <li>• Share honest experiences to help fellow members</li>
            <li>• Use the search bar above to find specific content</li>
            <li>• Engage with other members' reviews through reactions and comments</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

interface GroupFeedProps {
  groupId?: string;
  className?: string;
  groupName?: string;
}

const GroupFeed: React.FC<GroupFeedProps> = ({ groupId, className = '', groupName }) => {
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
        // First, check if we have a specific group and get its details
        if (groupId) {
          const groupResponse = await fetch(`http://localhost:8000/api/v1/groups/${groupId}`);
          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            
            // If the group has no reviews, show empty state immediately
            if (groupData.review_count === 0) {
              setReviews([]);
              setEntities([]);
              setHasMoreReviews(false);
              setLoading(false);
              return;
            }
          }
        }
        
        // For now, fetch from homepage reviews as we don't have a specific group feed endpoint yet
        const response = await fetch('http://localhost:8000/api/v1/homepage/reviews?page=1&limit=20', {
          ...createAuthenticatedRequestInit({
            method: 'GET',
            credentials: 'include',
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          // Get group-specific reviews and group name
          const { filteredReviews, groupName } = groupId 
            ? getGroupSpecificReviews(groupId, result.data)
            : { filteredReviews: result.data, groupName: 'General Community' };
          
          // Transform API reviews to Review format
          const transformedReviews = filteredReviews.map(review => transformApiReviewToReview(review, groupName));
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
      {/* Reviews or Empty State */}
      {reviews.length > 0 ? (
        <>
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
        </>
      ) : (
        /* Empty State */
        <GroupEmptyState 
          groupName={groupName || 'this group'} 
          isNewGroup={true}
        />
      )}
    </div>
  );
};

export default GroupFeed;