import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { userService, homepageService, entityService, reviewService } from '../../api/services';
import { reviewStatsService } from '../../services/reviewStatsService';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import { Button } from '../../shared/design-system/components/Button';
import { useToast } from '../../shared/design-system/components/Toast';
import { circleService } from '../../api/services/circleService';
import { professionalMessagingService } from '../../api/services/professionalMessagingService';

// Import modular components
import {
  ModularProfileHeader,
  ModularProfileStats,
  ModularProfileEntitiesSection,
  ModularProfileReviewsSection
} from './components/ModularComponents';

// Import existing modals
import EditProfileModal from './components/EditProfileModal';
import AddToCircleModal from './components/AddToCircleModal';
import MessageModal from './components/MessageModal';
import EditEntityModal from './components/EditEntityModal';
import EditReviewModal from './components/EditReviewModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

import type { UserProfile, Review, Entity } from '../../types';

const ModularUserProfilePage: React.FC = () => {
  const { userIdentifier } = useParams<{ userIdentifier: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Profile Data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [userEntities, setUserEntities] = useState<Entity[]>([]);
  // Removed: entities state - no longer needed as reviews include full entity data from optimized backend
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  
  // UI States
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [hasMoreEntities, setHasMoreEntities] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [entitiesPage, setEntitiesPage] = useState(1);
  
  // Dropdown States
  const [entityDropdown, setEntityDropdown] = useState<{
    open: boolean;
    entity: Entity | null;
    buttonRef: React.RefObject<HTMLButtonElement> | null;
  }>({ open: false, entity: null, buttonRef: null });
  
  const [reviewDropdown, setReviewDropdown] = useState<{
    open: boolean;
    review: Review | null;
    buttonRef: React.RefObject<HTMLButtonElement> | null;
  }>({ open: false, review: null, buttonRef: null });
  
  // Modal States
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [addToCircleModal, setAddToCircleModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [editEntityModal, setEditEntityModal] = useState<{ open: boolean; entity: Entity | null }>({ open: false, entity: null });
  const [editReviewModal, setEditReviewModal] = useState<{ open: boolean; review: Review | null }>({ open: false, review: null });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: 'profile' | 'entity' | 'review';
    item: any;
    title: string;
    message: string;
    warning?: string;
  }>({ open: false, type: 'profile', item: null, title: '', message: '', warning: '' });
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Track auth changes to prevent infinite loops
  const lastUserId = useRef<string | null>(null);
  const lastUserIdentifier = useRef<string | undefined>(undefined);
  const hasLoadedRef = useRef(false);

  // Determine if this is the current user's profile
  const isCurrentUser = useMemo(() => {
    // If no userIdentifier, we're viewing own profile (/profile)
    if (!userIdentifier) {
      return true;
    }
    
    // If no currentUser, definitely not own profile
    if (!currentUser) {
      return false;
    }
    
    // Compare userIdentifier with current user's ID and username
    return currentUser.id === userIdentifier || currentUser.username === userIdentifier;
  }, [userIdentifier, currentUser?.id, currentUser?.username]);

  // For edit profile button - only show if this is truly the current user's profile
  const isOwnProfile = useMemo(() => {
    // If no current user, definitely not own profile
    if (!currentUser) {
      return false;
    }
    
    // If no userIdentifier, we're on /profile (own profile)
    if (!userIdentifier) {
      return true;
    }
    
    // If userProfile is loaded, check if its ID matches current user
    if (userProfile) {
      return userProfile.id.toString() === currentUser.id || 
             userProfile.user_id?.toString() === currentUser.id ||
             userProfile.username === currentUser.username;
    }
    
    // Fallback: check userIdentifier against current user
    return currentUser.id === userIdentifier || currentUser.username === userIdentifier;
  }, [userIdentifier, userProfile?.id, userProfile?.user_id, userProfile?.username, currentUser?.id, currentUser?.username]);
  
  // Debug logging for profile ownership
  console.log('🔍 Profile Ownership Check:', {
    userIdentifier,
    currentUserId: currentUser?.id,
    currentUsername: currentUser?.username,
    profileId: userProfile?.id,
    profileUserId: userProfile?.user_id,
    profileUsername: userProfile?.username,
    isCurrentUser,
    isOwnProfile,
    isAuthenticated,
    authLoading
  });

  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 ProfilePage: Starting loadUserProfile with userIdentifier:', userIdentifier);
      console.log('🔍 ProfilePage: currentUser:', currentUser);

      // No longer need to load entities separately - optimized backend includes full entity data with reviews
      
      let profile: UserProfile | null = null;
      let userId: string = '';
      
      if (!userIdentifier) {
        // Viewing own profile - requires authentication
        if (!currentUser) {
          throw new Error('No user logged in');
        }
        console.log('🔍 ProfilePage: Loading own profile for currentUser.id:', currentUser.id);
        const profileResponse = await userService.getUserProfile(currentUser.id);
        profile = profileResponse;
        userId = currentUser.id;
      } else {
        // Viewing someone else's profile - should work without authentication
        console.log('🔍 ProfilePage: About to call getUserProfileByIdentifier with:', userIdentifier);
        const profileResponse = await userService.getUserProfileByIdentifier(userIdentifier);
        profile = profileResponse;
        console.log('🔍 ProfilePage.loadUserProfile: Profile response for userIdentifier', userIdentifier, ':', {
          profile,
          profileId: profile?.id,
          profileUserId: profile?.user_id,
          profileKeys: profile ? Object.keys(profile) : []
        });
        userId = profile?.id?.toString() || profile?.user_id?.toString() || userIdentifier;
        console.log('🔍 ProfilePage.loadUserProfile: Final userId to use for API calls:', userId);
      }

      if (!profile) {
        throw new Error('Profile not found');
      }

      setUserProfile(profile);
      
      console.log('🎯 ProfilePage.loadUserProfile: About to load reviews and entities for userId:', {
        userId,
        userIdType: typeof userId,
        userIdentifier,
        currentUserId: currentUser?.id
      });
      
      await Promise.all([
        loadUserReviews(userId, 1, true),
        loadUserEntities(userId, 1, true)
      ]);
      
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [userIdentifier, currentUser]);

  useEffect(() => {
    // Don't load if auth is still loading
    if (authLoading) {
      return;
    }
    
    const currentUserId = currentUser?.id || null;
    const currentUserIdentifier = userIdentifier;
    
    // Only load if user ID or userIdentifier changed, or haven't loaded yet
    if (lastUserId.current === currentUserId && 
        lastUserIdentifier.current === currentUserIdentifier && 
        hasLoadedRef.current) {
      return;
    }
    
    // Update refs
    lastUserId.current = currentUserId;
    lastUserIdentifier.current = currentUserIdentifier;
    hasLoadedRef.current = true;
    
    loadUserProfile();
    
    // TODO: Re-enable user interactions when authentication is properly fixed
    // Load user interactions for reaction persistence - only for authenticated users
    console.log('🔍 ProfilePage: User interactions disabled temporarily to prevent 401 errors');
    // if (currentUser && isAuthenticated) {
    //   console.log('🔍 ProfilePage: Loading user interactions for authenticated user');
    //   import('../../api/services/userInteractionService').then(({ userInteractionService }) => {
    //     userInteractionService.loadUserInteractions().catch(error => {
    //       console.warn('Failed to load user interactions:', error);
    //     });
    //   });
    // } else {
    //   console.log('🔍 ProfilePage: Skipping user interactions - not authenticated');
    // }
  }, [userIdentifier, currentUser?.id, authLoading, loadUserProfile]);

  // Listen for new review creation to update profile in real-time
  useEffect(() => {
    console.log('🎯 ProfilePage: Setting up reviewCreated event listener for userIdentifier:', userIdentifier);
    console.log('🎯 ProfilePage: Current state when setting up listener:', {
      userProfileId: userProfile?.id,
      currentUserId: currentUser?.id,
      isCurrentUser,
      userIdentifier
    });
    
    const handleReviewCreated = (event: CustomEvent) => {
      console.log('🔥🔥 ProfilePage: RECEIVED reviewCreated event:', {
        eventDetail: event.detail,
        eventSource: event.detail?.source || 'unknown'
      });
      
      const { review, userId, source } = event.detail;
      
      // Debug current state
      const profileUserId = userProfile?.id?.toString();
      const currentUserId = currentUser?.id?.toString();
      
      console.log('🔥 ProfilePage: DETAILED Event comparison:', {
        'Event userId': userId,
        'Event userId type': typeof userId,
        'Profile userId': profileUserId,
        'Profile userId type': typeof profileUserId,
        'Current userId': currentUserId,
        'Current userId type': typeof currentUserId,
        'userIdentifier': userIdentifier,
        'isCurrentUser': isCurrentUser,
        'reviewId': review?.id,
        'reviewTitle': review?.title,
        'eventSource': source
      });
      
      // More flexible matching - convert all to strings for comparison
      const eventUserIdStr = String(userId);
      const profileUserIdStr = String(profileUserId);
      const currentUserIdStr = String(currentUserId);
      
      console.log('🔥 ProfilePage: String comparison:', {
        'eventUserIdStr': eventUserIdStr,
        'profileUserIdStr': profileUserIdStr,
        'currentUserIdStr': currentUserIdStr,
        'eventUserIdStr === profileUserIdStr': eventUserIdStr === profileUserIdStr,
        'eventUserIdStr === currentUserIdStr': eventUserIdStr === currentUserIdStr,
        'isCurrentUser && eventUserIdStr === currentUserIdStr': isCurrentUser && eventUserIdStr === currentUserIdStr
      });
      
      // Check if this review belongs to the current profile
      const isReviewForThisProfile = eventUserIdStr === profileUserIdStr || 
                                     eventUserIdStr === currentUserIdStr || 
                                     (isCurrentUser && eventUserIdStr === currentUserIdStr);
      
      // Only update if this is the current user's profile or we're viewing our own profile
      if (isReviewForThisProfile) {
        console.log('🔥✅ ProfilePage: USER IDs MATCH - adding new review to user profile:', review.id);
        
        // Add the new review to the top of the user's reviews
        setUserReviews(prevReviews => {
          console.log('🔄 ProfilePage: Current user reviews count:', prevReviews.length);
          console.log('🔄 ProfilePage: Current user reviews IDs:', prevReviews.map(r => r.id));
          
          // Check if review already exists to avoid duplicates
          const existingIndex = prevReviews.findIndex(r => r.id === review.id);
          if (existingIndex !== -1) {
            console.log('⚠️ ProfilePage: Review already exists at index', existingIndex, ', skipping');
            return prevReviews; // Review already exists
          }
          // Add new review to the top
          console.log('✅ ProfilePage: Adding new review to profile reviews, new count will be:', prevReviews.length + 1);
          const newReviews = [review, ...prevReviews];
          console.log('✅ ProfilePage: New reviews array:', newReviews.map(r => ({ id: r.id, title: r.title })));
          return newReviews;
        });
        
        // Update user profile stats if available
        if (userProfile) {
          setUserProfile(prev => prev ? {
            ...prev,
            stats: {
              ...prev.stats,
              totalReviews: (prev.stats?.totalReviews || 0) + 1
            }
          } : null);
          console.log('✅ ProfilePage: Updated profile stats');
        }
        
        console.log('🔥✅ ProfilePage: SUCCESS - new review added to profile');
      } else {
        console.log('🔥❌ ProfilePage: USER IDs DO NOT MATCH - not adding review to profile');
        console.log('🔥❌ Comparison results:', {
          'eventUserIdStr === profileUserIdStr': eventUserIdStr === profileUserIdStr,
          'eventUserIdStr === currentUserIdStr': eventUserIdStr === currentUserIdStr,
          'isCurrentUser': isCurrentUser,
          'isReviewForThisProfile': isReviewForThisProfile
        });
        
        // Fallback: If this looks like it could be for the current user, manually refresh
        if (isCurrentUser) {
          console.log('🔄 ProfilePage: Attempting manual refresh as fallback for current user');
          setTimeout(() => {
            const userId = userIdentifier || currentUser?.id;
            if (userId) {
              loadUserReviews(userId, 1, true);
            }
          }, 1000);
        }
      }
    };

    // Add event listener
    window.addEventListener('reviewCreated', handleReviewCreated as EventListener);
    console.log('🎯 ProfilePage: Event listener ADDED for reviewCreated - ready to receive real events');
    
    // Cleanup
    return () => {
      console.log('🎯 ProfilePage: Event listener REMOVED for reviewCreated');
      window.removeEventListener('reviewCreated', handleReviewCreated as EventListener);
    };
  }, [userProfile?.id, currentUser?.id, isCurrentUser]);

  const loadUserReviews = async (userId: string, page: number, reset: boolean = false) => {
    try {
      setReviewsLoading(true);
      
      console.log('📊 ProfilePage: Loading user reviews with full stats for userId:', userId, 'page:', page, 'reset:', reset, 'isCurrentUser:', isCurrentUser);
      console.log('📊 ProfilePage: Current state:', {
        userProfile: userProfile ? { id: userProfile.id, name: userProfile.name } : null,
        currentUser: currentUser ? { id: currentUser.id, username: currentUser.username } : null,
        userIdentifier
      });
      
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('📊 ProfilePage: Invalid userId provided to loadUserReviews:', userId);
        setUserReviews([]);
        setHasMoreReviews(false);
        return;
      }
      
      // Use optimized reviewStatsService for single API call with complete data  
      const result = await reviewStatsService.getUserReviewsWithStats(userId, {
        page,
        limit: 5,
        includeAnonymous: isCurrentUser
      });

      console.log('📊 ProfilePage: Got reviews with stats:', {
        count: result.reviews.length,
        hasMore: result.hasMore,
        sampleReview: result.reviews[0] ? {
          id: result.reviews[0].id,
          reactions: result.reviews[0].reactions,
          user_reaction: result.reviews[0].user_reaction,
          view_count: result.reviews[0].view_count,
          comments_length: result.reviews[0].comments?.length
        } : null
      });

      const reviews = result.reviews || [];
      const hasMore = result.hasMore || false;

      if (reset) {
        setUserReviews(reviews);
        setReviewsPage(1);
      } else {
        setUserReviews(prev => [...prev, ...reviews]);
      }
      
      setHasMoreReviews(hasMore);
      
    } catch (err) {
      console.error('📊 ProfilePage: Error loading user reviews:', err);
      if (reset) {
        setUserReviews([]);
        setReviewsPage(1);
      }
      setHasMoreReviews(false);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadUserEntities = async (userId: string, page: number, reset: boolean = false) => {
    try {
      setEntitiesLoading(true);
      // Loading user entities for profile page
      
      const result = await entityService.getEntitiesByUser(userId, {
        page,
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      // Entities result received

      const entities = result.entities || [];
      const hasMore = result.hasMore || false;

      if (reset) {
        setUserEntities(entities);
        setEntitiesPage(1);
        // Set user entities for display
      } else {
        setUserEntities(prev => {
          const newEntities = [...prev, ...entities];
          // Added entities to existing list
          return newEntities;
        });
      }
      
      setHasMoreEntities(hasMore);
      
    } catch (err) {
      console.error('Error loading user entities:', err);
      if (reset) {
        setUserEntities([]);
        setEntitiesPage(1);
      }
      setHasMoreEntities(false);
    } finally {
      setEntitiesLoading(false);
    }
  };

  const handleLoadMoreReviews = async () => {
    if (userProfile && !reviewsLoading && hasMoreReviews) {
      const nextPage = reviewsPage + 1;
      setReviewsPage(nextPage);
      const userId = userIdentifier || userProfile.id;
      await loadUserReviews(userId, nextPage);
    }
  };

  const handleLoadMoreEntities = async () => {
    if (userProfile && !entitiesLoading && hasMoreEntities) {
      const nextPage = entitiesPage + 1;
      setEntitiesPage(nextPage);
      const userId = userIdentifier || userProfile.id;
      await loadUserEntities(userId, nextPage);
    }
  };

  const handleFollow = async () => {
    if (!userProfile || !currentUser) return;
    
    try {
      const isFollowing = userProfile.followers?.includes(currentUser.id);
      
      if (isFollowing) {
        await userService.unfollowUser(userProfile.id);
        setUserProfile(prev => prev ? {
          ...prev,
          followers: prev.followers?.filter(id => id !== currentUser.id) || []
        } : null);
        showToast('User unfollowed successfully', 'info');
      } else {
        await userService.followUser(userProfile.id);
        setUserProfile(prev => prev ? {
          ...prev,
          followers: [...(prev.followers || []), currentUser.id]
        } : null);
        showToast('User followed successfully', 'success');
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      showToast('Failed to update follow status', 'error');
    }
  };

  const handleAddToCircle = async () => {
    if (!userProfile || !currentUser) {
      showToast('Please sign in to add users to your circle', 'error');
      return;
    }
    
    // Open the Add To Circle modal
    setAddToCircleModal(true);
  };

  const handleMessage = async () => {
    if (!userProfile || !currentUser) {
      showToast('Please sign in to send messages', 'error');
      return;
    }
    
    // Open the Message modal
    setMessageModal(true);
  };

  // Action Handlers
  const handleEntityDropdown = (entity: Entity, buttonRef: React.RefObject<HTMLButtonElement>) => {
    setEntityDropdown({ open: true, entity, buttonRef });
  };

  const handleReviewDropdown = (review: Review, buttonRef: React.RefObject<HTMLButtonElement>) => {
    setReviewDropdown({ open: true, review, buttonRef });
  };

  const getEntityDropdownActions = (entity: Entity) => {
    const actions = [];

    const shouldShowEditDelete = (userIdentifier && userProfile && userIdentifier === userProfile.id.toString()) || isCurrentUser;
    
    if (shouldShowEditDelete) {
      actions.push(
        {
          label: 'Edit Entity',
          icon: '✏️',
          onClick: () => setEditEntityModal({ open: true, entity })
        },
        {
          label: 'Delete Entity',
          icon: '🗑️',
          onClick: () => handleDeleteEntity(entity),
          variant: 'danger' as const
        },
        {
          label: '---',
          icon: '',
          onClick: () => {}
        }
      );
    }

    actions.push(
      {
        label: 'Pin on top of profile',
        icon: '📌',
        onClick: () => console.log('Pin entity', entity)
      },
      {
        label: 'Copy link to entity',
        icon: '🔗',
        onClick: () => {
          navigator.clipboard.writeText(`${window.location.origin}/entity/${entity.id}`);
          showToast('Link copied to clipboard', 'success');
        }
      },
      {
        label: 'Embed this entity',
        icon: '📋',
        onClick: () => console.log('Embed entity', entity)
      }
    );

    return actions;
  };

  const getReviewDropdownActions = (review: Review) => {
    const actions = [];

    if (isCurrentUser) {
      actions.push(
        {
          label: 'Edit Review',
          icon: '✏️',
          onClick: () => setEditReviewModal({ open: true, review })
        },
        {
          label: 'Delete Review',
          icon: '🗑️',
          onClick: () => handleDeleteReview(review),
          variant: 'danger' as const
        },
        {
          label: '---',
          icon: '',
          onClick: () => {}
        }
      );
    }

    actions.push(
      {
        label: 'Pin on top of profile',
        icon: '📌',
        onClick: () => console.log('Pin review', review)
      },
      {
        label: 'Copy link to review',
        icon: '🔗',
        onClick: () => {
          navigator.clipboard.writeText(`${window.location.origin}/review/${review.id}`);
          showToast('Link copied to clipboard', 'success');
        }
      },
      {
        label: 'Embed this review',
        icon: '📋',
        onClick: () => console.log('Embed review', review)
      }
    );

    return actions;
  };

  // Profile Actions
  const handleEditProfile = () => {
    setEditProfileModal(true);
  };

  const handleSaveProfile = async (updatedProfile: Partial<UserProfile>) => {
    try {
      console.log('handleSaveProfile called with:', updatedProfile);
      console.log('Current userProfile:', userProfile);
      
      const result = await userService.updateUserProfile(userProfile!.id, updatedProfile);
      console.log('Update result:', result);
      
      setUserProfile(prev => {
        const newProfile = prev ? { ...prev, ...result } : null;
        console.log('New profile state:', newProfile);
        return newProfile;
      });
      
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile', 'error');
      throw err;
    }
  };

  // Entity Actions
  const handleSaveEntity = async (updatedEntity: Partial<Entity>) => {
    try {
      const result = await entityService.updateEntity(editEntityModal.entity!.id, updatedEntity);
      setUserEntities(prev => prev.map(e => e.id === result.id ? result : e));
      showToast('Entity updated successfully', 'success');
    } catch (err) {
      console.error('Error updating entity:', err);
      showToast('Failed to update entity', 'error');
      throw err;
    }
  };

  const handleDeleteEntity = (entity: Entity) => {
    setDeleteModal({
      open: true,
      type: 'entity',
      item: entity,
      title: 'Delete Entity',
      message: 'This will permanently delete this entity and all associated reviews.',
      warning: 'All reviews for this entity will also be deleted.'
    });
  };

  const handleConfirmDeleteEntity = async () => {
    try {
      await entityService.deleteEntity(deleteModal.item.id);
      setUserEntities(prev => prev.filter(e => e.id !== deleteModal.item.id));
      showToast('Entity deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting entity:', err);
      showToast('Failed to delete entity', 'error');
      throw err;
    }
  };

  // Review Actions
  const handleSaveReview = async (updatedReview: Partial<Review>) => {
    try {
      const result = await reviewService.updateReview(editReviewModal.review!.id, updatedReview);
      setUserReviews(prev => prev.map(r => r.id === result.id ? result : r));
      showToast('Review updated successfully', 'success');
    } catch (err) {
      console.error('Error updating review:', err);
      showToast('Failed to update review', 'error');
      throw err;
    }
  };

  const handleDeleteReview = (review: Review) => {
    setDeleteModal({
      open: true,
      type: 'review',
      item: review,
      title: 'Delete Review',
      message: 'This will permanently delete your review and all associated interactions.',
      warning: 'All comments and reactions on this review will also be deleted.'
    });
  };

  const handleConfirmDeleteReview = async () => {
    try {
      await reviewService.deleteReview(deleteModal.item.id);
      setUserReviews(prev => prev.filter(r => r.id !== deleteModal.item.id));
      showToast('Review deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting review:', err);
      showToast('Failed to delete review', 'error');
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    switch (deleteModal.type) {
      case 'entity':
        await handleConfirmDeleteEntity();
        break;
      case 'review':
        await handleConfirmDeleteReview();
        break;
    }
  };

  // Utility Functions
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Reaction and Comment Handlers for consistent stats
  const handleReactionChange = async (reviewId: string, reaction: string | null) => {
    try {
      console.log('📊 ProfilePage: Handling reaction change for review', reviewId, 'reaction:', reaction);
      
      // Save to userInteractionService cache for persistence across page refreshes
      const { userInteractionService } = await import('../../api/services/userInteractionService');
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
      
      // Let the useReviewCard hook handle the optimistic update
      // Just update the service cache for persistence
      await reviewStatsService.updateReviewStats(reviewId, {
        user_reaction: reaction || undefined
      });
      
    } catch (error) {
      console.error('📊 ProfilePage: Error handling reaction change:', error);
    }
  };

  const handleCommentAdd = async (reviewId: string, _content: string, _parentId?: string) => {
    try {
      console.log('📊 ProfilePage: Handling comment add for review', reviewId);
      
      // Update local state to increment comment count
      setUserReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const newCommentCount = (review.comments?.length || 0) + 1;
            return {
              ...review,
              comments: new Array(newCommentCount).fill(null) // Placeholder array
            };
          }
          return review;
        })
      );

      // Update the service cache
      await reviewStatsService.updateReviewStats(reviewId, {
        comment_count_change: 1
      });
      
    } catch (error) {
      console.error('📊 ProfilePage: Error handling comment add:', error);
    }
  };

  const handleCommentDelete = async (reviewId: string, _commentId: string) => {
    try {
      console.log('📊 ProfilePage: Handling comment delete for review', reviewId);
      
      // Update local state to decrement comment count
      setUserReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const newCommentCount = Math.max(0, (review.comments?.length || 0) - 1);
            return {
              ...review,
              comments: new Array(newCommentCount).fill(null) // Placeholder array
            };
          }
          return review;
        })
      );

      // Update the service cache
      await reviewStatsService.updateReviewStats(reviewId, {
        comment_count_change: -1
      });
      
    } catch (error) {
      console.error('📊 ProfilePage: Error handling comment delete:', error);
    }
  };

  const handleCommentReaction = async (reviewId: string, commentId: string, _reaction: string | null) => {
    try {
      console.log('📊 ProfilePage: Handling comment reaction for review', reviewId, 'comment', commentId);
      // Comment reactions don't affect review stats directly, so no need to update review state
      // This handler is here for consistency with the API
    } catch (error) {
      console.error('📊 ProfilePage: Error handling comment reaction:', error);
    }
  };

  const getUserStats = () => {
    if (!userProfile) return { totalReviews: 0, totalEntities: 0, averageRating: 0, joinDate: '', level: 1, points: 0, followers: 0, following: 0 };
    
    const totalReviews = userProfile.stats?.totalReviews || userReviews.length;
    const totalEntities = userEntities.length;
    const averageRating = userProfile.stats?.averageRatingGiven || 
      (userReviews.length > 0 
        ? userReviews.reduce((sum, review) => sum + review.overallRating, 0) / userReviews.length 
        : 0);
    
    const joinDate = userProfile.createdAt 
      ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })
      : 'Unknown';
    
    return {
      totalReviews,
      totalEntities,
      averageRating: Math.round(averageRating * 10) / 10,
      joinDate,
      level: userProfile.level || 1,
      points: userProfile.points || 0,
      followers: userProfile.followers?.length || 0,
      following: userProfile.following?.length || 0
    };
  };

  if (isLoading) {
    return (
      <ThreePanelLayout
        pageTitle="👤 User Profile"
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Profile Suggestions"
        centerPanelWidth="700px"
        headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
        centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ThreePanelLayout>
    );
  }

  if (error) {
    return (
      <ThreePanelLayout
        pageTitle="👤 User Profile"
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Profile Suggestions"
        centerPanelWidth="700px"
        headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
        centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  if (!userProfile) {
    return (
      <ThreePanelLayout
        pageTitle="👤 User Profile"
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Profile Suggestions"
        centerPanelWidth="700px"
        headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
        centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <ThreePanelLayout
        pageTitle="👤 User Profile"
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Profile Suggestions"
        centerPanelWidth="700px"
        headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
        centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  const stats = getUserStats();

  return (
    <ThreePanelLayout
      pageTitle={`👤 ${userProfile.name || userProfile.username}'s Profile`}
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Profile Suggestions"
      centerPanelWidth="700px"
      headerGradient="from-cyan-600 via-blue-600 to-indigo-800"
      centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      variant="full-width"
    >
      {/* User Profile Middle Panel Content */}
      {/* Modular Profile Header */}
      <ModularProfileHeader
        userProfile={userProfile}
        isOwnProfile={isOwnProfile}
        currentUser={currentUser}
        stats={stats}
        onEditProfile={handleEditProfile}
        onFollow={handleFollow}
        onMessage={handleMessage}
        onAddToCircle={handleAddToCircle}
      />

      {/* Modular Profile Stats */}
      <ModularProfileStats
        userProfile={userProfile}
        isOwnProfile={isOwnProfile}
        stats={stats}
      />

      {/* Modular Entities Section */}
      <ModularProfileEntitiesSection
        entities={userEntities}
        isCurrentUser={isCurrentUser}
        userName={userProfile.name}
        isLoading={entitiesLoading}
        hasMore={hasMoreEntities}
        onLoadMore={handleLoadMoreEntities}
        onEntityDropdown={handleEntityDropdown}
        entityDropdownState={entityDropdown}
        onCloseEntityDropdown={() => setEntityDropdown({ open: false, entity: null, buttonRef: null })}
        getEntityDropdownActions={getEntityDropdownActions}
      />

      {/* Modular Reviews Section - No entities prop needed, reviews include full entity data */}
      <ModularProfileReviewsSection
        reviews={userReviews}
        entities={[]} // Empty array - reviews now include full entity data from optimized backend
        isCurrentUser={isCurrentUser}
        userName={userProfile.name}
        isLoading={reviewsLoading}
        hasMore={hasMoreReviews}
        onLoadMore={handleLoadMoreReviews}
        onReactionChange={handleReactionChange}
        onCommentAdd={handleCommentAdd}
        onCommentDelete={handleCommentDelete}
        onCommentReaction={handleCommentReaction}
      />
      

      {/* Existing Modals */}
      <EditProfileModal
        isOpen={editProfileModal}
        onClose={() => setEditProfileModal(false)}
        userProfile={userProfile}
        onSave={handleSaveProfile}
      />

      <EditEntityModal
        isOpen={editEntityModal.open}
        onClose={() => setEditEntityModal({ open: false, entity: null })}
        entity={editEntityModal.entity!}
        onSave={handleSaveEntity}
      />

      <EditReviewModal
        isOpen={editReviewModal.open}
        onClose={() => setEditReviewModal({ open: false, review: null })}
        review={editReviewModal.review!}
        onSave={handleSaveReview}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        itemName={deleteModal.item?.name || deleteModal.item?.title || 'Item'}
        type={deleteModal.type}
        warningMessage={deleteModal.warning}
      />

      {/* New Beautiful Modals */}
      {userProfile && currentUser && (
        <>
          <AddToCircleModal
            isOpen={addToCircleModal}
            onClose={() => setAddToCircleModal(false)}
            userProfile={userProfile}
            currentUser={currentUser}
          />

          <MessageModal
            isOpen={messageModal}
            onClose={() => setMessageModal(false)}
            userProfile={userProfile}
            currentUser={currentUser}
          />
        </>
      )}

      {/* Toast Notifications */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </ThreePanelLayout>
  );
};

export default ModularUserProfilePage;