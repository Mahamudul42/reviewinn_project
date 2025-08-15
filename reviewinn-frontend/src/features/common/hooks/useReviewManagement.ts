import { useState, useRef } from 'react';
import { reviewService, commentService } from '../../../api/services';
import { reviewStatsService } from '../../../services/reviewStatsService';
import { ApiClientError, API_ERROR_TYPES } from '../../../api';
import { useAuthStore } from '../../../stores/authStore';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import type { Review, Entity, ReviewFormData } from '../../../types';

export const useReviewManagement = () => {
  const { isAuthenticated } = useUnifiedAuth();
  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewBarRef = useRef<HTMLDivElement>(null);

  const loadMoreReviews = async () => {
    if (loadingMore || !hasMoreReviews) return;
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const reviewsResult = await reviewStatsService.getHomepageReviewsWithStats({
        page: nextPage,
        limit: 15,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      
      if (reviewsResult && Array.isArray(reviewsResult.reviews)) {
        setLocalReviews(prevReviews => [...prevReviews, ...reviewsResult.reviews]);
        setHasMoreReviews(reviewsResult.hasMore || false);
        setCurrentPage(nextPage);
      } else {
        console.warn('Invalid reviews response format:', reviewsResult);
        setHasMoreReviews(false);
      }
    } catch (error) {
      console.error('Failed to load more reviews:', error);
      setHasMoreReviews(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchInitialReviews = async () => {
    setLoadingMore(true);
    try {
      const reviewsResult = await reviewStatsService.getHomepageReviewsWithStats({
        page: 1,
        limit: 15,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      
      // Set initial reviews directly, ensuring proper sorting
      const newReviews = reviewsResult.reviews || [];
      if (newReviews.length > 0) {
        // Sort by creation date to ensure newest reviews appear first
        const sortedReviews = newReviews.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setLocalReviews(sortedReviews);
      }
      
      setHasMoreReviews(reviewsResult.hasMore || false);
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to fetch initial reviews:', error);
      setLocalReviews([]);
      setHasMoreReviews(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleReviewSubmit = async (entity: Entity, reviewData: ReviewFormData) => {
    try {
      console.log('🚀 Starting review submission...');
      
      // Enhanced authentication check using Zustand store
      const authState = useAuthStore.getState();
      const token = authState.token || localStorage.getItem('reviewinn_jwt_token');
      const user = authState.user;
      const isAuthenticated = authState.isAuthenticated;
      
      console.log('🔑 Enhanced auth check:', {
        hasToken: !!token,
        hasUser: !!user,
        isAuthenticated,
        userId: user?.id,
        tokenPreview: token?.substring(0, 10) + '...'
      });
      
      // Comprehensive authentication validation
      if (!isAuthenticated || !token || !user || !user.id) {
        console.log('❌ Authentication failed - missing requirements:', {
          isAuthenticated,
          hasToken: !!token,
          hasUser: !!user,
          hasUserId: !!(user?.id)
        });
        
        // Force re-authentication by showing auth modal
        window.dispatchEvent(new CustomEvent('openAuthModal'));
        return { 
          success: false, 
          error: 'Please sign in to submit a review. Authentication is required.',
          authError: true 
        };
      }

      // Validate token structure and expiry
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        console.log('🔑 Token validation:', {
          exp: payload.exp,
          now: Math.floor(Date.now() / 1000),
          isExpired,
          expiresAt: new Date(payload.exp * 1000)
        });
        
        if (isExpired) {
          console.log('❌ Token is expired, forcing logout');
          useAuthStore.getState().logout();
          window.dispatchEvent(new CustomEvent('openAuthModal'));
          return { 
            success: false, 
            error: 'Your session has expired. Please sign in again.',
            authError: true 
          };
        }
      } catch (e) {
        console.error('❌ Could not decode token:', e);
        useAuthStore.getState().logout();
        return { 
          success: false, 
          error: 'Invalid authentication token. Please sign in again.',
          authError: true 
        };
      }

      const reviewPayload: ReviewFormData = {
        entityId: entity.id,
        title: reviewData.title,
        comment: reviewData.comment,
        overallRating: reviewData.overallRating,
        ratings: reviewData.ratings,
        isAnonymous: reviewData.isAnonymous,
        pros: reviewData.pros || [],
        cons: reviewData.cons || [],
        images: reviewData.images || [],
      };
      
      console.log('📝 Review payload:', reviewPayload);
      console.log('🔑 Token preview:', token?.substring(0, 20) + '...');
      
      // Test auth before submitting review
      console.log('🧪 Testing authentication...');
      try {
        const authTestResponse = await fetch('http://localhost:8000/api/v1/reviews/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🧪 Auth test response status:', authTestResponse.status);
        
        if (authTestResponse.status === 401) {
          console.log('❌ Auth test failed - token invalid');
          return { success: false, error: 'Your session is invalid. Please log out and log back in.', authError: true };
        }
        
        if (authTestResponse.ok) {
          const authData = await authTestResponse.json();
          console.log('✅ Auth test successful:', authData);
        }
      } catch (authError) {
        console.error('❌ Auth test failed:', authError);
        return { success: false, error: 'Could not verify authentication. Please check your connection and try again.' };
      }
      
      console.log('📤 Calling reviewService.createReview...');
      const newReview = await reviewService.createReview(reviewPayload);
      console.log('✅ Review created successfully, review ID:', newReview.id);
      
      // Add the new review to the top of the feed immediately (Facebook-style)
      setLocalReviews((prevReviews: Review[]) => {
        // Make sure we don't add duplicates
        const existingReviewIndex = prevReviews.findIndex(r => r.id === newReview.id);
        if (existingReviewIndex !== -1) {
          // Update existing review if it already exists
          const updatedReviews = [...prevReviews];
          updatedReviews[existingReviewIndex] = newReview;
          return updatedReviews;
        }
        // Add new review to the top
        return [newReview, ...prevReviews];
      });
      
      // Emit event to update user profile with new review
      const eventDetail = { 
        review: newReview,
        userId: user.id,
        timestamp: Date.now(),
        source: 'useReviewManagement'
      };
      
      console.log('🔥 useReviewManagement: About to emit reviewCreated event with details:', {
        ...eventDetail,
        reviewId: newReview.id,
        reviewTitle: newReview.title,
        userIdType: typeof user.id,
        userIdValue: user.id
      });
      
      window.dispatchEvent(new CustomEvent('reviewCreated', { detail: eventDetail }));
      
      console.log('✅ Review submitted successfully and added to feed!');
      console.log('📢 useReviewManagement: Successfully emitted reviewCreated event for profile update');
      return { success: true };
    } catch (error) {
      console.error('❌ REVIEW SUBMISSION FAILED:', error);
      console.error('Error details:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        errorType: typeof error,
        errorKeys: Object.keys(error || {}),
        fullError: error
      });
      
      if (error instanceof ApiClientError) {
        console.error('🔍 API Client Error Details:', {
          type: error.type,
          message: error.message,
          statusCode: (error as any).statusCode,
          response: (error as any).response
        });
        
        switch (error.type) {
          case API_ERROR_TYPES.VALIDATION_ERROR:
            return { success: false, error: 'Please check your review content and try again.' };
          case API_ERROR_TYPES.AUTHENTICATION_ERROR:
            return { success: false, error: 'Authentication failed. Please log out and log back in.', authError: true };
          case API_ERROR_TYPES.CONFLICT_ERROR:
            return { success: false, error: 'You have already reviewed this entity. You can only submit one review per entity.', isDuplicate: true };
          default:
            return { success: false, error: `Failed to submit review: ${error.message || 'Please try again.'}` };
        }
      } else {
        // Check for network or token expiry issues
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('token')) {
          console.log('🔍 Detected authentication issue');
          return { success: false, error: 'Authentication failed. Please log out and log back in.', authError: true };
        }
        
        console.error('🔍 Non-API Error:', {
          name: (error as Error).name,
          message: (error as Error).message,
          constructor: (error as Error).constructor.name
        });
        return { success: false, error: `An unexpected error occurred: ${(error as Error).message || 'Please try again.'}` };
      }
    }
  };

  const handleCommentAdd = async (reviewId: string, content: string, parentId?: string) => {
    // Check authentication before proceeding
    if (!isAuthenticated) {
      console.log('useReviewManagement: User not authenticated for adding comment');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    
    try {
      const newComment = await commentService.createComment(reviewId, { content });
      
      setLocalReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              comments: [...(review.comments || []), newComment]
            };
          }
          return review;
        })
      );
    } catch (error) {
      console.error('Failed to add comment:', error);
      if (error instanceof ApiClientError) {
        switch (error.type) {
          case API_ERROR_TYPES.AUTHENTICATION_ERROR:
            alert('Please log in to comment.');
            break;
          case API_ERROR_TYPES.VALIDATION_ERROR:
            alert('Please check your comment and try again.');
            break;
          default:
            alert('Failed to add comment. Please try again.');
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleCommentDelete = async (reviewId: string, commentId: string) => {
    // Check authentication before proceeding
    if (!isAuthenticated) {
      console.log('useReviewManagement: User not authenticated for deleting comment');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    
    try {
      await commentService.deleteComment(reviewId, commentId);
      
      setLocalReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              comments: (review.comments || []).filter(comment => comment.id !== commentId)
            };
          }
          return review;
        })
      );
    } catch (error) {
      console.error('Failed to delete comment:', error);
      if (error instanceof ApiClientError) {
        switch (error.type) {
          case API_ERROR_TYPES.AUTHENTICATION_ERROR:
            alert('Please log in to delete comments.');
            break;
          case API_ERROR_TYPES.AUTHORIZATION_ERROR:
            alert('You can only delete your own comments.');
            break;
          default:
            alert('Failed to delete comment. Please try again.');
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleCommentReaction = async (reviewId: string, commentId: string, reaction: string | null) => {
    // Check authentication before proceeding
    if (!isAuthenticated) {
      console.log('useReviewManagement: User not authenticated for comment reaction');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    
    try {
      if (reaction) {
        await commentService.addOrUpdateReaction(commentId, reaction);
      } else {
        await commentService.removeReaction(commentId);
      }
      
      setLocalReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              comments: (review.comments || []).map(comment => {
                if (comment.id === commentId) {
                  const currentReactions = comment.reactions || {};
                  const updatedReactions = { ...currentReactions };
                  
                  if (reaction) {
                    updatedReactions[reaction] = (updatedReactions[reaction] || 0) + 1;
                  }
                  
                  return {
                    ...comment,
                    reactions: updatedReactions
                  };
                }
                return comment;
              })
            };
          }
          return review;
        })
      );
    } catch (error) {
      console.error('Failed to update comment reaction:', error);
      if (error instanceof ApiClientError) {
        switch (error.type) {
          case API_ERROR_TYPES.AUTHENTICATION_ERROR:
            alert('Please log in to react to comments.');
            break;
          default:
            alert('Failed to update reaction. Please try again.');
        }
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Handle review reactions with proper authentication handling
  const handleReactionChange = async (reviewId: string, reaction: string | null) => {
    if (!isAuthenticated) {
      console.log('useReviewManagement: User not authenticated for review reaction');
      // Trigger auth modal for unauthenticated users
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }
    
    try {
      // The actual reaction handling is done by useReviewCard hook
      // This is just a placeholder for any additional homepage-specific logic
      console.log('useReviewManagement: Review reaction change:', { reviewId, reaction });
      
      // Update userInteractionService cache for persistence
      const { userInteractionService } = await import('../../../api/services/userInteractionService');
      if (reaction) {
        userInteractionService.updateUserInteraction(reviewId, { 
          reviewId,
          reaction,
          lastInteraction: new Date()
        });
      } else {
        // Remove reaction but keep other interactions (bookmarks, etc.)
        const existingInteraction = userInteractionService.getUserInteraction(reviewId);
        if (existingInteraction) {
          userInteractionService.updateUserInteraction(reviewId, {
            ...existingInteraction,
            reaction: undefined,
            lastInteraction: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Failed to handle review reaction:', error);
    }
  };

  return {
    localReviews,
    setLocalReviews,
    hasMoreReviews,
    setHasMoreReviews,
    loadingMore,
    reviewBarRef,
    loadMoreReviews,
    fetchInitialReviews,
    handleReviewSubmit,
    handleReactionChange,
    handleCommentAdd,
    handleCommentDelete,
    handleCommentReaction,
  };
};
