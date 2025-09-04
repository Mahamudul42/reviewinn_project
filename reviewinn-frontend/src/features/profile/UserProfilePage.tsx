import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { userService, homepageService, entityService, reviewService } from '../../api/services';
import { reviewStatsService } from '../../services/reviewStatsService';
import { useToast } from '../../shared/components/ToastProvider';
import { circleService } from '../../api/services/circleService';
import { professionalMessagingService } from '../../api/services/messaging';

// Import organized components
import {
  ProfileLayout,
  ProfileLoading,
  ProfileError,
  ProfileNotFound,
  ProfileHeader,
  ProfileStats,
  ProfileEntities,
  ProfileReviews
} from './components';
import EditProfileModal from './components/EditProfileModal';
import AddToCircleModal from './components/AddToCircleModal';
import MessageModal from './components/MessageModal';
import EditEntityModal from './components/EditEntityModal';
import EditReviewModal from './components/EditReviewModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

import type { UserProfile, Review, Entity } from '../../types';

/**
 * Clean, organized User Profile Page with separated concerns
 * Features:
 * - Clean component architecture 
 * - Separated layout, data, and business logic
 * - Reusable components for different profile sections
 * - Comprehensive error handling and loading states
 * - Mobile-responsive design
 */
const UserProfilePage: React.FC = () => {
  const { userIdentifier } = useParams<{ userIdentifier: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Core Data State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [userEntities, setUserEntities] = useState<Entity[]>([]);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  
  // UI States
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [hasMoreEntities, setHasMoreEntities] = useState(false);
  
  // Modal States
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editEntityModal, setEditEntityModal] = useState<{ open: boolean; entity: Entity | null }>({ open: false, entity: null });
  const [editReviewModal, setEditReviewModal] = useState<{ open: boolean; review: Review | null }>({ open: false, review: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; type: 'entity' | 'review' | null; item: any }>({ open: false, type: null, item: null });
  const [addToCircleModal, setAddToCircleModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  
  // Dropdown States
  const [entityDropdown, setEntityDropdown] = useState<{ open: boolean; entity: Entity | null; buttonRef: React.RefObject<HTMLButtonElement> | null }>({ open: false, entity: null, buttonRef: null });
  const [reviewDropdown, setReviewDropdown] = useState<{ open: boolean; review: Review | null; buttonRef: React.RefObject<HTMLButtonElement> | null }>({ open: false, review: null, buttonRef: null });
  
  
  // Pagination States
  const [reviewPage, setReviewPage] = useState(1);
  const [entityPage, setEntityPage] = useState(1);
  
  // Performance Refs
  const lastUserId = useRef<string | null>(null);
  const lastUserIdentifier = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Memoized computed values
  const isCurrentUser = useMemo(() => {
    if (!currentUser || authLoading) return false;
    
    if (!userIdentifier) {
      return true;
    }
    
    if (userProfile) {
      return userProfile.id.toString() === currentUser.id || 
             userProfile.user_id?.toString() === currentUser.id ||
             userProfile.username === currentUser.username;
    }
    
    return currentUser.id === userIdentifier || currentUser.username === userIdentifier;
  }, [userIdentifier, userProfile?.id, userProfile?.user_id, userProfile?.username, currentUser?.id, currentUser?.username, authLoading]);

  const isOwnProfile = useMemo(() => isCurrentUser, [isCurrentUser]);

  // Core Data Loading Functions
  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const targetUserId = userIdentifier || currentUser?.id;
      
      if (!targetUserId) {
        throw new Error('No user identifier provided');
      }

      console.log('🔍 ProfilePage: Loading profile for identifier:', targetUserId);
      
      const profileData = await userService.getUserProfileByIdentifier(targetUserId);
      console.log('✅ ProfilePage: Profile loaded successfully:', profileData);
      
      setUserProfile(profileData);
      
      if (profileData?.id) {
        await Promise.all([
          loadUserReviews(profileData.id.toString(), 1, true),
          loadUserEntities(profileData.id.toString(), 1, true)
        ]);
      }
      
    } catch (err) {
      console.error('❌ ProfilePage: Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [userIdentifier, currentUser]);

  const loadUserReviews = async (userId: string, page: number, reset: boolean = false) => {
    try {
      setReviewsLoading(true);
      
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('📊 ProfilePage: Invalid userId provided to loadUserReviews:', userId);
        setUserReviews([]);
        setHasMoreReviews(false);
        return;
      }

      console.log('📊 ProfilePage: Loading user reviews for userId:', userId, 'page:', page);
      
      const response = await userService.getUserReviews(userId, { page, limit: 10 });
      console.log('📊 ProfilePage: Reviews loaded:', response);
      
      const newReviews = response.reviews || [];
      
      setUserReviews(prev => reset ? newReviews : [...prev, ...newReviews]);
      setHasMoreReviews(response.hasMore || false);
      setReviewPage(page);
      
    } catch (err) {
      console.error('📊 ProfilePage: Error loading user reviews:', err);
      if (reset) {
        setUserReviews([]);
      }
      setHasMoreReviews(false);
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadUserEntities = async (userId: string, page: number, reset: boolean = false) => {
    try {
      setEntitiesLoading(true);
      
      if (!userId || userId === 'undefined' || userId === 'null') {
        console.error('🏢 ProfilePage: Invalid userId provided to loadUserEntities:', userId);
        setUserEntities([]);
        setHasMoreEntities(false);
        return;
      }

      console.log('🏢 ProfilePage: Loading user entities for userId:', userId, 'page:', page);
      
      const response = await entityService.getEntitiesByUser(userId, { page, limit: 12 });
      console.log('🏢 ProfilePage: Entities loaded:', response);
      
      const newEntities = response.entities || [];
      
      setUserEntities(prev => reset ? newEntities : [...prev, ...newEntities]);
      setHasMoreEntities(response.hasMore || false);
      setEntityPage(page);
      
    } catch (err) {
      console.error('🏢 ProfilePage: Error loading user entities:', err);
      if (reset) {
        setUserEntities([]);
      }
      setHasMoreEntities(false);
    } finally {
      setEntitiesLoading(false);
    }
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (authLoading) return;
    
    const currentUserId = currentUser?.id || null;
    const currentUserIdentifier = userIdentifier;
    
    if (lastUserId.current === currentUserId && 
        lastUserIdentifier.current === currentUserIdentifier && 
        hasLoadedRef.current) {
      return;
    }
    
    lastUserId.current = currentUserId;
    lastUserIdentifier.current = currentUserIdentifier;
    hasLoadedRef.current = true;
    
    loadUserProfile();
  }, [userIdentifier, currentUser?.id, authLoading, loadUserProfile]);

  // Event Handlers
  const handleLoadMoreReviews = () => {
    if (userProfile?.id && !reviewsLoading) {
      loadUserReviews(userProfile.id.toString(), reviewPage + 1);
    }
  };

  const handleLoadMoreEntities = () => {
    if (userProfile?.id && !entitiesLoading) {
      loadUserEntities(userProfile.id.toString(), entityPage + 1);
    }
  };

  const handleEditProfile = () => {
    setEditProfileModal(true);
  };

  const handleFollow = async () => {
    if (!userProfile || !currentUser) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to follow users',
        icon: '🔒'
      });
      return;
    }

    try {
      const isFollowing = userProfile.followers?.includes(currentUser.id);
      
      if (isFollowing) {
        await userService.unfollowUser(userProfile.id);
        setUserProfile(prev => prev ? {
          ...prev,
          followers: prev.followers?.filter(id => id !== currentUser.id) || []
        } : null);
        showToast({
          type: 'info',
          title: 'Unfollowed',
          message: 'User unfollowed successfully',
          icon: '👋'
        });
      } else {
        await userService.followUser(userProfile.id);
        setUserProfile(prev => prev ? {
          ...prev,
          followers: [...(prev.followers || []), currentUser.id]
        } : null);
        showToast({
          type: 'success',
          title: 'Following',
          message: 'User followed successfully',
          icon: '✅'
        });
      }
    } catch (err) {
      console.error('Error following/unfollowing user:', err);
      showToast({
        type: 'error',
        title: 'Follow Failed',
        message: 'Failed to update follow status',
        icon: '⚠️'
      });
    }
  };

  const handleAddToCircle = () => {
    if (!userProfile || !currentUser) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to add users to your circle',
        icon: '🔒'
      });
      return;
    }
    setAddToCircleModal(true);
  };

  const handleMessage = () => {
    if (!userProfile || !currentUser) {
      showToast({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to send messages',
        icon: '🔒'
      });
      return;
    }
    setMessageModal(true);
  };

  // Utility Functions
  const { showToast } = useToast();

  const getUserStats = () => {
    if (!userProfile) return { 
      totalReviews: 0, 
      totalEntities: 0, 
      averageRating: 0, 
      joinDate: '', 
      level: 1, 
      points: 0, 
      followers: 0, 
      following: 0 
    };
    
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

  // Action handlers for dropdowns
  const getEntityDropdownActions = (entity: Entity) => {
    const actions = [];
    const shouldShowEditDelete = isCurrentUser;
    
    if (shouldShowEditDelete) {
      actions.push({
        label: 'Edit Entity',
        action: () => setEditEntityModal({ open: true, entity }),
        icon: Edit
      });
      
      actions.push({
        label: 'Delete Entity',
        action: () => setDeleteModal({ open: true, type: 'entity', item: entity }),
        icon: Trash2,
        variant: 'danger' as const
      });
    }
    
    return actions;
  };

  // Loading States
  if (authLoading) {
    return <ProfileLoading message="Authenticating..." />;
  }

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (error) {
    return <ProfileError error={error} onRetry={() => window.location.reload()} />;
  }

  if (!userProfile) {
    return <ProfileNotFound />;
  }

  const stats = getUserStats();

  return (
    <ProfileLayout userProfile={userProfile}>
      {/* Profile Header */}
      <ProfileHeader
        userProfile={userProfile}
        isOwnProfile={isOwnProfile}
        currentUser={currentUser}
        stats={stats}
        onEditProfile={handleEditProfile}
        onFollow={handleFollow}
        onMessage={handleMessage}
        onAddToCircle={handleAddToCircle}
      />

      {/* Profile Stats */}
      <ProfileStats
        userProfile={userProfile}
        isOwnProfile={isOwnProfile}
        stats={stats}
      />

      {/* Profile Entities */}
      <ProfileEntities
        entities={userEntities}
        isCurrentUser={isCurrentUser}
        userName={userProfile.name || userProfile.username}
        isLoading={entitiesLoading}
        hasMore={hasMoreEntities}
        onLoadMore={handleLoadMoreEntities}
        onEntityDropdown={(entity, buttonRef) => setEntityDropdown({ open: true, entity, buttonRef })}
        entityDropdownState={entityDropdown}
        onCloseEntityDropdown={() => setEntityDropdown({ open: false, entity: null, buttonRef: null })}
        getEntityDropdownActions={getEntityDropdownActions}
      />

      {/* Profile Reviews */}
      <ProfileReviews
        reviews={userReviews}
        entities={[]}
        isCurrentUser={isCurrentUser}
        userName={userProfile.name || userProfile.username}
        isLoading={reviewsLoading}
        hasMore={hasMoreReviews}
        onLoadMore={handleLoadMoreReviews}
        onReactionChange={async (reviewId, reaction) => {
          // Handle reaction changes
          console.log('Reaction change:', reviewId, reaction);
        }}
        onCommentAdd={async (reviewId, content, parentId) => {
          // Handle comment additions
          console.log('Comment add:', reviewId, content, parentId);
        }}
        onCommentDelete={async (reviewId, commentId) => {
          // Handle comment deletions
          console.log('Comment delete:', reviewId, commentId);
        }}
        onCommentReaction={async (reviewId, commentId, reaction) => {
          // Handle comment reactions
          console.log('Comment reaction:', reviewId, commentId, reaction);
        }}
      />

      {/* Modals */}
      {editProfileModal && (
        <EditProfileModal
          isOpen={editProfileModal}
          onClose={() => setEditProfileModal(false)}
          userProfile={userProfile}
          onSave={(updatedProfile) => {
            setUserProfile(updatedProfile);
            setEditProfileModal(false);
            showToast({
              type: 'success',
              title: 'Profile Updated',
              message: 'Profile updated successfully',
              icon: '✅'
            });
          }}
        />
      )}

      {addToCircleModal && (
        <AddToCircleModal
          isOpen={addToCircleModal}
          onClose={() => setAddToCircleModal(false)}
          userProfile={userProfile}
          currentUser={currentUser}
        />
      )}

      {messageModal && (
        <MessageModal
          isOpen={messageModal}
          onClose={() => setMessageModal(false)}
          userProfile={userProfile}
          currentUser={currentUser}
        />
      )}

      {editEntityModal.open && editEntityModal.entity && (
        <EditEntityModal
          isOpen={editEntityModal.open}
          onClose={() => setEditEntityModal({ open: false, entity: null })}
          entity={editEntityModal.entity}
          onSave={(updatedEntity) => {
            // Update entity in the list
            setUserEntities(prev => prev.map(e => e.id === updatedEntity.id ? updatedEntity : e));
            setEditEntityModal({ open: false, entity: null });
            showToast({
              type: 'success',
              title: 'Entity Updated',
              message: 'Entity updated successfully',
              icon: '✅'
            });
          }}
        />
      )}

      {editReviewModal.open && editReviewModal.review && (
        <EditReviewModal
          isOpen={editReviewModal.open}
          onClose={() => setEditReviewModal({ open: false, review: null })}
          review={editReviewModal.review}
          onSave={(updatedReview) => {
            // Update review in the list
            setUserReviews(prev => prev.map(r => r.id === updatedReview.id ? updatedReview : r));
            setEditReviewModal({ open: false, review: null });
            showToast({
              type: 'success',
              title: 'Review Updated',
              message: 'Review updated successfully',
              icon: '✅'
            });
          }}
        />
      )}

      {deleteModal.open && (
        <DeleteConfirmationModal
          isOpen={deleteModal.open}
          onClose={() => setDeleteModal({ open: false, type: null, item: null })}
          title={`Delete ${deleteModal.type === 'entity' ? 'Entity' : 'Review'}`}
          message={`Are you sure you want to delete this ${deleteModal.type}? This action cannot be undone.`}
          onConfirm={async () => {
            try {
              if (deleteModal.type === 'entity' && deleteModal.item) {
                await entityService.deleteEntity(deleteModal.item.id);
                setUserEntities(prev => prev.filter(e => e.id !== deleteModal.item.id));
                showToast({
                  type: 'success',
                  title: 'Entity Deleted',
                  message: 'Entity deleted successfully',
                  icon: '✅'
                });
              } else if (deleteModal.type === 'review' && deleteModal.item) {
                await reviewService.deleteReview(deleteModal.item.id);
                setUserReviews(prev => prev.filter(r => r.id !== deleteModal.item.id));
                showToast({
                  type: 'success',
                  title: 'Review Deleted',
                  message: 'Review deleted successfully',
                  icon: '✅'
                });
              }
            } catch (error) {
              showToast({
                type: 'error',
                title: 'Delete Failed',
                message: `Failed to delete ${deleteModal.type}`,
                icon: '⚠️'
              });
            }
            setDeleteModal({ open: false, type: null, item: null });
          }}
        />
      )}

    </ProfileLayout>
  );
};

export default UserProfilePage;