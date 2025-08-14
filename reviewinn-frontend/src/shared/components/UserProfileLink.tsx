import React from 'react';
import { useUserProfile, createUserForProfile } from '../../hooks/useUserProfile';
import UserProfileModal from '../../features/messaging/components/UserProfileModal';

interface UserProfileLinkProps {
  user: any; // Any user data object
  children: React.ReactNode;
  className?: string;
  showActions?: boolean;
  onStartConversation?: (user: any) => void;
  onFollowUser?: (userId: number) => void;
  onUnfollowUser?: (userId: number) => void;
  isFollowing?: boolean;
  currentUserId?: number;
}

/**
 * Reusable component to make any element clickable to show user profile modal
 * 
 * Usage examples:
 * 
 * // Simple user name link
 * <UserProfileLink user={user}>
 *   <span className="text-blue-600 hover:underline">{user.name}</span>
 * </UserProfileLink>
 * 
 * // User avatar with profile
 * <UserProfileLink user={user} showActions={true}>
 *   <img src={user.avatar} className="w-8 h-8 rounded-full cursor-pointer" />
 * </UserProfileLink>
 * 
 * // In a review or comment component
 * <UserProfileLink user={review.author} currentUserId={currentUser.id}>
 *   <div className="flex items-center space-x-2">
 *     <img src={review.author.avatar} className="w-6 h-6 rounded-full" />
 *     <span className="font-medium">{review.author.name}</span>
 *   </div>
 * </UserProfileLink>
 */
const UserProfileLink: React.FC<UserProfileLinkProps> = ({
  user,
  children,
  className = '',
  showActions = true,
  onStartConversation,
  onFollowUser,
  onUnfollowUser,
  isFollowing = false,
  currentUserId
}) => {
  const { showProfileModal, selectedUser, openProfile, closeProfile } = useUserProfile();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't show profile for current user
    if (currentUserId && user?.user_id === currentUserId) {
      return;
    }

    const profileUser = createUserForProfile(user);
    openProfile(profileUser);
  };

  return (
    <>
      <div 
        onClick={handleClick}
        className={`cursor-pointer ${className}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick(e as any);
          }
        }}
      >
        {children}
      </div>

      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={showProfileModal}
          onClose={closeProfile}
          onStartConversation={onStartConversation}
          onFollowUser={onFollowUser}
          onUnfollowUser={onUnfollowUser}
          isFollowing={isFollowing}
          currentUserId={currentUserId}
          showActions={showActions}
        />
      )}
    </>
  );
};

export default UserProfileLink;