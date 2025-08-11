import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Star, User, Building, MapPin, Package, Calendar, MessageCircle } from 'lucide-react';
import EntityListCard from '../../../shared/components/EntityListCard';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { getCategoryIcon, getCategoryColor } from '../../../shared/utils/categoryUtils';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';
import type { SearchType, UnifiedSearchResult } from '../types/searchTypes';
import type { Entity, Review, User as UserType } from '../../../types';

interface SearchResultsProps {
  results: UnifiedSearchResult;
  searchType: SearchType;
  query: string;
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
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

  const EntityCard: React.FC<{ entity: Entity }> = ({ entity }) => {
    return (
      <EntityListCard
        entity={entity}
        onClick={() => handleEntityClick(entity)}
        showEngagementMetrics={true}
        showActions={false}
        variant="default"
      />
    );
  };

  const ReviewCard: React.FC<{ review: Review & { entityName?: string } }> = ({ review }) => {
    return (
      <div
        onClick={() => handleReviewClick(review)}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Reviewer Avatar */}
            {review.reviewerAvatar ? (
              <img
                src={review.reviewerAvatar}
                alt={review.reviewerName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                {review.reviewerName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{review.reviewerName || 'Anonymous'}</div>
              <div className="text-sm text-gray-500">
                {review.createdAt && formatTimeAgo(review.createdAt)}
              </div>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>

        {/* Review Title */}
        {review.title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
            {review.title}
          </h3>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(review.overallRating) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{review.overallRating.toFixed(1)}</span>
        </div>

        {/* Review Content */}
        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
          {review.content}
        </p>

        {/* Entity Info */}
        {review.entityName && (
          <div className="text-sm text-gray-500">
            Review for <span className="font-medium text-blue-600">{review.entityName}</span>
          </div>
        )}
      </div>
    );
  };

  const UserCard: React.FC<{ user: UserType & { reviewCount?: number; averageRating?: number } }> = ({ user }) => {
    return (
      <div
        onClick={() => handleUserClick(user)}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-start space-x-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {user.name}
                </h3>
                {user.email && (
                  <p className="text-gray-500 text-sm">{user.email}</p>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>

            {/* User Stats */}
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              {user.reviewCount && user.reviewCount > 0 && (
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{user.reviewCount} reviews</span>
                </div>
              )}
              {user.averageRating && user.averageRating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{user.averageRating.toFixed(1)} avg</span>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatTimeAgo(user.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (searchType === 'entities' || searchType === 'all') {
      if (results.entities.length > 0) {
        return (
          <div className="space-y-4">
            {searchType === 'all' && (
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Entities ({results.entities.length})
              </h2>
            )}
            {results.entities.map((entity) => (
              <EntityCard key={entity.id} entity={entity} />
            ))}
          </div>
        );
      }
    }

    if (searchType === 'reviews' || searchType === 'all') {
      if (results.reviews && results.reviews.length > 0) {
        return (
          <div className="space-y-4">
            {searchType === 'all' && (
              <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">
                Reviews ({results.reviews.length})
              </h2>
            )}
            {results.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        );
      }
    }

    if (searchType === 'users' || searchType === 'all') {
      if (results.users && results.users.length > 0) {
        return (
          <div className="space-y-4">
            {searchType === 'all' && (
              <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">
                Users ({results.users.length})
              </h2>
            )}
            {results.users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {renderResults()}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Loading...</span>
              </>
            ) : (
              'Load More Results'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchResults;