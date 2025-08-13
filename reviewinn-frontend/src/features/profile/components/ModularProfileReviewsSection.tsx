import React, { useRef } from 'react';
import { MessageSquare, Plus, Eye } from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import LoadingSpinner from '../../../shared/atoms/LoadingSpinner';
import ReviewFeedCard from '../../reviews/components/ReviewFeedCard';
import type { Review, Entity } from '../../../types';

// Removed old ReviewCard and DropdownMenu components - using ReviewFeedCard instead

interface ProfileReviewsSectionProps {
  reviews: Review[];
  entities: Entity[]; // Full entities array like homepage
  isCurrentUser: boolean;
  userName: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onAddReview?: () => void;
  // New props for consistent stats handling
  onReactionChange?: (reviewId: string, reaction: string | null) => void;
  onCommentAdd?: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete?: (reviewId: string, commentId: string) => void;
  onCommentReaction?: (reviewId: string, commentId: string, reaction: string | null) => void;
  // Removed dropdown props - ReviewFeedCard handles its own actions
  className?: string;
  showAddButton?: boolean;
  showActions?: boolean;
  customTitle?: string;
  customEmptyMessage?: string;
  layout?: 'grid' | 'list';
  maxColumns?: number;
}

const ProfileReviewsSection: React.FC<ProfileReviewsSectionProps> = ({
  reviews,
  entities,
  isCurrentUser,
  userName,
  isLoading,
  hasMore,
  onLoadMore,
  onAddReview,
  onReactionChange,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  className = '',
  showAddButton = true,
  showActions = true,
  customTitle,
  customEmptyMessage,
  layout = 'list',
  maxColumns = 2
}) => {
  const getGridClass = () => {
    if (layout === 'grid') {
      return maxColumns === 1 ? 'grid grid-cols-1 gap-6' :
             maxColumns === 2 ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' :
             'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
    return 'space-y-6';
  };

  return (
    <div className={`bg-white border-2 border-gray-200 shadow-xl rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 hover:border-gray-300 ${className}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {customTitle || 'Recent Reviews'}
            </h2>
            <p className="text-gray-600">
              {isCurrentUser ? 'Your latest reviews' : `Latest reviews from ${userName}`}
            </p>
          </div>
        </div>
        
        {isCurrentUser && showAddButton && onAddReview && (
          <Button 
            onClick={onAddReview}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Write Review
          </Button>
        )}
      </div>


      {/* Reviews Content */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Yet</h4>
          <p className="text-gray-600 mb-6">
            {customEmptyMessage || (isCurrentUser 
              ? "You haven't written any reviews yet. Share your experiences!"
              : "This user hasn't written any reviews yet."
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-6">
            {reviews.map((review) => (
              <ReviewFeedCard
                key={review.id}
                review={review}
                entity={review.entity} // Use entity data directly from review - no need to search in entities array
                hideEntityInfo={false}
                showFullContent={false}
                isShareable={true}
                onReactionChange={onReactionChange}
                onCommentAdd={onCommentAdd}
                onCommentDelete={onCommentDelete}
                onCommentReaction={onCommentReaction}
              />
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <Button
                onClick={onLoadMore}
                disabled={isLoading}
                variant="outline"
                className="px-8 py-3 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Load More Reviews
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileReviewsSection;