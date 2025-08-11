import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { User, Building, MapPin, Package, ChevronDown, ChevronUp, MessageCircle, TrendingUp, Clock } from 'lucide-react';
import type { Review, Entity } from '../../../types';
import { EntityCategory } from '../../../types';
import { reviewService, commentService } from '../../../api/services';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import AuthModal from '../../auth/components/AuthModal';
import ReviewComments from '../../../shared/organisms/ReviewComments';
import SocialReactionButton from '../../../shared/molecules/SocialReactionButton';
import StarRating from '../../../shared/atoms/StarRating';
import ReviewCardSubRatings from '../../../shared/molecules/ReviewCardSubRatings';
import ReviewProsAndCons from '../../../shared/molecules/ReviewProsAndCons';
import ReviewImages from '../../../shared/molecules/ReviewImages';
import ClaimedBadge from '../../../shared/molecules/ClaimedBadge';

interface ReviewDetailModalProps {
  review: Review;
  entity?: Entity;
  open: boolean;
  onClose: () => void;
  onReviewUpdate?: (updatedReview: Review) => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  // Comment count management callbacks
  onCommentCountUpdate?: (count: number) => void;
  onCommentCountIncrement?: () => void;
  onCommentCountDecrement?: () => void;
  onRefreshCommentCount?: () => Promise<number>;
}

const SORT_OPTIONS = [
  {
    key: 'most_relevant',
    label: 'Most relevant',
    description: "Show friends' comments and the most engaging comments first.",
  },
  {
    key: 'newest',
    label: 'Newest',
    description: 'Show all comments with the newest comments first.',
  },
  {
    key: 'all',
    label: 'All comments',
    description: 'Show all comments, including potential spam.',
  },
] as const;

const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  entity,
  open,
  onClose,
  onReviewUpdate,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  onCommentCountUpdate,
  onCommentCountIncrement,
  onCommentCountDecrement,
  onRefreshCommentCount
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useUnifiedAuth();
  const [localReview, setLocalReview] = useState<Review>(review);
  const [localReactions, setLocalReactions] = useState<Record<string, number>>(review.reactions || {});
  const [localUserReaction, setLocalUserReaction] = useState<string | undefined>(review.user_reaction);
  const [topReactions, setTopReactions] = useState<any[]>(review.top_reactions || []);
  const [totalReactions, setTotalReactions] = useState<number>(review.total_reactions || 0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [commentSort, setCommentSort] = useState('most_relevant');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);

  // Update local state when review prop changes
  useEffect(() => {
    setLocalReview(review);
    setLocalReactions(review.reactions || {});
    setLocalUserReaction(review.user_reaction);
    setTopReactions(review.top_reactions || []);
    setTotalReactions(review.total_reactions || 0);
  }, [review]);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Enhanced close handler to refresh comment count
  const handleClose = () => {
    onClose(); // Close modal immediately for snappy UX
    if (onRefreshCommentCount) {
      // Trigger refresh in the background
      onRefreshCommentCount().catch(error => {
        console.error('Failed to refresh comment count on close:', error);
      });
    }
  };

  // Close sort menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load comment count when modal opens
  useEffect(() => {
    if (open) {
      const loadCommentCount = async () => {
        try {
          const count = await commentService.getCommentCount(localReview.id);
          setCommentCount(count);
        } catch (error) {
          console.error('Failed to load comment count:', error);
          setCommentCount(0);
        }
      };
      loadCommentCount();
    }
  }, [open, localReview.id]);

  const getCategoryIcon = (category: EntityCategory) => {
    switch (category) {
      case EntityCategory.PROFESSIONALS: return <User className="w-4 h-4" />;
      case EntityCategory.COMPANIES: return <Building className="w-4 h-4" />;
      case EntityCategory.PLACES: return <MapPin className="w-4 h-4" />;
      case EntityCategory.PRODUCTS: return <Package className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: EntityCategory) => {
    switch (category) {
      case EntityCategory.PROFESSIONALS: return 'bg-blue-100 text-blue-800 border-blue-200';
      case EntityCategory.COMPANIES: return 'bg-green-100 text-green-800 border-green-200';
      case EntityCategory.PLACES: return 'bg-purple-100 text-purple-800 border-purple-200';
      case EntityCategory.PRODUCTS: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleReactionChange = async (reaction: string | null) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (reaction) {
        result = await reviewService.addOrUpdateReaction(review.id, reaction);
      } else {
        result = await reviewService.removeReaction(review.id);
      }

      if (result) {
        setLocalReactions(result.reactions || {});
        setLocalUserReaction(result.user_reaction || undefined);
        setTopReactions(result.top_reactions || []);
        setTotalReactions(result.total || 0);
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentAdd = async (content: string, parentId?: string) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      const newComment = await commentService.createComment(review.id, { content, parentId });
      setLocalReview(prev => ({
        ...prev,
        comments: [...(prev.comments || []), newComment]
      }));
      setCommentCount(prev => prev + 1);
      
      // Update parent component's comment count
      onCommentCountIncrement?.();
      
      onCommentAdd?.(review.id, content, parentId);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      await commentService.deleteComment(review.id, commentId);
      setLocalReview(prev => ({
        ...prev,
        comments: (prev.comments || []).filter(c => c.id !== commentId)
      }));
      setCommentCount(prev => Math.max(0, prev - 1));
      
      // Update parent component's comment count
      onCommentCountDecrement?.();
      
      onCommentDelete?.(review.id, commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleCommentReaction = async (commentId: string, reaction: string | null) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (reaction) {
        await commentService.addOrUpdateReaction(commentId, reaction);
      } else {
        await commentService.removeReaction(commentId);
      }
      onCommentReaction?.(review.id, commentId, reaction);
    } catch (error) {
      console.error('Failed to update comment reaction:', error);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (localReview.reviewerId && localReview.reviewerName !== 'Anonymous') {
      navigate(`/profile/${localReview.reviewerId}`);
    }
  };

  const entityInfo = entity || localReview.entity;
  const entityName = entityInfo?.name || 'Unknown Entity';
  const entityCategory = entityInfo ? (entityInfo as Entity).category : localReview.category;
  const entityAvgRating = entityInfo && 'average_rating' in entityInfo ? entityInfo.average_rating : 
                         (entityInfo as Entity)?.averageRating || 0;
  const reviewCount = entityInfo && 'review_count' in entityInfo ? entityInfo.review_count : 
                     (entityInfo as Entity)?.reviewCount || 0;
  const entityIsVerified = entityInfo && ('isVerified' in entityInfo ? entityInfo.isVerified : false);
  const entityIsClaimed = entityInfo && ('isClaimed' in entityInfo ? entityInfo.isClaimed : false);
  const entityAvatar = (entityInfo as Entity)?.avatar;
  const entityImageUrl = (entityInfo as Entity)?.imageUrl;

  const formattedDate = localReview.createdAt ? new Date(localReview.createdAt).toLocaleDateString() : '';
  const timeAgo = localReview.createdAt ? formatTimeAgo(new Date(localReview.createdAt)) : '';
  const highlights: string[] = Array.isArray(localReview.pros) && localReview.pros.length > 0 ? localReview.pros : ['Participation matters', 'Inspirational', 'Group projects'];

  if (!open) return null;

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
          padding: '20px',
          boxSizing: 'border-box',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div style={{
          background: 'white',
          borderRadius: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.08)',
          width: '90%',
          maxWidth: 672,
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(0,0,0,0.08)',
          position: 'fixed',
          top: '50vh',
          left: '50vw',
          transform: 'translate(-50%, -50%)',
          zIndex: 100000,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            padding: '24px 32px 16px 32px',
            position: 'sticky',
            top: 0,
            background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
            zIndex: 100,
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{ 
              fontWeight: 700, 
              fontSize: 22, 
              color: '#1a1a1a',
              letterSpacing: '-0.02em'
            }}>Review Details</span>
            <button
              style={{
                color: '#666',
                fontSize: 24,
                fontWeight: 400,
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: 12,
                width: 40,
                height: 40,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 101,
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
              onClick={handleClose}
              aria-label="Close"
              onMouseOver={e => {
                e.currentTarget.style.background = '#e9ecef';
                e.currentTarget.style.color = '#333';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.color = '#666';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '32px',
            background: '#fafbfc'
          }}>
            {/* Review Content */}
            <div className="space-y-6">
              {/* Main Review Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              {/* Reviewer Info - Moved to top like review cards */}
              <div 
                className={`flex items-center gap-3 ${localReview.reviewerId && localReview.reviewerName !== 'Anonymous' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={localReview.reviewerId && localReview.reviewerName !== 'Anonymous' ? handleUserClick : undefined}
                title={localReview.reviewerId && localReview.reviewerName !== 'Anonymous' ? `View ${localReview.reviewerName}'s profile` : undefined}
              >
                {localReview.reviewerAvatar ? (
                  <img 
                    src={localReview.reviewerAvatar} 
                    alt={localReview.reviewerName} 
                    className={`w-12 h-12 rounded-full object-cover border border-gray-200 ${localReview.reviewerId && localReview.reviewerName !== 'Anonymous' ? 'hover:border-blue-300 transition-colors' : ''}`}
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg ${localReview.reviewerId && localReview.reviewerName !== 'Anonymous' ? 'hover:shadow-md transition-shadow' : ''}`}>
                    {localReview.reviewerName ? localReview.reviewerName.split(' ').map(n => n[0]).join('').slice(0,2) : 'U'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className={`font-semibold text-lg text-gray-900 ${localReview.reviewerId && localReview.reviewerName !== 'Anonymous' ? 'hover:text-blue-600 transition-colors' : ''}`}>{localReview.reviewerName || 'Anonymous'}</span>
                  <span className="text-sm text-gray-500">{timeAgo} • {formattedDate}</span>
                </div>
              </div>

              {/* Entity Info - Moved below user info like review cards */}
              {entityInfo && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  {entityAvatar || entityImageUrl ? (
                    <img 
                      src={entityAvatar || entityImageUrl} 
                      alt={entityName} 
                      className="rounded-lg object-cover border-2 border-white shadow-md"
                      style={{ width: '198px', height: '132px' }}
                    />
                  ) : (
                    <div 
                      className="rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-700 font-bold text-3xl shadow-md"
                      style={{ width: '198px', height: '132px' }}
                    >
                      {entityName.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-xl font-bold text-blue-600">{entityName}</h2>
                      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getCategoryColor(entityCategory)}`}>
                        {getCategoryIcon(entityCategory)}
                        <span className="capitalize ml-1">{typeof entityCategory === 'string' ? entityCategory.replace('_', ' ') : 'Unknown'}</span>
                      </span>
                      {entityIsVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                      {entityIsClaimed && <ClaimedBadge />}
                    </div>
                    {entityAvgRating > 0 && (reviewCount || 0) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Average Rating:</span>
                        <StarRating rating={entityAvgRating} size="sm" showValue={false} />
                        <span className="font-medium">{entityAvgRating.toFixed(1)}</span>
                        <span>({reviewCount || 0} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Unified Review Content */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                {/* Review Title */}
                {localReview.title && (
                  <div className="mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">{localReview.title}</h3>
                    </div>
                  </div>
                )}

                {/* Overall Rating */}
                <div className="mb-5 pb-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                        <span className="text-base text-blue-700 font-medium">Overall Score:</span>
                        <StarRating rating={localReview.overallRating} size="lg" showValue={true} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Content */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{localReview.content}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* OVERALL EVALUATION & PROS/CONS */}
              {console.log('🎯 ReviewDetailModal passing to ReviewCardSubRatings:', {
                reviewId: localReview.id,
                reviewRatings: localReview.ratings,
                reviewCriteria: localReview.criteria,
                finalSubRatings: localReview.ratings || localReview.criteria || {},
                hasValidRatings: localReview.ratings && Object.keys(localReview.ratings).length > 0,
                hasValidCriteria: localReview.criteria && Object.keys(localReview.criteria).length > 0
              })}
              <ReviewCardSubRatings 
                subRatings={localReview.ratings || localReview.criteria || {}} 
                pros={localReview.pros}
                cons={localReview.cons}
                showAllProsAndCons={true}
              />

              {/* Review Images */}
              {localReview.images && localReview.images.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Review Images
                  </h4>
                  <ReviewImages images={localReview.images} maxColumns={3} />
                </div>
              )}

              {/* Reactions */}
              <div className="border-t pt-4">
                <SocialReactionButton
                  reactions={localReactions}
                  userReaction={localUserReaction}
                  onReactionChange={handleReactionChange}
                  isAuthenticated={isAuthenticated}
                  onRequireAuth={() => setShowAuthModal(true)}
                />
              </div>
              </div>

              {/* Comments Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="border-t pt-4">
                {/* Comments Header with Sort */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h4 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Comments ({commentCount})
                  </h4>
                  
                  {/* Sort Dropdown - Always Visible */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
                    <div className="relative" ref={sortMenuRef}>
                      <button
                        onClick={() => setShowSortMenu(!showSortMenu)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg transition-all duration-200 border-2 border-blue-600 shadow-md hover:shadow-lg min-w-[160px]"
                        style={{ zIndex: 1 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                        <span className="flex-1 text-left">{SORT_OPTIONS.find(opt => opt.key === commentSort)?.label || 'Most relevant'}</span>
                        {showSortMenu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {showSortMenu && (
                        <div 
                          className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                          style={{ zIndex: 99999 }}
                        >
                          <div className="py-1">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                              📱 Sort Comments (Facebook Style)
                            </div>
                            {SORT_OPTIONS.map(option => (
                              <button
                                key={option.key}
                                onClick={() => {
                                  setShowSortMenu(false);
                                  setCommentSort(option.key);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 transition-colors ${commentSort === option.key ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${commentSort === option.key ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                    {commentSort === option.key && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${commentSort === option.key ? 'text-blue-700' : 'text-gray-900'}`}>
                                      {option.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                                      {option.description}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Current sort indicator */}
                <div className="flex items-center space-x-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-1">
                    {commentSort === 'most_relevant' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {commentSort === 'newest' && <Clock className="w-4 h-4 text-blue-600" />}
                    {commentSort === 'all' && <MessageCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Sorting by:</span> {SORT_OPTIONS.find(opt => opt.key === commentSort)?.description}
                  </p>
                </div>
                
                <ReviewComments
                  reviewId={localReview.id}
                  initialCommentCount={5}
                  entityName={entityInfo?.name}
                  allowCompanyReply={entityCategory === EntityCategory.COMPANIES}
                  sortBy={commentSort === 'all' ? 'newest' : commentSort as 'newest' | 'oldest' | 'most_relevant' | 'most_liked'}
                  onCommentAdd={handleCommentAdd}
                  onCommentDelete={handleCommentDelete}
                  onCommentReaction={handleCommentReaction}
                />
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setIsAuthenticated(true)}
      />
    </>,
    document.body
  );
};

export default ReviewDetailModal; 