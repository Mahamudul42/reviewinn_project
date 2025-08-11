// Remove all unused imports and variables as described

import React, { useState, useEffect, useRef } from 'react';
import SocialReactionButton from '../../../shared/molecules/SocialReactionButton';
import { MessageCircle, Eye, ThumbsUp, Share2, Bookmark, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { sharingService } from '../../../api/services/sharingService';
import { useConfirmation } from '../../../shared/components/ConfirmationSystem';
import ReviewImageShareModal from './ReviewImageShareModal';
import type { Review, Entity } from '../../../types';

interface ReviewCardActionsProps {
  reactions: Record<string, number>;
  userReaction?: string;
  onReactionChange: (reaction: string | null) => Promise<void>;
  commentCount?: number;
  views?: number;
  onCommentClick?: (e?: React.MouseEvent) => void;
  onGiveReviewClick?: () => void;
  topReactions?: { type: string; count: number }[];
  totalReactions?: number;
  showAuthModal?: boolean;
  setShowAuthModal?: (open: boolean) => void;
  reviewId?: string;
  reviewTitle?: string;
  entityName?: string;
  review?: Review;
  entity?: Entity;
}

const ReviewCardActions: React.FC<ReviewCardActionsProps> = ({
  reactions,
  userReaction,
  onReactionChange,
  commentCount = 0,
  views = 0,
  onCommentClick,
  onGiveReviewClick,
  topReactions,
  totalReactions,
  showAuthModal,
  setShowAuthModal,
  reviewId,
  reviewTitle,
  entityName,
  review,
  entity
}) => {
  const { isAuthenticated, requireAuth } = useUnifiedAuth();
  const { showSuccess, showError } = useConfirmation();
  const [showImageShareModal, setShowImageShareModal] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowShareDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Use new props if provided, else fallback to old logic
  const total = typeof totalReactions === 'number' ? totalReactions : Object.values(reactions).reduce((sum, count) => sum + count, 0);
  const top = Array.isArray(topReactions) && topReactions.length > 0
    ? topReactions.map(r => [r.type, r.count] as [string, number])
    : (() => {
        const uniqueReactions: [string, number][] = [];
        const seen = new Set<string>();
        Object.entries(reactions)
          .sort(([,a], [,b]) => b - a)
          .forEach(([reaction, count]) => {
            if (count > 0 && !seen.has(reaction)) {
              uniqueReactions.push([reaction, count]);
              seen.add(reaction);
            }
          });
        return uniqueReactions.slice(0, 3);
      })();

  const getReactionEmoji = (reactionName: string) => {
    switch (reactionName) {
      case 'thumbs_up': return '👍';
      case 'thumbs_down': return '👎';
      case 'bomb': return '💣';
      case 'love': return '❤️';
      case 'haha': return '😂';
      case 'celebration': return '🎉';
      case 'sad': return '😢';
      case 'eyes': return '👀';
      default: return '👍';
    }
  };

  const handleRequireAuth = () => {
    if (setShowAuthModal) {
      setShowAuthModal(true);
    } else {
      requireAuth();
    }
  };

  const handleShare = async () => {
    if (!reviewId) {
      showError('Unable to share this review');
      return;
    }

    try {
      const shareUrl = sharingService.generateReviewShareUrl(reviewId);
      const title = reviewTitle || `Review of ${entityName || 'this business'}`;
      const description = `Check out this review on our platform`;

      // Try native sharing first
      const success = await sharingService.shareNative({
        title,
        description,
        url: shareUrl
      });

      if (success) {
        showSuccess('Review shared successfully!');
        sharingService.trackShare('native', reviewId, true);
      }
    } catch (err) {
      console.error('Error sharing review:', err);
      showError('Failed to share review');
      if (reviewId) {
        sharingService.trackShare('native', reviewId, false);
      }
    }
  };

  const handleShareImage = () => {
    if (!review) {
      showError('Unable to generate image for this review');
      return;
    }
    setShowImageShareModal(true);
    setShowShareDropdown(false);
  };

  const handleShareLink = () => {
    handleShare();
    setShowShareDropdown(false);
  };

  const toggleShareDropdown = () => {
    setShowShareDropdown(!showShareDropdown);
  };

  return (
    <>
      <div className="pt-4">
        {/* Always show summary bar with reactions, comments, and views */}
        <div className="flex items-center justify-between mb-2 px-2 py-2 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4 w-full justify-between">
            {/* Reactions */}
            <div className="flex items-center gap-2 min-w-0">
              {top.length > 0 && (
                <div className="flex gap-0.5">
                  {top.map(([reactionName], index) => (
                    <span
                      key={`${reactionName}-${index}`}
                      className="text-lg align-middle"
                      style={{ zIndex: top.length - index }}
                    >
                      {getReactionEmoji(reactionName)}
                    </span>
                  ))}
                </div>
              )}
              <span className="text-sm text-gray-700 font-semibold">
                {total} reaction{total !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Comments */}
            <div className="flex items-center gap-1 min-w-0">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </span>
            </div>
            {/* Views */}
            <div className="flex items-center gap-1 min-w-0">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">
                {views} view{views !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
        {/* Modern action bar with fixed layout to prevent button shifting */}
        <div className="grid grid-cols-4 items-center w-full px-0 py-0 bg-white rounded-lg border border-gray-100 shadow-sm gap-2 mt-2">
          <div className="col-span-1">
            <SocialReactionButton
              reactions={reactions}
              userReaction={userReaction}
              onReactionChange={onReactionChange}
              onRequireAuth={handleRequireAuth}
            />
          </div>
          <button 
            onClick={(e) => onCommentClick?.(e)}
            className="col-span-1 flex items-center justify-center gap-2 h-12 px-3 rounded-md border border-blue-200 bg-blue-50 text-blue-700 font-semibold text-sm shadow-sm hover:bg-blue-100 hover:text-blue-800 hover:border-blue-300 hover:shadow-md focus:ring-2 focus:ring-blue-300 transition-all duration-200 transform hover:scale-[1.02] group/comment"
            title="Click to view and add comments"
          >
            <MessageCircle className="w-4 h-4 group-hover/comment:scale-110 transition-transform duration-200" />
            <span className="hidden sm:inline">Comments</span>
            <span className="sm:hidden">💬</span>
            <svg className="w-3 h-3 opacity-0 group-hover/comment:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          <button 
            onClick={onGiveReviewClick}
            className="col-span-1 flex items-center justify-center gap-2 h-12 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-700 font-semibold text-sm shadow-sm hover:bg-green-50 hover:text-green-700 focus:ring-2 focus:ring-green-200 transition-all duration-200"
          >
            <span className="text-lg">📝</span>
            <span className="hidden sm:inline">Give Review</span>
            <span className="sm:hidden">Review</span>
          </button>
          <div className="col-span-1 relative" ref={dropdownRef}>
            <button 
              onClick={toggleShareDropdown}
              className="w-full flex items-center justify-center gap-2 h-12 px-3 rounded-md border border-gray-200 bg-gray-50 text-gray-700 font-semibold text-sm shadow-sm hover:bg-purple-50 hover:text-purple-700 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
              title="Share this review"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
              <span className="sm:hidden">📤</span>
            </button>
            
            {/* Share options dropdown */}
            {showShareDropdown && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareLink();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Link</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareImage();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Share as Image</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Auth Modal is now handled by parent */}
      
      {/* Image Share Modal */}
      {review && (
        <ReviewImageShareModal
          isOpen={showImageShareModal}
          onClose={() => setShowImageShareModal(false)}
          review={review}
          entity={entity}
        />
      )}
    </>
  );
};

export default ReviewCardActions; 