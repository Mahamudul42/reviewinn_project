import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Star, 
  MessageCircle, 
  Eye, 
  Calendar, 
  MapPin, 
  Building, 
  Package, 
  User, 
  MoreVertical, 
  ThumbsUp, 
  Bookmark,
  Share2,
  Heart,
  Zap,
  Award,
  TrendingUp,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import { getCategoryIcon, getCategoryColor } from '../../../shared/utils/categoryUtils';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';
import type { SearchType, UnifiedSearchResult } from '../types/searchTypes';
import type { Entity, Review, User as UserType } from '../../../types';

interface ModernSearchResultsProps {
  results: UnifiedSearchResult;
  searchType: SearchType;
  query: string;
  onLoadMore: () => void;
  loading: boolean;
  hasMore: boolean;
}

const ModernSearchResults: React.FC<ModernSearchResultsProps> = ({
  results,
  searchType,
  query,
  onLoadMore,
  loading,
  hasMore
}) => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());

  const handleEntityClick = (entity: Entity) => {
    navigate(`/entity/${entity.id}`);
  };

  const handleReviewClick = (review: Review) => {
    navigate(`/review/share/${review.id}`);
  };

  const handleUserClick = (user: UserType) => {
    navigate(`/profile/${user.id}`);
  };

  const handleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleShare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Share functionality
  };

  // Enhanced Entity Card with Modern Design
  const EntityCard: React.FC<{ entity: Entity }> = ({ entity }) => {
    const CategoryIcon = getCategoryIcon(entity.category);
    const isHovered = hoveredCard === `entity-${entity.id}`;
    const isBookmarked = bookmarkedItems.has(`entity-${entity.id}`);
    
    return (
      <div
        onClick={() => handleEntityClick(entity)}
        onMouseEnter={() => setHoveredCard(`entity-${entity.id}`)}
        onMouseLeave={() => setHoveredCard(null)}
        className={`
          relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer
          transition-all duration-300 ease-out group
          ${isHovered ? 'shadow-2xl border-blue-200 scale-[1.02]' : 'hover:shadow-lg'}
        `}
      >
        {/* Image Container with Gradient Overlay */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={entity.imageUrl || `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop`}
            alt={entity.name}
            className={`
              w-full h-full object-cover
              transition-transform duration-700 ease-out
              ${isHovered ? 'scale-110' : 'scale-105'}
            `}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop`;
            }}
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4">
            <div className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              backdrop-blur-md bg-white/90 border border-white/50 shadow-lg
              ${getCategoryColor(entity.category)}
            `}>
              <CategoryIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{entity.category.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="absolute top-4 right-4">
            <div className={`
              flex items-center gap-2 opacity-0 group-hover:opacity-100
              transition-opacity duration-300
            `}>
              <button
                onClick={(e) => handleBookmark(`entity-${entity.id}`, e)}
                className={`
                  p-2 rounded-full backdrop-blur-md shadow-lg transition-all duration-200
                  ${isBookmarked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                  }
                `}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => handleShare(`entity-${entity.id}`, e)}
                className="p-2 rounded-full backdrop-blur-md bg-white/90 text-gray-700 hover:bg-white shadow-lg transition-all duration-200"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rating Badge */}
          {entity.averageRating && (
            <div className="absolute bottom-4 right-4">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full backdrop-blur-md bg-white/95 shadow-lg">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-semibold text-gray-800">{entity.averageRating.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {entity.name}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {entity.description || 'Discover this amazing place with great reviews and ratings from our community.'}
          </p>

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {entity.reviewCount && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{entity.reviewCount}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-green-500" />
                <span className="font-medium">{Math.floor(Math.random() * 1000) + 500}</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="font-medium text-purple-600">Trending</span>
              </div>
            </div>

            {/* Verified Badge */}
            {entity.isVerified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </div>
            )}
          </div>

          {/* Location */}
          {entity.context && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <MapPin className="w-4 h-4 text-red-500" />
              <span>{entity.context.location || entity.context.organization}</span>
            </div>
          )}

          {/* Action Button */}
          <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <span>View Details</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Enhanced Review Card
  const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
    const isHovered = hoveredCard === `review-${review.id}`;
    const isBookmarked = bookmarkedItems.has(`review-${review.id}`);
    
    return (
      <div
        onClick={() => handleReviewClick(review)}
        onMouseEnter={() => setHoveredCard(`review-${review.id}`)}
        onMouseLeave={() => setHoveredCard(null)}
        className={`
          relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer
          transition-all duration-300 ease-out group
          ${isHovered ? 'shadow-2xl border-blue-200 scale-[1.02]' : 'hover:shadow-lg'}
        `}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={review.reviewerAvatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`}
                  alt={review.reviewerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{review.reviewerName || 'Anonymous'}</h4>
                <p className="text-sm text-gray-500">@{review.reviewerUsername || 'anonymous'}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => handleBookmark(`review-${review.id}`, e)}
                className={`
                  p-2 rounded-full transition-all duration-200
                  ${isBookmarked 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-gray-100 text-gray-500'
                  }
                `}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => handleShare(`review-${review.id}`, e)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-200"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < (review.overallRating || 0) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-gray-900">{review.overallRating}/5</span>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatTimeAgo(review.createdAt)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
            {review.title || `Review of ${review.entity?.name || 'Unknown Entity'}`}
          </h3>

          {/* Content */}
          <p className="text-gray-600 text-sm line-clamp-4 leading-relaxed mb-4">
            {review.content || 'No content available.'}
          </p>

          {/* Pros/Cons */}
          {(review.pros?.length || review.cons?.length) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {review.pros?.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Pros</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    {review.pros.slice(0, 2).map((pro, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {review.cons?.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Cons</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {review.cons.slice(0, 2).map((con, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>-</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Entity Link */}
          {review.entity && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{review.entity.name}</p>
                <p className="text-xs text-gray-500">View all reviews</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{review.view_count || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>{review.comments?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{review.total_reactions || 0}</span>
              </div>
            </div>
            
            {review.isVerified && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced User Card
  const UserCard: React.FC<{ user: UserType }> = ({ user }) => {
    const isHovered = hoveredCard === `user-${user.id}`;
    const isBookmarked = bookmarkedItems.has(`user-${user.id}`);
    
    return (
      <div
        onClick={() => handleUserClick(user)}
        onMouseEnter={() => setHoveredCard(`user-${user.id}`)}
        onMouseLeave={() => setHoveredCard(null)}
        className={`
          relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer
          transition-all duration-300 ease-out group
          ${isHovered ? 'shadow-2xl border-blue-200 scale-[1.02]' : 'hover:shadow-lg'}
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  <img
                    src={user.avatar || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face`}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Status Indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {user.name}
                </h3>
                <p className="text-sm text-gray-500 mb-1">@{user.username}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    <Award className="w-3 h-3" />
                    <span>Level {user.level || 1}</span>
                  </div>
                  {user.isVerified && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={(e) => handleBookmark(`user-${user.id}`, e)}
                className={`
                  p-2 rounded-full transition-all duration-200
                  ${isBookmarked 
                    ? 'bg-red-100 text-red-600' 
                    : 'hover:bg-gray-100 text-gray-500'
                  }
                `}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={(e) => handleShare(`user-${user.id}`, e)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-200"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
              {user.bio}
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{user.stats?.totalReviews || 0}</div>
              <div className="text-xs text-gray-500">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{user.stats?.followers || 0}</div>
              <div className="text-xs text-gray-500">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{user.stats?.helpfulVotes || 0}</div>
              <div className="text-xs text-gray-500">Helpful</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
              Follow
            </button>
            <button className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
            <div className="h-3 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      ))}
    </div>
  );

  if (loading && results.total === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Entity Results */}
        {(searchType === 'all' || searchType === 'entities') && results.entities?.map((entity) => (
          <EntityCard key={entity.id} entity={entity} />
        ))}

        {/* Review Results */}
        {(searchType === 'all' || searchType === 'reviews') && results.reviews?.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}

        {/* User Results */}
        {(searchType === 'all' || searchType === 'users') && results.users?.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-12">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className={`
              group relative flex items-center gap-3 px-8 py-4 rounded-2xl font-medium transition-all duration-300
              ${loading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              }
            `}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Loading more results...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Show more amazing results</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      )}

      {/* End of Results */}
      {!hasMore && results.total > 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-2xl text-gray-600">
            <CheckCircle className="w-5 h-5" />
            <span>You've seen all the amazing results! 🎉</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernSearchResults;