import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MessageCircle, Eye, Calendar, MapPin, Building, Package, User, MoreVertical, ThumbsUp } from 'lucide-react';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { getCategoryIcon, getCategoryColor } from '../../../shared/utils/categoryUtils';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';
import type { SearchType, UnifiedSearchResult } from '../types/searchTypes';
import type { Entity, Review, User as UserType } from '../../../types';

interface YouTubeSearchResultsProps {
  results: UnifiedSearchResult;
  searchType: SearchType;
  query: string;
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}

const YouTubeSearchResults: React.FC<YouTubeSearchResultsProps> = ({
  results,
  searchType,
  query,
  onLoadMore,
  loading,
  hasMore
}) => {
  const navigate = useNavigate();

  const handleEntityClick = (entity: Entity) => {
    navigate(`/entity/${entity.id}`);
  };

  const handleReviewClick = (review: Review) => {
    navigate(`/review/share/${review.id}`);
  };

  const handleUserClick = (user: UserType) => {
    navigate(`/profile/${user.id}`);
  };

  const EntityResultCard: React.FC<{ entity: Entity }> = ({ entity }) => {
    const CategoryIcon = getCategoryIcon(entity.category);
    
    return (
      <div
        onClick={() => handleEntityClick(entity)}
        className="flex p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
      >
        {/* Thumbnail/Avatar */}
        <div className="flex-shrink-0 mr-4">
          <div className="w-40 h-24 bg-gray-200 rounded-lg overflow-hidden">
            <img
              src={entity.imageUrl || `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop`}
              alt={entity.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop`;
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {entity.name}
          </h3>

          {/* Metadata */}
          <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
            <div className="flex items-center space-x-1">
              <CategoryIcon className="h-4 w-4" />
              <span className="capitalize">{entity.category.replace('_', ' ')}</span>
            </div>
            
            {entity.averageRating && (
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>{entity.averageRating.toFixed(1)}</span>
              </div>
            )}
            
            {entity.reviewCount && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{entity.reviewCount} reviews</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatTimeAgo(entity.createdAt)}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {entity.description || 'No description available.'}
          </p>

          {/* Context Info */}
          {entity.context && (
            <div className="flex items-center text-xs text-gray-500 mt-2 space-x-2">
              <MapPin className="h-3 w-3" />
              <span>{entity.context.organization}</span>
              {entity.context.location && (
                <>
                  <span>•</span>
                  <span>{entity.context.location}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 ml-4">
          <button className="p-2 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
    );
  };

  const ReviewResultCard: React.FC<{ review: Review }> = ({ review }) => (
    <div
      onClick={() => handleReviewClick(review)}
      className="flex p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 mr-4">
        <div className="w-40 h-24 bg-gray-200 rounded-lg overflow-hidden">
          <img
            src={review.entity?.imageUrl || `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop`}
            alt={review.title || 'Review'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop`;
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {review.title || `Review of ${review.entity?.name || 'Unknown Entity'}`}
        </h3>

        {/* Metadata */}
        <div className="flex items-center text-sm text-gray-500 mt-1 space-x-3">
          <div className="flex items-center space-x-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < (review.overallRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span>{review.overallRating}/5</span>
          </div>

          <div className="flex items-center space-x-1">
            <User className="h-4 w-4" />
            <span>{review.reviewerName || 'Anonymous'}</span>
          </div>

          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatTimeAgo(review.createdAt)}</span>
          </div>

          {review.view_count && (
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{review.view_count} views</span>
            </div>
          )}
        </div>

        {/* Review Content */}
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {review.content || 'No content available.'}
        </p>

        {/* Entity Info */}
        {review.entity && (
          <div className="flex items-center text-xs text-gray-500 mt-2 space-x-2">
            <span>Review for:</span>
            <span className="font-medium">{review.entity.name}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 ml-4">
        <button className="p-2 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );

  const UserResultCard: React.FC<{ user: UserType }> = ({ user }) => (
    <div
      onClick={() => handleUserClick(user)}
      className="flex p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mr-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
          <img
            src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`}
            alt={user.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`;
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
          {user.name}
        </h3>

        {/* Username */}
        <p className="text-sm text-gray-500">@{user.username}</p>

        {/* Stats */}
        <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
          {user.stats && (
            <>
              <span>{user.stats.totalReviews || 0} reviews</span>
              <span>•</span>
              <span>Level {user.level || 1}</span>
              {user.stats.helpfulVotes && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{user.stats.helpfulVotes} helpful</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
            {user.bio}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 ml-4">
        <button className="p-2 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Results List */}
      <div className="divide-y divide-gray-200">
        {/* Entity Results */}
        {(searchType === 'all' || searchType === 'entities') && results.entities.map((entity) => (
          <EntityResultCard key={entity.id} entity={entity} />
        ))}

        {/* Review Results */}
        {(searchType === 'all' || searchType === 'reviews') && results.reviews.map((review) => (
          <ReviewResultCard key={review.id} review={review} />
        ))}

        {/* User Results */}
        {(searchType === 'all' || searchType === 'users') && results.users.map((user) => (
          <UserResultCard key={user.id} user={user} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Show more results</span>
            )}
          </button>
        </div>
      )}

      {/* End of Results Message */}
      {!hasMore && results.total > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You've reached the end of the results</p>
        </div>
      )}
    </div>
  );
};

export default YouTubeSearchResults;