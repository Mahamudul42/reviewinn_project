import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { reviewService, commentService } from '../../../api/services';
import type { Review, Entity } from '../../../types';

interface UseReviewCardProps {
  review: Review;
  entity?: Entity;
  onEntityClick?: (entityId: string) => void;
  onReactionChange?: (reviewId: string, reaction: string | null) => void;
  onGiveReviewClick?: (entity: Entity) => void; // NEW: Callback for give review button
}

export const useReviewCard = ({ review, entity, onEntityClick, onReactionChange, onGiveReviewClick }: UseReviewCardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, getToken, checkAuth } = useUnifiedAuth();
  
  // UI State
  const [isHidden, setIsHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false);

  // Reaction State
  const [localReactions, setLocalReactions] = useState<Record<string, number>>(review.reactions || {});
  const [localUserReaction, setLocalUserReaction] = useState<string | undefined>(review.user_reaction);
  const [topReactions, setTopReactions] = useState<any[]>(review.top_reactions || []);
  const [totalReactions, setTotalReactions] = useState<number>(review.total_reactions || 0);
  const [optimisticError, setOptimisticError] = useState<string | null>(null);

  // View tracking state
  const [viewCount, setViewCount] = useState<number>(review.view_count || 0);
  const viewTrackedRef = useRef<boolean>(false);
  const viewTrackingTimeout = useRef<number | null>(null);

  // Check if view was already tracked in this session
  useEffect(() => {
    const sessionKey = `review_viewed_${review.id}`;
    const viewedInSession = sessionStorage.getItem(sessionKey);
    if (viewedInSession) {
      viewTrackedRef.current = true;
    }
  }, [review.id]);

  // Comment count state
  const [commentCount, setCommentCount] = useState<number>(
    review.comment_count || (review as any).commentCount || (review.comments ? review.comments.length : 0)
  );
  
  // Debug logging for comment count
  console.log('🔍 useReviewCard: Comment count initialization', {
    reviewId: review.id,
    review_comment_count: review.comment_count,
    review_commentCount: (review as any).commentCount,
    comments_length: review.comments?.length,
    final_commentCount: commentCount
  });

  // Functions to update comment count
  const updateCommentCount = (count: number) => {
    setCommentCount(count);
  };

  const incrementCommentCount = () => {
    setCommentCount(prev => prev + 1);
  };

  const decrementCommentCount = () => {
    setCommentCount(prev => Math.max(0, prev - 1));
  };

  const refreshCommentCount = async () => {
    try {
      const count = await commentService.getCommentCount(review.id);
      setCommentCount(count);
      return count;
    } catch (error) {
      console.error('Failed to refresh comment count:', error);
      return commentCount; // Return current count if refresh fails
    }
  };

  // Initialize reaction data from review prop and userInteractionService
  useEffect(() => {
    if (review.reactions) {
      setLocalReactions(review.reactions);
    }
    if (review.top_reactions) {
      setTopReactions(review.top_reactions);
    }
    if (review.total_reactions !== undefined) {
      setTotalReactions(review.total_reactions);
    }
    if (review.view_count !== undefined) {
      setViewCount(review.view_count);
    }
    if (review.comment_count !== undefined) {
      setCommentCount(review.comment_count);
    }
    
    // Check userInteractionService for user reaction if not provided by backend
    if (review.user_reaction !== undefined) {
      setLocalUserReaction(review.user_reaction);
    } else if (isAuthenticated) {
      // Load from userInteractionService for persistence
      import('../../../api/services/userInteractionService').then(({ userInteractionService }) => {
        const cachedReaction = userInteractionService.getUserReaction(review.id);
        if (cachedReaction) {
          setLocalUserReaction(cachedReaction);
        }
      });
    }
  }, [review.reactions, review.top_reactions, review.total_reactions, review.view_count, review.comment_count, review.user_reaction, review.id, isAuthenticated]);

  // Auth is now handled by context, no need for manual subscription

  // Skip separate comment count fetch since we already have it from the API response
  // The comment count is already properly initialized from review.comment_count above

  // View tracking function with session-based prevention - only for modal opening
  const trackView = async () => {
    if (viewTrackedRef.current) return;
    
    try {
      viewTrackedRef.current = true;
      
      // Mark as viewed in session to prevent multiple views
      const sessionKey = `review_viewed_${review.id}`;
      sessionStorage.setItem(sessionKey, 'true');
      
      // Use the proper view tracking service (not reviewService)
      const { viewTrackingService } = await import('../../../api/viewTracking');
      const result = await viewTrackingService.trackReviewView(Number(review.id));
      
      // Update view count if tracking was successful
      if (result && result.tracked && result.view_count) {
        setViewCount(result.view_count);
        // No need to call updateViewCount here since it's the same state
      }
    } catch (error) {
      console.error('Failed to track view:', error);
      // Don't reset on error to prevent multiple attempts
    }
  };

  // Single-use view tracking - only triggers once per component instance
  const triggerViewTracking = () => {
    if (viewTrackedRef.current) return; // Already tracked in this session
    
    if (viewTrackingTimeout.current) {
      clearTimeout(viewTrackingTimeout.current);
    }
    
    viewTrackingTimeout.current = setTimeout(() => {
      trackView();
    }, 500); // Reduced debounce time
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (viewTrackingTimeout.current) {
        clearTimeout(viewTrackingTimeout.current);
      }
    };
  }, []);

  // Reaction handling
  const handleReactionChange = async (reaction: string | null) => {
    // Check authentication using the new unified context
    console.log('useReviewCard: Reaction change requested', { 
      reaction, 
      isAuthenticated, 
      hasToken: !!getToken(),
      checkAuthResult: checkAuth()
    });
    
    if (!isAuthenticated) {
      console.log('useReviewCard: User not authenticated, showing auth modal');
      setShowAuthModal(true);
      setOptimisticError('Please sign in to react to reviews.');
      return;
    }

    // Save previous state for rollback
    const prevReactions = { ...localReactions };
    const prevUserReaction = localUserReaction;
    const prevTopReactions = [...topReactions];
    const prevTotal = totalReactions;

    // 🚀 FIXED: Calculate optimistic total change before updating state
    let optimisticTotalChange = 0;
    
    // Handle toggle behavior: clicking the same reaction removes it
    let finalReaction = reaction;
    if (localUserReaction && reaction && localUserReaction === reaction) {
      // User clicked the same reaction twice - remove it
      finalReaction = null;
    }
    
    // Calculate the total change before updating state
    if (localUserReaction && !finalReaction) {
      // User is removing their existing reaction
      optimisticTotalChange = -1;
    } else if (!localUserReaction && finalReaction) {
      // User is adding a new reaction (no previous reaction)
      optimisticTotalChange = 1;
    } else if (localUserReaction && finalReaction && localUserReaction !== finalReaction) {
      // User is changing their reaction (remove old, add new) - net change is 0
      optimisticTotalChange = 0;
    } else {
      // No change case
      optimisticTotalChange = 0;
    }
    
    // Update the reaction variable for the rest of the function
    reaction = finalReaction;
    
    console.log('🔄 Optimistic change calculation:', {
      prevUserReaction: localUserReaction,
      newReaction: reaction,
      totalChange: optimisticTotalChange,
      currentTotal: totalReactions
    });
    
    setLocalReactions(prev => {
      const newReactions = { ...prev };
      
      // Remove previous reaction if exists
      if (localUserReaction && newReactions[localUserReaction]) {
        newReactions[localUserReaction] = Math.max(0, newReactions[localUserReaction] - 1);
      }
      
      // Add new reaction if provided
      if (reaction) {
        newReactions[reaction] = (newReactions[reaction] || 0) + 1;
      }
      
      console.log('🔄 Updated reactions:', { prev, new: newReactions, userReaction: reaction });
      return newReactions;
    });
    
    setLocalUserReaction(reaction || undefined);
    
    // 🚀 CRITICAL FIX: Update total reactions optimistically using pre-calculated change
    setTotalReactions(prev => {
      const newTotal = Math.max(0, prev + optimisticTotalChange);
      console.log('🔄 Total reactions update:', prev, '=>', newTotal, '(change:', optimisticTotalChange, ')');
      return newTotal;
    });
    
    setOptimisticError(null);

    // Backend update
    try {
      let result;
      if (reaction) {
        result = await reviewService.addOrUpdateReaction(review.id, reaction);
      } else if (localUserReaction) {
        result = await reviewService.removeReaction(review.id);
      }
      
      // Use new backend response - check if result has the expected structure
      console.log('🔄 Backend response structure:', { result, hasData: !!result?.data, keys: result ? Object.keys(result) : [] });
      
      const responseData = result?.data || result; // Handle both direct and nested response formats
      
      if (responseData && responseData.reactions) {
        console.log('✅ Using backend response data:', responseData);
        setLocalReactions(responseData.reactions || {});
        setLocalUserReaction(responseData.user_reaction || undefined);
        setTopReactions(responseData.top_reactions || []);
        setTotalReactions(responseData.total || responseData.total_reactions || 0);
      } else {
        // fallback: fetch latest
        console.log('⚠️ Backend response missing data, fetching latest');
        const latest = await reviewService.getReactionCounts(review.id);
        const latestData = latest?.data || latest;
        setLocalReactions(latestData.reactions || {});
        setLocalUserReaction(latestData.user_reaction || undefined);
        setTopReactions(latestData.top_reactions || []);
        setTotalReactions(latestData.total || latestData.total_reactions || 0);
      }
      
      // Call parent handler
      onReactionChange?.(review.id, reaction);
    } catch (err: any) {
      // Rollback on error
      setLocalReactions(prevReactions);
      setLocalUserReaction(prevUserReaction);
      setTopReactions(prevTopReactions);
      setTotalReactions(prevTotal);
      
      // Check if it's an authentication error
      if (err.response?.status === 401 || err.message?.includes('Authentication required')) {
        setOptimisticError('Please sign in to react to reviews.');
        // Trigger auth modal after a short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openAuthModal'));
        }, 1500);
      } else {
        setOptimisticError('Failed to update reaction. Please try again.');
      }
    }
  };

  // Modal handlers with single view tracking - ONLY track when modal opens
  const openReviewDetailModal = () => {
    setShowReviewDetailModal(true);
    // Track view ONLY when opening the modal (this is when user actually views the review details)
    if (!viewTrackedRef.current) {
      triggerViewTracking();
    }
  };

  const closeReviewDetailModal = () => {
    setShowReviewDetailModal(false);
  };

  // Menu handlers
  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Hide handler
  const hideReview = () => {
    setIsHidden(true);
  };

  // Entity click handler
  const handleEntityClick = () => {
    if (onEntityClick && entity) {
      onEntityClick(entity.id);
    } else if (entity) {
      navigate(`/entity/${entity.id}`);
    }
  };

  // Click handlers for modal opening - view tracking handled once in openReviewDetailModal
  const handleTitleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    openReviewDetailModal();
  };

  const handleViewDetailsClick = () => {
    openReviewDetailModal();
  };

  const handleCommentClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    openReviewDetailModal();
  };

  const handleGiveReviewClick = () => {
    if (entity && onGiveReviewClick) {
      onGiveReviewClick(entity);
    } else {
      console.warn('No entity available or onGiveReviewClick callback not provided');
    }
  };

  // Function to update reaction data from external sources (like modal)
  const updateReactionData = (reactionData: {
    reactions?: Record<string, number>;
    user_reaction?: string;
    top_reactions?: any[];
    total_reactions?: number;
    reaction_count?: number;
  }) => {
    console.log('🔄 Updating reaction data from external source:', reactionData);
    
    if (reactionData.reactions !== undefined) {
      setLocalReactions(reactionData.reactions);
    }
    if (reactionData.user_reaction !== undefined) {
      setLocalUserReaction(reactionData.user_reaction);
    }
    if (reactionData.top_reactions !== undefined) {
      setTopReactions(reactionData.top_reactions);
    }
    if (reactionData.total_reactions !== undefined) {
      setTotalReactions(reactionData.total_reactions);
    }
  };

  // Function to update view count from external sources (like modal or view tracking)
  const updateViewCount = (newViewCount: number) => {
    console.log('🔄 Updating view count from external source:', newViewCount);
    setViewCount(newViewCount);
  };

  return {
    // State
    isHidden,
    setIsHidden,
    menuOpen,
    setMenuOpen,
    showAuthModal,
    setShowAuthModal,
    showReviewDetailModal,
    setShowReviewDetailModal,
    isAuthenticated,
    localReactions,
    localUserReaction,
    topReactions,
    totalReactions,
    optimisticError,
    viewCount,
    commentCount, // Add comment count to returned state

    // Handlers
    handleReactionChange,
    handleEntityClick,
    handleTitleClick,
    handleViewDetailsClick,
    handleCommentClick,
    handleGiveReviewClick,
    openReviewDetailModal,
    closeReviewDetailModal,
    toggleMenu,
    closeMenu,
    hideReview,
    triggerViewTracking, // Expose for manual tracking if needed
    
    // Comment count management
    updateCommentCount,
    incrementCommentCount,
    decrementCommentCount,
    refreshCommentCount,
    
    // Reaction data management
    updateReactionData,
    
    // View count management
    updateViewCount
  };
}; 