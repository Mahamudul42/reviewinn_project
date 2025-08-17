import React from 'react';
import { 
  Star, 
  MessageCircle, 
  ThumbsUp, 
  Eye, 
  Calendar,
  Building,
  MoreVertical,
  Filter,
  Search,
  SortDesc
} from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';
import ReviewFeedCard from '../../reviews/components/ReviewFeedCard';
import type { Review, Entity } from '../../../types';

interface ProfileReviewsProps {
  reviews: Review[];
  entities: Entity[];
  isCurrentUser: boolean;
  userName: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReactionChange: (reviewId: string, reaction: string | null) => void;
  onCommentAdd: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete: (reviewId: string, commentId: string) => void;
  onCommentReaction: (reviewId: string, commentId: string, reaction: string | null) => void;
}

const ProfileReviews: React.FC<ProfileReviewsProps> = ({
  reviews,
  entities,
  isCurrentUser,
  userName,
  isLoading,
  hasMore,
  onLoadMore,
  onReactionChange,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'newest' | 'oldest' | 'rating' | 'helpful'>('newest');
  const [filterRating, setFilterRating] = React.useState<number | null>(null);
  
  // Filter and sort reviews
  const filteredAndSortedReviews = React.useMemo(() => {
    let filtered = reviews.filter(review =>
      review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.entityName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterRating !== null) {
      filtered = filtered.filter(review => review.overallRating === filterRating);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating':
          return b.overallRating - a.overallRating;
        case 'helpful':
          return (b.reactions?.helpful || 0) - (a.reactions?.helpful || 0);
        default:
          return 0;
      }
    });
  }, [reviews, searchTerm, sortBy, filterRating]);

  const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Review Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Entity Info */}
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{review.entityName}</span>
                {review.entity?.isVerified && (
                  <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    Verified
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.overallRating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {review.overallRating}/5
                </span>
              </div>

              {/* Review Date */}
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatTimeAgo(review.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            {isCurrentUser && (
              <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Review Content */}
        <div className="p-4">
          <p className="text-gray-700 leading-relaxed mb-4">
            {review.content}
          </p>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {review.images.slice(0, 6).map((image, index) => (
                <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Review Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                <span>{review.reactions?.helpful || 0} helpful</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{review.commentsCount || 0} comments</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{review.viewCount || 0} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          {isCurrentUser ? 'Your Reviews' : `${userName}'s Reviews`}
          <span className="text-sm font-normal text-gray-500">
            ({reviews.length})
          </span>
        </h2>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SortDesc className="w-4 h-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating">Highest rated</option>
            <option value="helpful">Most helpful</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterRating || ''}
            onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {filteredAndSortedReviews.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedReviews.map((review) => (
            <ReviewFeedCard
              key={review.id}
              review={review}
              entity={review.entity}
              hideEntityInfo={false}
              onReactionChange={onReactionChange}
              onCommentAdd={onCommentAdd}
              onCommentDelete={onCommentDelete}
              onCommentReaction={onCommentReaction}
              showFullContent={true}
            />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500 mb-4">
            {isCurrentUser
              ? "You haven't written any reviews yet. Share your experiences to help others!"
              : `${userName} hasn't written any reviews yet.`
            }
          </p>
          {isCurrentUser && (
            <Button className="flex items-center gap-2 mx-auto">
              <Star className="w-4 h-4" />
              Write Your First Review
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No reviews match your search.</p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="text-center pt-4">
          <Button onClick={onLoadMore} variant="outline">
            Load More Reviews
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8">
          <LoadingSpinner size="md" />
          <p className="text-gray-500 mt-2">Loading reviews...</p>
        </div>
      )}
    </div>
  );
};

export default ProfileReviews;