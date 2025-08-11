import React, { useState } from 'react';
import { Edit3, Trash2, Settings, Shield, AlertTriangle } from 'lucide-react';
import type { Review } from '../../../types';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { useToast } from '../../../shared/components/ToastProvider';
import ReviewEditModal from './ReviewEditModal';
import ReviewDeleteModal from './ReviewDeleteModal';

interface ReviewManagementActionsProps {
  review: Review;
  onReviewUpdate?: (updatedReview: Review) => void;
  onReviewDelete?: () => void;
  className?: string;
}

const ReviewManagementActions: React.FC<ReviewManagementActionsProps> = ({
  review,
  onReviewUpdate,
  onReviewDelete,
  className = ''
}) => {
  const { showToast } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user: currentUser, isAuthenticated } = useUnifiedAuth();

  // Check if user has permission to manage this review
  const canManageReview = (): boolean => {
    if (!isAuthenticated || !currentUser) {
      return false;
    }

    // Admin users can manage any review
    if (currentUser.level >= 50) {
      return true;
    }

    // Review creators can manage their own reviews
    const userIdMatches = (
      review.reviewerId === currentUser.id || 
      String(review.reviewerId) === String(currentUser.id) ||
      review.userId === currentUser.id ||
      String(review.userId) === String(currentUser.id)
    );
    
    if (userIdMatches) {
      return true;
    }

    // High-level users can manage reviews
    if (currentUser.level >= 10) {
      return true;
    }

    return false;
  };

  // Check if user can delete this review (same as manage for reviews)
  const canDeleteReview = (): boolean => {
    return canManageReview();
  };

  const handleEditClick = () => {
    if (!isAuthenticated) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to edit reviews.',
        icon: Shield
      });
      return;
    }

    if (!canManageReview()) {
      showToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'You do not have permission to edit this review.',
        icon: AlertTriangle
      });
      return;
    }

    setShowEditModal(true);
  };

  const handleDeleteClick = () => {
    if (!isAuthenticated) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to delete reviews.',
        icon: Shield
      });
      return;
    }

    if (!canDeleteReview()) {
      showToast({
        type: 'error',
        title: 'Permission Denied',
        message: 'You do not have permission to delete this review.',
        icon: AlertTriangle
      });
      return;
    }

    setShowDeleteModal(true);
  };

  const handleEditSuccess = (updatedReview: Review) => {
    showToast({
      type: 'success',
      title: 'Review Updated',
      message: 'Review has been updated successfully.',
      icon: Edit3
    });
    
    onReviewUpdate?.(updatedReview);
    setShowEditModal(false);
  };

  const handleDeleteSuccess = () => {
    showToast({
      type: 'success',
      title: 'Review Deleted',
      message: 'Review has been permanently deleted.',
      icon: Trash2
    });
    
    onReviewDelete?.();
    setShowDeleteModal(false);
  };

  // Don't render if user doesn't have permissions
  if (!canManageReview()) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Edit Button */}
        <button
          onClick={handleEditClick}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Edit review"
        >
          <Edit3 className="h-3 w-3" />
          Edit
        </button>

        {/* Delete Button - only show if user can delete */}
        {canDeleteReview() && (
          <button
            onClick={handleDeleteClick}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete review permanently"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        )}
      </div>

      {/* Edit Modal */}
      <ReviewEditModal
        review={review}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Modal */}
      <ReviewDeleteModal
        review={review}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default ReviewManagementActions;