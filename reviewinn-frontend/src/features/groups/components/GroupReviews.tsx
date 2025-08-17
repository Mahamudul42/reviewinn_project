import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Star, 
  Filter, 
  Calendar,
  User,
  Globe,
  Lock,
  Eye,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';

import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { Button } from '../../../shared/design-system/components/Button';
import Badge from '../../../shared/ui/Badge';

import { GroupMembership, ReviewScope } from '../types';
import { groupService } from '../services/groupService';

interface GroupReviewsProps {
  groupId: number;
  userMembership?: GroupMembership;
}

interface GroupReview {
  review_id: number;
  user_id: number;
  entity_id: number;
  title?: string;
  content: string;
  overall_rating: number;
  is_anonymous: boolean;
  review_scope: ReviewScope;
  view_count: number;
  reaction_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  user_summary?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  entity_summary?: {
    name: string;
    category?: string;
  };
}

const SCOPE_ICONS = {
  [ReviewScope.PUBLIC]: Globe,
  [ReviewScope.GROUP_ONLY]: Lock,
  [ReviewScope.MIXED]: Eye,
};

const SCOPE_COLORS = {
  [ReviewScope.PUBLIC]: 'text-green-600 bg-green-100',
  [ReviewScope.GROUP_ONLY]: 'text-red-600 bg-red-100',
  [ReviewScope.MIXED]: 'text-blue-600 bg-blue-100',
};

const GroupReviews: React.FC<GroupReviewsProps> = ({
  groupId,
  userMembership
}) => {
  const [reviews, setReviews] = useState<GroupReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filter states
  const [selectedScope, setSelectedScope] = useState<ReviewScope | ''>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating' | 'popular'>('newest');

  const fetchReviews = async (resetPage = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: resetPage ? 1 : page,
        size: 20,
        scope: selectedScope || undefined,
        sort: sortBy
      };

      const response = await groupService.getGroupReviews(groupId, params);
      
      if (resetPage) {
        setReviews(response.items || []);
        setPage(1);
      } else {
        setReviews(prev => [...prev, ...(response.items || [])]);
      }
      
      setHasMore(response.has_next || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(true);
  }, [groupId, selectedScope, sortBy]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchReviews();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Group Reviews</h2>
        
        <div className="flex items-center space-x-3">
          {/* Scope Filter */}
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value as ReviewScope | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Scopes</option>
            <option value={ReviewScope.PUBLIC}>Public</option>
            <option value={ReviewScope.GROUP_ONLY}>Group Only</option>
            <option value={ReviewScope.MIXED}>Mixed</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => {
          const ScopeIcon = SCOPE_ICONS[review.review_scope];
          
          return (
            <div key={review.review_id} className="bg-white border border-gray-200 rounded-lg p-6">
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center">
                    {review.user_summary?.avatar_url ? (
                      <img 
                        src={review.user_summary.avatar_url} 
                        alt={review.user_summary.display_name || review.user_summary.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">
                        {review.is_anonymous 
                          ? 'Anonymous User' 
                          : (review.user_summary?.display_name || review.user_summary?.username || 'Unknown User')
                        }
                      </h3>
                      <Badge size="sm" className={SCOPE_COLORS[review.review_scope]}>
                        <ScopeIcon className="w-3 h-3 mr-1" />
                        {review.review_scope}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>Reviewed {review.entity_summary?.name || 'Unknown Entity'}</span>
                      <span>•</span>
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                {renderStars(review.overall_rating)}
              </div>

              {/* Review Content */}
              <div className="mb-4">
                {review.title && (
                  <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                )}
                <p className="text-gray-700 leading-relaxed">{review.content}</p>
              </div>

              {/* Review Stats */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {review.view_count} views
                  </span>
                  <span className="flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {review.reaction_count} reactions
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {review.comment_count} comments
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Reviews'}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-600">
            {selectedScope || sortBy !== 'newest'
              ? 'Try adjusting your filters to see more reviews.'
              : 'This group doesn\'t have any reviews yet.'
            }
          </p>
          {!userMembership && (
            <p className="text-sm text-gray-500 mt-2">
              Join the group to start posting reviews!
            </p>
          )}
        </div>
      )}

      {/* Write Review CTA */}
      {userMembership && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <h3 className="font-medium text-purple-900 mb-2">Share Your Experience</h3>
          <p className="text-purple-700 mb-4">
            Have you tried a product or service? Share your review with the group!
          </p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <MessageSquare className="w-4 h-4 mr-2" />
            Write a Review
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupReviews;