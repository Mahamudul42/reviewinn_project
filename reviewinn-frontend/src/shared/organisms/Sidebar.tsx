import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Review, Entity } from '../../types';
import ReviewDetailModal from '../../features/reviews/components/ReviewDetailModal';
import StarRating from '../atoms/StarRating';
import ContactUsModal from '../components/modals/ContactUsModal';
import HelpCenterModal from '../components/modals/HelpCenterModal';
import ReportAbuseModal from '../components/modals/ReportAbuseModal';

// Define sidebar section types that can be included
export type SidebarSectionType = 
  | 'discover-header'
  | 'trending-review'
  | 'top-entity'
  | 'top-reviewer'
  | 'trending-topics'
  | 'most-active-category'
  | 'most-discussed'
  | 'top-categories'
  | 'reviewsite-info'
  | 'support-info'
  | 'custom';

// Sidebar section configuration interface
export interface SidebarSection {
  type: SidebarSectionType;
  id: string;
  title?: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  props?: any;
}

interface SidebarProps {
  sections: SidebarSection[];
  reviews?: Review[];
  entities?: Record<string, Entity>;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Sidebar Component - Industry standard modular sidebar
 * Supports configurable sections and layouts for maximum flexibility
 */
const Sidebar: React.FC<SidebarProps> = ({ 
  sections,
  reviews = [], 
  entities = {}, 
  loading = false,
  error = null,
  className = ""
}) => {
  const navigate = useNavigate();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  // Support modal states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Helper functions for calculations
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
        avatar: review.reviewerAvatar,
        userId: review.userId
      };
    }
    acc[reviewer].count++;
    acc[reviewer].totalReactions += getTotalReactions(review);
    return acc;
  }, {} as Record<string, { count: number; totalReactions: number; avatar?: string; userId?: string }>);

  const topReviewer = Object.keys(reviewerStats).length > 0
    ? Object.keys(reviewerStats).reduce((prev, current) => 
        reviewerStats[current].count > reviewerStats[prev].count ? current : prev
      )
    : null;

  const topReviewerData = topReviewer ? reviewerStats[topReviewer] : null;

  // Double card layout style matching right panel
  const cardBg = "bg-white bg-gradient-to-br from-yellow-50 to-white border border-yellow-300 w-full max-w-full overflow-hidden";
  const cardWrapper = "p-4 shadow-md rounded-lg bg-white w-full max-w-full overflow-hidden";

  // Modular card item components
  const ReviewCardItem = ({ review, entity, onClick }: { review: Review, entity?: Entity, onClick?: () => void }) => {
    const userImg = review.reviewerAvatar && review.reviewerAvatar.trim() !== ''
      ? review.reviewerAvatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewerName || 'User')}&background=3b82f6&color=ffffff&size=48&rounded=true`;
    const entityAcronym = entity && entity.name
      ? entity.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : 'EN';
    const entityImg = entity && entity.imageUrl && entity.imageUrl.trim() !== ''
      ? entity.imageUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(entityAcronym)}&background=10b981&color=ffffff&size=48&rounded=true`;
    
    // Enhanced content calculations
    const totalReactions = review.total_reactions || (review.reactions ? Object.values(review.reactions).reduce((sum, count) => sum + (count || 0), 0) : 0);
    const timeAgo = review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
    const isVerifiedPurchase = review.isVerified || review.is_verified_purchase;
    const reviewCategory = review.category || entity?.category || 'General';
    
    // Click handlers for navigation
    const handleUserClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (review.userId) {
        navigate(`/profile/${review.userId}`);
      }
    };
    
    const handleEntityClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (entity?.id) {
        navigate(`/entity/${entity.id}`);
      }
    };
    
    return (
      <div
        className={`${cardBg} rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
        onClick={onClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { onClick && onClick(); } }}
        tabIndex={0}
        role="button"
        aria-label={`View details for review by ${review.reviewerName}`}
      >
        <div className="flex items-center gap-3 mb-3 w-full max-w-full overflow-hidden">
          {/* Removed outside avatar image for a cleaner look */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              {/* User Name */}
              <span 
                className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors truncate min-w-0" 
                onClick={handleUserClick}
                title={`View ${review.reviewerName}'s profile`}
              >
                {review.reviewerName}
              </span>
              {isVerifiedPurchase && (
                <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{timeAgo}</p>
            {/* Entity Card (full width, modern design, always show entity image if available) */}
            {entity && (
              <div 
                className="w-full mt-3 mb-2 p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors group shadow-md flex items-center gap-4"
                onClick={handleEntityClick}
                title={`View ${entity?.name} page`}
                style={{ minWidth: 0 }}
              >
                <img
                  src={entity.imageUrl || entity.avatar || userImg}
                  alt={entity?.name}
                  className="w-12 h-12 rounded-xl object-cover border border-blue-300 shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-base font-bold text-blue-900 truncate block">
                    {entity?.name}
                  </span>
                  {entity.category && (
                    <span className="text-xs text-gray-500 capitalize truncate block mt-0.5">
                      {entity.category.replace('_', ' ')}
                    </span>
                  )}
                  {/* Star rating moved to bottom, fractional support */}
                  <div className="flex items-center gap-1 mt-2">
                    <StarRating
                      rating={entity.averageRating || 0}
                      size="sm"
                      showValue={true}
                      className=""
                    />
                  </div>
                </div>
                <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity text-lg font-bold">
                  →
                </span>
              </div>
            )}
          </div>
        </div>
        {/* Review Title Card and User Rating (dynamic, fractional stars) */}
        {(review.title || review.overallRating) && (
          <div className="flex items-center gap-3 mb-2">
            {review.title && (
              <div className="bg-white border border-blue-200 rounded-lg px-3 py-1 shadow-sm flex-1">
                <h5 className="font-semibold text-blue-900 text-sm line-clamp-1">
                  {review.title}
                </h5>
              </div>
            )}
            {typeof review.overallRating === 'number' && (
              <StarRating
                rating={review.overallRating}
                size="md"
                showValue={true}
                className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 shadow-sm"
              />
            )}
          </div>
        )}
        {/* Review Content */}
        <div className="mb-3">
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {review.content}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
          {totalReactions > 0 && (
            <span className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
              <span>❤️</span>
              <span className="font-medium">{totalReactions}</span>
            </span>
          )}
          {review.comments && review.comments.length > 0 && (
            <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
              <span>💬</span>
              <span className="font-medium">{review.comments.length}</span>
            </span>
          )}
        </div>
        {/* Entity Information (removed from bottom) */}
        {/* (No entity info here anymore) */}
      </div>
    );
  };

  const EntityCardItem = ({ entity }: { entity: Entity }) => {
    const entityAcronym = entity.name
      ? entity.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
      : 'EN';
    const entityImg = entity.imageUrl && entity.imageUrl.trim() !== ''
      ? entity.imageUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(entityAcronym)}&background=10b981&color=ffffff&size=48&rounded=true`;
    
    const reviewCount = entity.reviewCount || 0;
    const avgRating = entity.averageRating || 0;
    
    const handleEntityCardClick = () => {
      if (entity?.id) {
        navigate(`/entity/${entity.id}`);
      }
    };
    
    return (
      <div 
        className={`${cardBg} rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
        onClick={handleEntityCardClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { handleEntityCardClick(); } }}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${entity.name}`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 w-full max-w-full overflow-hidden">
          <img
            src={entityImg}
            alt={entity.name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-medium text-gray-900 truncate min-w-0">
                {entity.name}
              </h4>
              {entity.isVerified && (
                <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
            {entity.category && (
              <p className="text-xs text-gray-500 capitalize truncate">
                {entity.category.replace('_', ' ')}
              </p>
            )}
          </div>
          {avgRating > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0 min-w-0">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-sm flex-shrink-0 ${i < avgRating ? '' : 'opacity-30'}`}>
                  ⭐
                </span>
              ))}
              <span className="ml-1 text-xs font-semibold text-gray-700 flex-shrink-0 min-w-0 truncate">
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {entity.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
            {entity.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2 flex-wrap w-full max-w-full overflow-hidden">
          {avgRating > 0 && (
            <span className="text-xs bg-yellow-50 px-2 py-1 rounded-full text-yellow-700 font-medium flex-shrink-0">
              ⭐ {avgRating.toFixed(1)} avg
            </span>
          )}
          {reviewCount > 0 && (
            <span className="text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-700 font-medium flex-shrink-0">
              📝 {reviewCount} reviews
            </span>
          )}
          {entity.view_count && entity.view_count > 0 && (
            <span className="text-xs bg-green-50 px-2 py-1 rounded-full text-green-700 font-medium flex-shrink-0">
              👁️ {entity.view_count} views
            </span>
          )}
        </div>
      </div>
    );
  };

  const ReviewerCardItem = ({ reviewer }: { reviewer: { name: string, avatar?: string, count: number, userId?: string } }) => {
    const reviewerImg = reviewer.avatar && reviewer.avatar.trim() !== ''
      ? reviewer.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewer.name || 'Reviewer')}&background=8b5cf6&color=ffffff&size=48&rounded=true`;
    
    const isTopReviewer = reviewer.count >= 5;
    const reviewerLevel = reviewer.count >= 10 ? 'Expert' : reviewer.count >= 5 ? 'Active' : 'New';
    
    const handleReviewerClick = () => {
      // Try to find userId from reviews matching the reviewer name
      const reviewerUserData = reviews.find(r => r.reviewerName === reviewer.name);
      const userId = reviewer.userId || reviewerUserData?.userId;
      
      if (userId) {
        navigate(`/profile/${userId}`);
      }
    };
    
    return (
      <div 
        className={`${cardBg} rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group`}
        onClick={handleReviewerClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { handleReviewerClick(); } }}
        tabIndex={0}
        role="button"
        aria-label={`View ${reviewer.name}'s profile`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 w-full max-w-full overflow-hidden">
          <div className="relative flex-shrink-0">
            <img
              src={reviewerImg}
              alt={reviewer.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {isTopReviewer && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h4 className="font-medium text-gray-900 truncate">
              {reviewer.name}
            </h4>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                reviewerLevel === 'Expert' ? 'bg-green-50 text-green-700' :
                reviewerLevel === 'Active' ? 'bg-blue-50 text-blue-700' :
                'bg-gray-50 text-gray-700'
              }`}>
                {reviewerLevel}
              </span>
              <span className="text-xs text-gray-500 truncate min-w-0">• {reviewer.count} reviews</span>
            </div>
          </div>
          {isTopReviewer && (
            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0">
              👑 Top
            </span>
          )}
        </div>

        {/* Stats and Progress */}
        <div className="flex items-center gap-2 mb-3 w-full max-w-full overflow-hidden flex-wrap">
          <span className="text-xs bg-purple-50 px-2 py-1 rounded-full text-purple-700 font-medium flex-shrink-0">
            📝 {reviewer.count} reviews
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
            reviewer.count >= 10 ? 'bg-green-50 text-green-700' :
            reviewer.count >= 5 ? 'bg-blue-50 text-blue-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {reviewer.count >= 10 ? '🎆 Expert' :
             reviewer.count >= 5 ? '💪 Active' : '🌱 Starter'}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              reviewer.count >= 10 ? 'bg-gradient-to-r from-green-400 to-green-600' :
              reviewer.count >= 5 ? 'bg-gradient-to-r from-purple-400 to-purple-600' : 
              'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
            style={{ width: `${Math.min((reviewer.count / 20) * 100, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Sidebar section renderers
  const renderSection = (section: SidebarSection) => {
    switch (section.type) {
      case 'discover-header':
        return (
          <div className={`${cardWrapper} mb-6`}>
            <div className={`${cardBg} rounded-lg p-5`}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-2xl">🔍</span>
                <h2 className="text-xl font-bold text-gray-900">
                  {section.title || 'Discover'}
                </h2>
              </div>
              <p className="text-gray-600 text-sm">Find trending reviews and top-rated content</p>
            </div>
            </div>
          </div>
        );

      case 'trending-review':
        // Get top 2 reviews by total reactions (or fallback to review count)
        const topReviews = reviews
          .filter(r => r.reviewerName && r.content)
          .sort((a, b) => {
            const aReactions = getTotalReactions(a);
            const bReactions = getTotalReactions(b);
            return bReactions - aReactions;
          })
          .slice(0, 2);
        return topReviews.length > 0 ? (
          <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
            <div className={`${cardBg} rounded-lg p-5`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              Top Reviews
            </h3>
            <div className="space-y-3">
              {topReviews.map((review, idx) => {
                // Try different entity field names
                const entityId = review.entityId || review.entity_id;
                const foundEntity = entities && entityId ? entities[entityId] : undefined;
                
                return (
                  <ReviewCardItem 
                    key={review.id} 
                    review={review} 
                    entity={foundEntity} 
                    onClick={() => setSelectedReview(review)} 
                  />
                );
              })}
            </div>
            </div>
          </div>
        ) : null;

      case 'top-entity':
        // Get top 2 entities by number of reviews
        const topEntities = entityArray.length > 0
          ? entityArray
              .map(entity => ({
                ...entity,
                reviewCount: reviews.filter(r => r.entityId === entity.id).length
              }))
              .sort((a, b) => b.reviewCount - a.reviewCount)
              .slice(0, 2)
          : [];
        return topEntities.length > 0 ? (
          <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
            <div className={`${cardBg} rounded-lg p-5`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">⭐</span>
              Top Entities
            </h3>
            <div className="space-y-3">
              {topEntities.map((entity, idx) => (
                <EntityCardItem key={entity.id} entity={entity} />
              ))}
            </div>
            </div>
          </div>
        ) : null;

      case 'top-reviewer':
        // Get top 2 reviewers by review count, skipping 'Anonymous'
        const reviewerStatsArr = Object.entries(reviewerStats)
          .filter(([name]) => name && name.toLowerCase() !== 'anonymous')
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 2);
        return reviewerStatsArr.length > 0 ? (
          <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
            <div className={`${cardBg} rounded-lg p-5`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">👑</span>
              Top Reviewers
            </h3>
            <div className="space-y-3">
              {reviewerStatsArr.map((reviewer, idx) => (
                <ReviewerCardItem key={reviewer.name} reviewer={reviewer} />
              ))}
            </div>
            </div>
          </div>
        ) : null;

      case 'most-discussed':
        const mostDiscussedReviews = reviews
          .sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
          .slice(0, 3);
        return mostDiscussedReviews.length > 0 ? (
          <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
            <div className={`${cardBg} rounded-lg p-5`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">💬</span>
              Most Discussed
            </h3>
            <div className="space-y-3">
              {mostDiscussedReviews.slice(0, 3).map((review, idx) => {
                const userImg = review.reviewerAvatar && review.reviewerAvatar.trim() !== ''
                  ? review.reviewerAvatar
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewerName || 'User')}&background=f97316&color=ffffff&size=48&rounded=true`;
                return (
                  <div
                    key={review.id}
                    className="bg-white border border-gray-300 rounded-lg p-3 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={userImg}
                        alt={review.reviewerName} 
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity border-2 border-gray-200" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (review.userId) {
                            navigate(`/profile/${review.userId}`);
                          }
                        }}
                        title={`View ${review.reviewerName}'s profile`}
                      />
                      <div className="flex-1 min-w-0">
                        <span 
                          className="font-semibold text-gray-900 text-sm cursor-pointer hover:text-blue-600 transition-colors block" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (review.userId) {
                              navigate(`/profile/${review.userId}`);
                            }
                          }}
                        >
                          {review.reviewerName}
                        </span>
                        <p className="text-gray-600 text-xs line-clamp-1 mt-1">{review.content}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-lg">💬</span>
                        <div className="text-xs text-gray-600 font-medium">
                          {review.comments?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        ) : null;

      case 'top-categories':
        const categoryStats = reviews.reduce((acc, review) => {
          const category = review.category || 'Uncategorized';
          if (!acc[category]) {
            acc[category] = { count: 0, totalReactions: 0 };
          }
          acc[category].count++;
          acc[category].totalReactions += getTotalReactions(review);
          return acc;
        }, {} as Record<string, { count: number; totalReactions: number }>);

        const topCategories = Object.entries(categoryStats)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 5);

        return topCategories.length > 0 ? (
          <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
            <div className={`${cardBg} rounded-lg p-5`}>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Top Categories
            </h3>
            <div className="space-y-3">
              {topCategories.slice(0, 2).map(([category, stats], idx) => (
                <div key={category} className={`${cardWrapper} hover:shadow-sm transition-all duration-200 group`}>
                  <div className={`${cardBg} rounded-lg p-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📊</span>
                      <div>
                        <span className="font-semibold text-gray-900 text-sm capitalize block">
                          {category.replace('_', ' ').toLowerCase()}
                        </span>
                        <span className="text-xs text-gray-500">{stats.count} reviews</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-lg">👍</span>
                      <div className="text-xs text-gray-600 font-medium">
                        {stats.totalReactions}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        ) : null;

      case 'reviewsite-info':
        return (
          <div className={`${cardWrapper} hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]`}>
            <div className={`${cardBg} rounded-xl p-4`}>
            {/* Header with Logo Effect */}
            <div className="text-center mb-3">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2.5 rounded-full shadow-lg">
                  <span className="text-xl font-bold">🌟</span>
                </div>
              </div>
              <h3 className="text-lg font-black bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mt-3">
                ReviewInn
              </h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mx-auto mt-2"></div>
            </div>

            {/* Description with Enhanced Typography */}
            <p className="text-gray-700 leading-relaxed mb-4 text-center text-sm font-medium">
              Your trusted platform for <span className="text-blue-600 font-bold">authentic reviews</span> and comparisons. 
              Share your experiences and help others make <span className="text-purple-600 font-bold">informed decisions</span>.
            </p>

            {/* Enhanced Feature Cards */}
            <div className="space-y-2">
              <div className="flex items-center p-2.5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm">🌟</span>
                </div>
                <div className="ml-2.5">
                  <span className="text-blue-800 font-bold text-sm">Trusted by thousands</span>
                  <p className="text-blue-600 text-xs">Growing community of reviewers</p>
                </div>
              </div>

              <div className="flex items-center p-2.5 bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-200 transition-all duration-300 group">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm">🔒</span>
                </div>
                <div className="ml-2.5">
                  <span className="text-green-800 font-bold text-sm">Secure & Private</span>
                  <p className="text-green-600 text-xs">Your data is protected</p>
                </div>
              </div>

              <div className="flex items-center p-2.5 bg-gradient-to-r from-purple-50 to-violet-100 rounded-lg border border-purple-200 hover:from-purple-100 hover:to-violet-200 transition-all duration-300 group">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-400 to-violet-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm">⚡</span>
                </div>
                <div className="ml-2.5">
                  <span className="text-purple-800 font-bold text-sm">Fast & Reliable</span>
                  <p className="text-purple-600 text-xs">Lightning fast performance</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        );

      case 'support-info':
        return (
          <div className={`${cardWrapper} hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]`}>
            <div className={`${cardBg} rounded-xl p-4`}>
            {/* Header with Support Icon */}
            <div className="text-center mb-3">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 text-white p-2.5 rounded-full shadow-lg">
                  <span className="text-xl font-bold">🆘</span>
                </div>
              </div>
              <h3 className="text-lg font-black bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 bg-clip-text text-transparent mt-3">
                Support Center
              </h3>
              <div className="w-10 h-0.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mx-auto mt-2"></div>
            </div>

            {/* Enhanced Support Links */}
            <div className="space-y-2">
              <button 
                onClick={() => setShowContactModal(true)}
                className="w-full flex items-center p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-cyan-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm">📞</span>
                </div>
                <div className="ml-2.5 flex-1">
                  <span className="text-blue-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Contact Us</span>
                  <span className="text-blue-600 text-xs">Get in touch with our team</span>
                </div>
              </button>

              <button 
                onClick={() => setShowHelpModal(true)}
                className="w-full flex items-center p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm">❓</span>
                </div>
                <div className="ml-2.5 flex-1">
                  <span className="text-green-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Help Center</span>
                  <span className="text-green-600 text-xs">Find answers and guides</span>
                </div>
              </button>

              <button 
                onClick={() => setShowReportModal(true)}
                className="w-full flex items-center p-2.5 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200 hover:from-red-100 hover:to-rose-100 hover:shadow-md transition-all duration-300 group"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-sm">⚠️</span>
                </div>
                <div className="ml-2.5 flex-1">
                  <span className="text-red-800 font-bold text-sm block group-hover:translate-x-1 transition-transform duration-300">Report Abuse</span>
                  <span className="text-red-600 text-xs">Report inappropriate content</span>
                </div>
              </button>
            </div>
            </div>
          </div>
        );

      case 'custom':
        return section.content ? (
          <div className={`${cardWrapper} hover:shadow-xl transition-all duration-300`}>
            <div className={`${cardBg} rounded-lg p-5`}>
              {section.content}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, index) => (
        <div key={section.id || section.type || `section-${index}`}>
          {renderSection(section)}
        </div>
      ))}
      {selectedReview && <ReviewDetailModal review={selectedReview} open={!!selectedReview} onClose={() => setSelectedReview(null)} />}
      
      {/* Support Center Modals */}
      <ContactUsModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
      <HelpCenterModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <ReportAbuseModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} />
    </div>
  );
};

export default Sidebar;