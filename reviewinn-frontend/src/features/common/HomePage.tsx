import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import HomePageLayout from './components/HomePageLayout';
import { useReviewManagement } from './hooks/useReviewManagement';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { entityService, reviewService, homepageService } from '../../api/services';
import type { Entity, Review } from '../../types';
import PageLoader from '../../shared/atoms/PageLoader';
import { useUnifiedCategories } from '../../hooks/useUnifiedCategories';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const {
    reviewBarRef,
    loadMoreReviews,
    fetchInitialReviews,
    localReviews,
    hasMoreReviews,
    loadingMore,
    handleReviewSubmit,
    handleCommentAdd,
    handleCommentDelete,
    handleCommentReaction,
  } = useReviewManagement();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [preselectedEntity, setPreselectedEntity] = useState<Entity | null>(null);

  const handleShowReviewModal = () => {
    // Don't do anything if auth is still loading
    if (authLoading) {
      return;
    }
    
    // Check if user is authenticated before showing review modal
    if (!isAuthenticated || !currentUser) {
      // Trigger auth modal instead of navigation
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    setShowReviewModal(true);
  };

  const handleGiveReviewClick = (entity: Entity) => {
    // Don't do anything if auth is still loading
    if (authLoading) {
      return;
    }
    
    // Check if user is authenticated before showing review modal
    if (!isAuthenticated || !currentUser) {
      // Trigger auth modal instead of navigation
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    setPreselectedEntity(entity);
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setPreselectedEntity(null); // Clear preselected entity when modal closes
  };

  // Initial load for panels/entities
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the EXACT SAME entity service as entity list page to ensure identical data
        const entityData = await entityService.getEntities({
          limit: 20,
          sortBy: 'name',
          sortOrder: 'asc'
        });
        
        setInitialData({
          entities: entityData.entities || []
        });
        // Fetch initial reviews for center feed
        fetchInitialReviews();
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]); // Re-run when auth state changes

  // Listen for auth events to refresh content instead of reloading page
  useEffect(() => {
    const handleAuthSuccess = () => {
      console.log('HomePage: Auth success detected - avoiding page reload to allow navigation');
      // Don't reload the page - this allows users to navigate to protected routes
      // after login without being forced back to homepage
    };

    const handleAuthLogout = () => {
      console.log('HomePage: Logout event detected - refreshing homepage content');
      // Refresh the homepage to show public version
      window.location.reload();
    };

    window.addEventListener('authLoginSuccess', handleAuthSuccess);
    window.addEventListener('authLogout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('authLoginSuccess', handleAuthSuccess);
      window.removeEventListener('authLogout', handleAuthLogout);
    };
  }, []);

  // Handle state from navigation after login (e.g., show review modal)
  useEffect(() => {
    const state = location.state as any;
    if (state?.showReviewModal && currentUser) {
      // Clear the navigation state
      navigate('/', { replace: true });
      
      // Set the preselected entity if available
      if (state.preselectedEntity) {
        setPreselectedEntity(state.preselectedEntity);
      }
      
      // Show the review modal
      setShowReviewModal(true);
    }
  }, [location.state, currentUser, navigate]);


  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="flex justify-center mb-4">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="32,8 60,56 4,56" fill="#FFEB3B" stroke="#222" strokeWidth="3" />
              <rect x="29" y="24" width="6" height="16" rx="3" fill="#222" />
              <rect x="29" y="44" width="6" height="6" rx="3" fill="#222" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error.message || 'Failed to load content. Please try again.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <HomePageLayout
      currentUser={currentUser}
      reviews={localReviews}
      entities={initialData?.entities || []}
      hasMoreReviews={hasMoreReviews}
      loadingMore={loadingMore}
      loading={loading}
      onLoadMore={loadMoreReviews}
      onCommentAdd={handleCommentAdd}
      onCommentDelete={handleCommentDelete}
      onCommentReaction={handleCommentReaction}
      showReviewModal={showReviewModal}
      onShowReviewModal={handleShowReviewModal}
      onCloseReviewModal={handleCloseReviewModal}
      onReviewSubmit={handleReviewSubmit}
      reviewBarRef={reviewBarRef}
      subcategories={[]}
      onGiveReviewClick={handleGiveReviewClick}
      preselectedEntity={preselectedEntity || undefined}
      isAuthenticated={isAuthenticated}
    />
  );
};

export default HomePage;
