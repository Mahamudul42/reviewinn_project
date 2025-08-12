import React from 'react';
import { PanelFactory } from '../../../shared/panels';
import AddReviewModal from '../../reviews/components/AddReviewModal';
import DashboardLayout from '../../../shared/layouts/DashboardLayout';
import { useToast } from '../../../shared/design-system/components/Toast';
import { Modal } from '../../../shared/design-system';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import type { Entity, Review, ReviewFormData } from '../../../types';

interface HomePageLayoutProps {
  // User data - can be null for unauthenticated users
  currentUser: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    bio: string;
    stats: {
      reviewsCount: number;
      followers: number;
      following: number;
    };
  } | null;
  
  // Review data and handlers
  reviews: Review[];
  entities: Entity[];
  hasMoreReviews: boolean;
  loadingMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  onCommentAdd: (reviewId: string, content: string, parentId?: string) => void;
  onCommentDelete: (reviewId: string, commentId: string) => void;
  onCommentReaction: (reviewId: string, commentId: string, reaction: string | null) => void;
  
  // Modal state
  showReviewModal: boolean;
  onShowReviewModal: () => void;
  onCloseReviewModal: () => void;
  onReviewSubmit: (entity: Entity, reviewData: ReviewFormData) => Promise<{ success: boolean; error?: string }>;
  
  // NEW: Callback for give review button
  onGiveReviewClick?: (entity: Entity) => void;
  preselectedEntity?: Entity;
  
  // Other props
  reviewBarRef: React.RefObject<HTMLDivElement | null>;
  subcategories: any[];
}

const HomePageLayout: React.FC<HomePageLayoutProps> = ({
  currentUser,
  reviews,
  entities,
  hasMoreReviews,
  loadingMore,
  loading = false,
  onLoadMore,
  onCommentAdd,
  onCommentDelete,
  onCommentReaction,
  showReviewModal,
  onShowReviewModal,
  onCloseReviewModal,
  onReviewSubmit,
  reviewBarRef,
  subcategories,
  onGiveReviewClick,
  preselectedEntity,
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const toast = useToast();
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  
  const handleReviewSubmit = async (entity: Entity, reviewData: ReviewFormData) => {
    const result = await onReviewSubmit(entity, reviewData);
    if (result.success) {
      toast.success('🎉 Review submitted successfully! Your review has been published.');
      onCloseReviewModal();
    } else {
      const errorMessage = result.error || 'Failed to submit review';
      console.log('Review submission failed:', errorMessage);
      
      // Show professional error toast
      toast.error(errorMessage);
      
      // Show login modal if authentication error
      if ((result as any).authError) {
        setShowLoginModal(true);
      }
      
      // Close modal for duplicate review (user already knows what happened)
      if ((result as any).isDuplicate) {
        onCloseReviewModal();
      }
    }
  };

  // Provide fallback values for unauthenticated users
  const displayUser = currentUser || {
    name: 'Guest',
    avatar: 'https://ui-avatars.com/api/?name=Guest&background=gray&color=ffffff'
  };

  return (
    <DashboardLayout>
      {/* Temporarily comment out left and right panels - only show middle panel */}
      <div className="flex justify-center w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PanelFactory
          position="middle"
          userAvatar={displayUser.avatar}
          userName={displayUser.name}
          onAddReviewClick={onShowReviewModal}
          reviewBarRef={reviewBarRef}
          reviews={reviews}
          entities={entities}
          hasMoreReviews={hasMoreReviews}
          loadingMore={loadingMore}
          loading={loading}
          onLoadMore={onLoadMore}
          onCommentAdd={onCommentAdd}
          onCommentDelete={onCommentDelete}
          onCommentReaction={onCommentReaction}
          onGiveReviewClick={onGiveReviewClick}
        />
      </div>
      <AddReviewModal
        open={showReviewModal}
        onClose={onCloseReviewModal}
        onReviewSubmit={handleReviewSubmit}
        subcategories={subcategories}
        userName={displayUser.name}
        userAvatar={displayUser.avatar}
        preselectedEntity={preselectedEntity}
      />
      
      {/* Professional Login Modal */}
      <Modal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '16px',
            color: '#f59e0b'
          }}>
            🔐
          </div>
          <h3 style={{ 
            fontSize: '24px', 
            fontWeight: '600', 
            marginBottom: '16px',
            color: '#111827'
          }}>
            Authentication Required
          </h3>
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Your session has expired or you need to log in to submit a review. 
            Please sign in to continue.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowLoginModal(false);
                window.location.href = '/login';
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default HomePageLayout;
