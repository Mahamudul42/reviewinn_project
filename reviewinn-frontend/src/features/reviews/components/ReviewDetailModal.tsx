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
import ReviewImages from '../../../shared/molecules/ReviewImages';
import ClaimedBadge from '../../../shared/molecules/ClaimedBadge';
import { normalizeEntityCategoryData } from '../../../shared/utils/categoryDisplayUtils';

interface ReviewDetailModalProps {
  review: Review;
  entity?: Entity;
  open: boolean;
  onClose: () => void; // Keep camelCase for external API
  onReviewUpdate?: (updatedReview: Review) => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  // Comment count management callbacks
  onCommentCountUpdate?: (count: number) => void;
  onCommentCountIncrement?: () => void;
  onCommentCountDecrement?: () => void;
  onRefreshCommentCount?: () => Promise<number>;
  // View count management callbacks
  onViewCountUpdate?: (count: number) => void;
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
  onRefreshCommentCount,
  onViewCountUpdate
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useUnifiedAuth();
  const [local_review, set_local_review] = useState<Review>(review);
  const [local_reactions, set_local_reactions] = useState<Record<string, number>>(review.reactions || {});
  const [local_user_reaction, set_local_user_reaction] = useState<string | undefined>(review.user_reaction);
  const [top_reactions, set_top_reactions] = useState<any[]>(review.top_reactions || []);
  const [total_reactions, set_total_reactions] = useState<number>(review.total_reactions || 0);
  const [show_auth_modal, set_show_auth_modal] = useState(false);
  const [is_loading, set_is_loading] = useState(false);
  const [comment_sort, set_comment_sort] = useState('most_relevant');
  const [show_sort_menu, set_show_sort_menu] = useState(false);
  const [comment_count, set_comment_count] = useState(review.comment_count || 0);
  const [view_count, set_view_count] = useState(review.view_count || 0);
  const sort_menu_ref = React.useRef<HTMLDivElement>(null);

  // Update local state when review prop changes
  useEffect(() => {
    set_local_review(review);
    set_local_reactions(review.reactions || {});
    set_local_user_reaction(review.user_reaction);
    set_top_reactions(review.top_reactions || []);
    set_total_reactions(review.total_reactions || 0);
    set_comment_count(review.comment_count || 0);
    set_view_count(review.view_count || 0);
  }, [review]);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handle_close();
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
  const handle_close = () => {
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
    const handle_click_outside = (event: MouseEvent) => {
      if (sort_menu_ref.current && !sort_menu_ref.current.contains(event.target as Node)) {
        set_show_sort_menu(false);
      }
    };
    document.addEventListener('mousedown', handle_click_outside);
    return () => document.removeEventListener('mousedown', handle_click_outside);
  }, []);

  // Load comment count when modal opens (only if not provided in review data)
  useEffect(() => {
    if (open && (review.comment_count === undefined || review.comment_count === null)) {
      const load_comment_count = async () => {
        try {
          const review_id = String(local_review.review_id || local_review.id);
          const count = await commentService.getCommentCount(review_id);
          set_comment_count(count);
        } catch (error) {
          console.error('Failed to load comment count:', error);
          set_comment_count(0);
        }
      };
      load_comment_count();
    }
  }, [open, local_review.id, review.comment_count]);

  const get_category_icon = (category: EntityCategory) => {
    switch (category) {
      case EntityCategory.PROFESSIONALS: return <User className="w-4 h-4" />;
      case EntityCategory.COMPANIES: return <Building className="w-4 h-4" />;
      case EntityCategory.PLACES: return <MapPin className="w-4 h-4" />;
      case EntityCategory.PRODUCTS: return <Package className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const get_category_color = (category: EntityCategory) => {
    switch (category) {
      case EntityCategory.PROFESSIONALS: return 'bg-blue-100 text-blue-800 border-blue-200';
      case EntityCategory.COMPANIES: return 'bg-green-100 text-green-800 border-green-200';
      case EntityCategory.PLACES: return 'bg-purple-100 text-purple-800 border-purple-200';
      case EntityCategory.PRODUCTS: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const format_time_ago = (date: Date) => {
    const now = new Date();
    const diff_in_seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff_in_seconds < 60) return 'just now';
    if (diff_in_seconds < 3600) return `${Math.floor(diff_in_seconds / 60)}m ago`;
    if (diff_in_seconds < 86400) return `${Math.floor(diff_in_seconds / 3600)}h ago`;
    if (diff_in_seconds < 2592000) return `${Math.floor(diff_in_seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handle_reaction_change = async (reaction: string | null) => {
    if (!isAuthenticated) {
      set_show_auth_modal(true);
      return;
    }

    set_is_loading(true);
    try {
      let result;
      const review_id = String(local_review.review_id || local_review.id);
      if (reaction) {
        result = await reviewService.addOrUpdateReaction(review_id, reaction);
      } else {
        result = await reviewService.removeReaction(review_id);
      }

      if (result) {
        set_local_reactions(result.reactions || {});
        set_local_user_reaction(result.user_reaction || undefined);
        set_top_reactions(result.top_reactions || []);
        set_total_reactions(result.total_reactions || result.total || 0);
        
        // Update parent component with the updated review data
        if (onReviewUpdate) {
          const updatedReview = {
            ...local_review,
            reactions: result.reactions || {},
            user_reaction: result.user_reaction || undefined,
            top_reactions: result.top_reactions || [],
            total_reactions: result.total_reactions || result.total || 0,
            reaction_count: result.total_reactions || result.total || 0
          };
          onReviewUpdate(updatedReview);
        }
      }
    } catch (error) {
      console.error('Failed to update reaction:', error);
    } finally {
      set_is_loading(false);
    }
  };

  const handle_comment_add = async (content: string, parent_id?: string) => {
    if (!isAuthenticated) {
      set_show_auth_modal(true);
      return;
    }

    try {
      const review_id = String(local_review.review_id || local_review.id);
      const new_comment = await commentService.createComment(review_id, { content });
      set_local_review(prev => ({
        ...prev,
        comments: [...(prev.comments || []), new_comment]
      }));
      const new_count = comment_count + 1;
      set_comment_count(new_count);
      
      // Update parent component's comment count
      onCommentCountIncrement?.();
      onCommentCountUpdate?.(new_count);
      
      onCommentAdd?.(review_id, content, parent_id);
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handle_comment_delete = async (comment_id: string) => {
    try {
      const review_id = String(local_review.review_id || local_review.id);
      await commentService.deleteComment(review_id, comment_id);
      set_local_review(prev => ({
        ...prev,
        comments: (prev.comments || []).filter(c => c.id !== comment_id)
      }));
      const new_count = Math.max(0, comment_count - 1);
      set_comment_count(new_count);
      
      // Update parent component's comment count
      onCommentCountDecrement?.();
      onCommentCountUpdate?.(new_count);
      
      onCommentDelete?.(review_id, comment_id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handle_comment_reaction = async (comment_id: string, reaction: string | null) => {
    if (!isAuthenticated) {
      set_show_auth_modal(true);
      return;
    }

    try {
      if (reaction) {
        await commentService.addOrUpdateReaction(comment_id, reaction);
      } else {
        await commentService.removeReaction(comment_id);
      }
      const review_id = String(local_review.review_id || local_review.id);
      onCommentReaction?.(review_id, comment_id, reaction);
    } catch (error) {
      console.error('Failed to update comment reaction:', error);
    }
  };

  // View count update handler
  const handle_view_count_update = (new_count: number) => {
    set_view_count(new_count);
    // Update parent component's view count
    onViewCountUpdate?.(new_count);
  };

  const handle_user_click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const user_id = local_review.user_id || local_review.reviewerId;
    const user_name = local_review.user_summary?.name || local_review.reviewerName;
    if (user_id && user_name !== 'Anonymous') {
      navigate(`/profile/${user_id}`);
    }
  };

  const entity_info = entity || local_review.entity || local_review.entity_summary;
  const entity_name = entity_info?.name || local_review.entity_summary?.name || 'Unknown Entity';
  const entity_category = EntityCategory.COMPANIES; // Default category
  const entity_avg_rating = entity_info && 'average_rating' in entity_info ? entity_info.average_rating : 
                         (entity_info as Entity)?.averageRating || local_review.entity_summary?.average_rating || 0;
  const review_count = entity_info && 'review_count' in entity_info ? entity_info.review_count : 
                     (entity_info as Entity)?.reviewCount || local_review.entity_summary?.review_count || 0;
  const entity_is_verified = entity_info && ('isVerified' in entity_info ? entity_info.isVerified : local_review.entity_summary?.is_verified || false);
  const entity_is_claimed = entity_info && ('isClaimed' in entity_info ? entity_info.isClaimed : local_review.entity_summary?.is_claimed || false);
  const entity_avatar = (entity_info as Entity)?.avatar || local_review.entity_summary?.avatar;
  const entity_image_url = (entity_info as Entity)?.imageUrl || local_review.entity_summary?.image_url;

  // Get hierarchical category information for breadcrumb
  const { categoryBreadcrumb, categoryDisplay, rootCategory, finalCategory } = normalizeEntityCategoryData(entity_info);

  const formatted_date = local_review.created_at || local_review.createdAt ? new Date(local_review.created_at || local_review.createdAt).toLocaleDateString() : '';
  const time_ago = local_review.created_at || local_review.createdAt ? format_time_ago(new Date(local_review.created_at || local_review.createdAt)) : '';
  const highlights: string[] = Array.isArray(local_review.pros) && local_review.pros.length > 0 ? local_review.pros : ['Participation matters', 'Inspirational', 'Group projects'];

  if (!open) return null;

  // Calculate the current viewport center dynamically
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(800, viewportHeight * 0.9);
  const modalWidth = Math.min(672, viewportWidth * 0.9); // Match middle panel max-w-2xl
  
  const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
  const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

  return createPortal(
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: Math.max(document.documentElement.scrollHeight, viewportHeight),
          zIndex: 99999,
          background: 'rgba(0,0,0,0.5)',
          pointerEvents: 'auto',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handle_close();
          }
        }}
      >
        <div 
          className="modal-container"
          style={{
            position: 'absolute',
            top: `${centerTop}px`,
            left: `${centerLeft}px`,
            width: `${modalWidth}px`,
            maxHeight: `${modalHeight}px`,
            background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', // Match homepage gradient
            borderRadius: 16, // Match homepage panel border radius
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // Enhanced shadow to match homepage
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e5e7eb', // Match homepage panel border
            zIndex: 100000,
          }}
        >
          {/* Responsive CSS & Scrollbar Styling */}
          <style>{`
            @media (max-width: 640px) {
              .modal-container {
                width: calc(100vw - 40px) !important;
                max-width: calc(100vw - 40px) !important;
              }
            }
            
            /* Facebook-style scrollbar for modal content */
            .modal-content {
              scrollbar-width: thin;
              scrollbar-color: transparent transparent;
              transition: scrollbar-color 0.2s ease;
            }
            
            .modal-content:hover {
              scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
            }
            
            .modal-content::-webkit-scrollbar {
              width: 6px;
              background: transparent;
            }
            
            .modal-content::-webkit-scrollbar-track {
              background: transparent;
              margin: 2px;
            }
            
            .modal-content::-webkit-scrollbar-thumb {
              background: transparent;
              border-radius: 10px;
              border: 1px solid transparent;
              background-clip: content-box;
              transition: all 0.2s ease;
              min-height: 20px;
            }
            
            .modal-content:hover::-webkit-scrollbar-thumb {
              background: rgba(0, 0, 0, 0.15);
              background-clip: content-box;
            }
            
            .modal-content::-webkit-scrollbar-thumb:hover {
              background: rgba(0, 0, 0, 0.25) !important;
              background-clip: content-box;
            }
            
            .modal-content::-webkit-scrollbar-thumb:active {
              background: rgba(0, 0, 0, 0.4) !important;
              background-clip: content-box;
            }
          `}</style>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e7eb', // Match homepage panel border
            padding: '20px', // Match homepage panel padding
            position: 'sticky',
            top: 0,
            background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)', // Match homepage gradient header
            zIndex: 100,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600, // Slightly less bold to match homepage
              fontSize: 18, // Match homepage panel title size
              color: '#1f2937', // Match homepage text color
            }}>
              <div style={{
                background: '#3b82f6',
                borderRadius: '50%',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              Review Details
            </div>
            <button
              style={{
                color: '#6b7280',
                fontSize: 20,
                fontWeight: 400,
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 101,
                transition: 'all 0.2s ease',
              }}
              onClick={handle_close}
              aria-label="Close"
              onMouseOver={e => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div 
            className="modal-content"
            style={{ 
              flex: 1, 
              overflow: 'auto', 
              padding: '20px', // Match homepage panel padding
              background: 'white' // Match homepage panel background
            }}
          >
            {/* Review Content */}
            <div className="space-y-6">
              {/* Main Review Card */}
              <div className="space-y-6">
              {/* Reviewer Info - Moved to top like review cards */}
              <div 
                className={`flex items-center gap-3 ${(local_review.user_id || local_review.reviewerId) && (local_review.user_summary?.name || local_review.reviewerName) !== 'Anonymous' ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                onClick={(local_review.user_id || local_review.reviewerId) && (local_review.user_summary?.name || local_review.reviewerName) !== 'Anonymous' ? handle_user_click : undefined}
                title={(local_review.user_id || local_review.reviewerId) && (local_review.user_summary?.name || local_review.reviewerName) !== 'Anonymous' ? `View ${local_review.user_summary?.name || local_review.reviewerName}'s profile` : undefined}
              >
                {(local_review.user_summary?.avatar || local_review.reviewerAvatar) ? (
                  <img 
                    src={local_review.user_summary?.avatar || local_review.reviewerAvatar} 
                    alt={local_review.user_summary?.name || local_review.reviewerName} 
                    className={`w-12 h-12 rounded-full object-cover border border-gray-200 ${(local_review.user_id || local_review.reviewerId) && (local_review.user_summary?.name || local_review.reviewerName) !== 'Anonymous' ? 'hover:border-blue-300 transition-colors' : ''}`}
                  />
                ) : (
                  <div className={`w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg ${(local_review.user_id || local_review.reviewerId) && (local_review.user_summary?.name || local_review.reviewerName) !== 'Anonymous' ? 'hover:shadow-md transition-shadow' : ''}`}>
                    {(local_review.user_summary?.name || local_review.reviewerName) ? (local_review.user_summary?.name || local_review.reviewerName).split(' ').map((n: string) => n[0]).join('').slice(0,2) : 'U'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className={`font-semibold text-lg text-gray-900 ${(local_review.user_id || local_review.reviewerId) && (local_review.user_summary?.name || local_review.reviewerName) !== 'Anonymous' ? 'hover:text-blue-600 transition-colors' : ''}`}>{local_review.user_summary?.name || local_review.reviewerName || 'Anonymous'}</span>
                  <span className="text-sm text-gray-500">{time_ago} • {formatted_date}</span>
                </div>
              </div>

              {/* Entity Info - Moved below user info like review cards */}
              {entity_info && (
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  {entity_avatar || entity_image_url ? (
                    <img 
                      src={entity_avatar || entity_image_url} 
                      alt={entity_name} 
                      className="rounded-lg object-cover border-2 border-white shadow-md"
                      style={{ width: '198px', height: '132px' }}
                    />
                  ) : (
                    <div 
                      className="rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-700 font-bold text-3xl shadow-md"
                      style={{ width: '198px', height: '132px' }}
                    >
                      {entity_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col flex-1">
                    {/* Title and Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h2 className="text-xl font-bold text-blue-600">{entity_name}</h2>
                      
                      {/* Verification Badge */}
                      {entity_is_verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}

                      {/* Claimed Badge */}
                      {entity_is_claimed && <ClaimedBadge />}
                    </div>
                    
                    {/* Category Breadcrumb - Match Homepage Design */}
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {/* Root Category */}
                        {rootCategory && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200">
                            <span className="text-sm mr-1">{rootCategory.icon || '📁'}</span>
                            {rootCategory.name}
                          </span>
                        )}
                        
                        {/* Separator arrow if both categories exist */}
                        {rootCategory && finalCategory && finalCategory.id !== rootCategory?.id && (
                          <span className="text-gray-400 text-xs">→</span>
                        )}
                        
                        {/* Final Category */}
                        {finalCategory && finalCategory.id !== rootCategory?.id && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200 shadow-sm hover:shadow-md transition-all duration-200">
                            <span className="text-sm mr-1">{finalCategory.icon || '🏷️'}</span>
                            {finalCategory.name}
                          </span>
                        )}
                        
                        {/* Show only final category if it's the same as root */}
                        {finalCategory && finalCategory.id === rootCategory?.id && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-200 shadow-sm hover:shadow-md transition-all duration-200">
                            <span className="text-sm mr-1">{finalCategory.icon || '🏷️'}</span>
                            {finalCategory.name}
                          </span>
                        )}
                        
                        {/* Fallback to legacy category display if no hierarchical data */}
                        {!rootCategory && !finalCategory && (
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${get_category_color(entity_category)}`}>
                            {get_category_icon(entity_category)}
                            <span className="capitalize ml-1">{typeof entity_category === 'string' ? entity_category.replace('_', ' ') : 'Unknown'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Rating Info */}
                    {entity_avg_rating > 0 && (review_count || 0) > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>Average Rating:</span>
                        <StarRating rating={entity_avg_rating} size="sm" showValue={false} />
                        <span className="font-medium">{entity_avg_rating.toFixed(1)}</span>
                        <span>({review_count || 0} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Unified Review Content */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                {/* Review Title */}
                {local_review.title && (
                  <div className="mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">{local_review.title}</h3>
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
                        <StarRating rating={local_review.overall_rating || local_review.overallRating} size="lg" showValue={true} />
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
                      <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{local_review.content}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* OVERALL EVALUATION & PROS/CONS */}
              <ReviewCardSubRatings 
                subRatings={local_review.ratings || local_review.criteria || {}} 
                pros={local_review.pros}
                cons={local_review.cons}
                showAllProsAndCons={true}
              />

              {/* Review Images */}
              {local_review.images && local_review.images.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Review Images
                  </h4>
                  <ReviewImages images={local_review.images} maxColumns={3} />
                </div>
              )}

              {/* Review Stats & Reactions - Match Homepage Style */}
              <div className="border-t pt-4 space-y-4">
                {/* Summary Bar - Exact match to ReviewCardActions */}
                <div className="flex items-center justify-between mb-2 px-2 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4 w-full justify-between">
                    {/* Reactions */}
                    <div className="flex items-center gap-2 min-w-0">
                      {Object.entries(local_reactions || {}).filter(([_, count]) => count > 0).length > 0 && (
                        <div className="flex gap-0.5">
                          {Object.entries(local_reactions || {})
                            .filter(([_, count]) => count > 0)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 3)
                            .map(([reaction_name], index) => (
                              <span
                                key={`${reaction_name}-${index}`}
                                className="text-lg align-middle"
                              >
                                {reaction_name === 'thumbs_up' ? '👍' :
                                 reaction_name === 'thumbs_down' ? '👎' :
                                 reaction_name === 'bomb' ? '💣' :
                                 reaction_name === 'love' ? '❤️' :
                                 reaction_name === 'haha' ? '😂' :
                                 reaction_name === 'celebration' ? '🎉' :
                                 reaction_name === 'sad' ? '😢' :
                                 reaction_name === 'eyes' ? '👀' : '👍'}
                              </span>
                            ))}
                        </div>
                      )}
                      <span className="text-sm text-gray-700 font-semibold">
                        {total_reactions} reaction{total_reactions !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Comments */}
                    <div className="flex items-center gap-1 min-w-0">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        {comment_count} comment{comment_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Views */}
                    <div className="flex items-center gap-1 min-w-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm text-gray-600 font-medium">
                        {view_count} view{view_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Social Reactions */}
                <SocialReactionButton
                  reactions={local_reactions}
                  userReaction={local_user_reaction}
                  onReactionChange={handle_reaction_change}
                  onRequireAuth={() => set_show_auth_modal(true)}
                />
              </div>

              {/* Comments Section */}
              <div className="border-t mt-6 pt-6">
                {/* Comments Header with Sort */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-xl text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                      </div>
                      Comments & Discussions
                      <span className="bg-blue-600 text-white text-sm font-medium px-3 py-1 rounded-full">
                        {comment_count}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 mt-2 ml-12">
                      Join the conversation and share your thoughts about this review
                    </p>
                  </div>
                  
                  {/* Sort Dropdown - Always Visible */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
                    <div className="relative" ref={sort_menu_ref}>
                      <button
                        onClick={() => set_show_sort_menu(!show_sort_menu)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg transition-all duration-200 border-2 border-blue-600 shadow-md hover:shadow-lg min-w-[160px]"
                        style={{ zIndex: 1 }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                        </svg>
                        <span className="flex-1 text-left">{SORT_OPTIONS.find(opt => opt.key === comment_sort)?.label || 'Most relevant'}</span>
                        {show_sort_menu ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      
                      {show_sort_menu && (
                        <div 
                          className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                          style={{ zIndex: 99999 }}
                        >
                          <div className="py-1">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-100 bg-gray-50">
                              📱 Sort Comments
                            </div>
                            {SORT_OPTIONS.map(option => (
                              <button
                                key={option.key}
                                onClick={() => {
                                  set_show_sort_menu(false);
                                  set_comment_sort(option.key);
                                }}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 transition-colors ${comment_sort === option.key ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${comment_sort === option.key ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                    {comment_sort === option.key && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${comment_sort === option.key ? 'text-blue-700' : 'text-gray-900'}`}>
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
                    {comment_sort === 'most_relevant' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {comment_sort === 'newest' && <Clock className="w-4 h-4 text-blue-600" />}
                    {comment_sort === 'all' && <MessageCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Sorting by:</span> {SORT_OPTIONS.find(opt => opt.key === comment_sort)?.description}
                  </p>
                </div>
                
                {/* Enhanced Comments Container */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mt-4">
                  <div className="border-l-4 border-blue-500 pl-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                      </svg>
                      Community Engagement
                    </div>
                    <p className="text-gray-600 text-sm">
                      Share your thoughts, ask questions, and engage with other reviewers
                    </p>
                  </div>
                  
                  <ReviewComments
                    reviewId={String(local_review.review_id || local_review.id)}
                    initialCommentCount={5}
                    entityName={entity_info?.name}
                    allowCompanyReply={entity_category === EntityCategory.COMPANIES}
                    sortBy={comment_sort === 'all' ? 'newest' : comment_sort as 'newest' | 'oldest' | 'most_relevant' | 'most_liked'}
                    onCommentAdd={handle_comment_add}
                    onCommentDelete={handle_comment_delete}
                    onCommentReaction={handle_comment_reaction}
                  />
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={show_auth_modal} 
        onClose={() => set_show_auth_modal(false)}
        onSuccess={() => {}}
      />
    </>,
    document.body
  );
};

export default ReviewDetailModal; 