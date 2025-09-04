import { useState, useCallback } from 'react';
import type { ProfessionalUser } from '../api/services/messaging';

interface ExtendedUser extends ProfessionalUser {
  full_name?: string;
  email?: string;
  bio?: string;
  location?: string;
  joined_date?: string;
  review_count?: number;
  follower_count?: number;
  following_count?: number;
  level?: number;
  points?: number;
  is_verified?: boolean;
  is_premium?: boolean;
  last_active?: string;
}

interface UserProfileHookReturn {
  showProfileModal: boolean;
  selectedUser: ExtendedUser | null;
  openProfile: (user: ExtendedUser) => void;
  closeProfile: () => void;
}

export const useUserProfile = (): UserProfileHookReturn => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);

  const openProfile = useCallback((user: ExtendedUser) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  }, []);

  const closeProfile = useCallback(() => {
    setShowProfileModal(false);
    setSelectedUser(null);
  }, []);

  return {
    showProfileModal,
    selectedUser,
    openProfile,
    closeProfile
  };
};

// Utility function to create a user object compatible with the modal
export const createUserForProfile = (userData: any): ExtendedUser => {
  return {
    user_id: userData.user_id || userData.id,
    username: userData.username || '',
    name: userData.name || userData.display_name || userData.full_name || '',
    avatar: userData.avatar,
    full_name: userData.full_name,
    email: userData.email,
    bio: userData.bio,
    location: userData.location || userData.city,
    joined_date: userData.created_at || userData.joined_date,
    review_count: userData.review_count,
    follower_count: userData.follower_count,
    following_count: userData.following_count,
    level: userData.level,
    points: userData.points,
    is_verified: userData.is_verified,
    is_premium: userData.is_premium,
    last_active: userData.last_active_at || userData.last_active,
    is_online: userData.is_online,
    status: userData.status || (userData.is_online ? 'online' : 'offline')
  };
};