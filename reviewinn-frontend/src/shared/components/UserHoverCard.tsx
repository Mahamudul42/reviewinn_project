import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Users, MapPin, Calendar, Star, MessageCircle, UserPlus, Shield, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../api/services';
import { generateInitials } from '../utils/reviewUtils';

interface UserHoverCardProps {
  userId?: string;
  username?: string;
  fallbackName: string;
  fallbackAvatar?: string;
  children: React.ReactNode;
  delay?: number;
}

interface UserHoverData {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  joinedDate?: string;
  followersCount?: number;
  reviewsCount?: number;
  avgRating?: number;
  isVerified?: boolean;
  level?: number;
  isFollowing?: boolean;
}

const UserHoverCard: React.FC<UserHoverCardProps> = ({
  userId,
  username,
  fallbackName,
  fallbackAvatar,
  children,
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [userData, setUserData] = useState<UserHoverData | null>(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cache for user data to avoid repeated API calls
  const cacheRef = useRef<Map<string, { data: UserHoverData; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Check if we're on a touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  const identifier = userId || username || 'test-user';
  const isClickable = !!(userId || username || fallbackName);
  
  console.log('🎯 UserHoverCard setup:', {
    userId,
    username,
    identifier,
    fallbackName,
    isClickable,
    isTouchDevice
  });

  useEffect(() => {
    return () => {
      console.log('🔄 UserHoverCard: Component unmounting, cleaning up');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const fetchUserData = async (id: string): Promise<UserHoverData | null> => {
    // Check cache first
    const cached = cacheRef.current.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      setLoading(true);
      setError(false);
      
      // For testing, create mock data if no real ID
      if (id === 'test-user' || !userId) {
        console.log('🧪 UserHoverCard: Creating test data for', fallbackName);
        const userData: UserHoverData = {
          id: id,
          name: fallbackName,
          username: undefined,
          avatar: fallbackAvatar,
          bio: 'This is a test user profile for the hover modal.',
          location: 'Test City',
          joinedDate: 'January 2024',
          followersCount: 42,
          reviewsCount: 15,
          avgRating: 4.2,
          isVerified: false,
          level: 3,
          isFollowing: false
        };

        // Cache the data
        cacheRef.current.set(id, { data: userData, timestamp: Date.now() });
        return userData;
      }
      
      // Use the existing user service for real users
      const response = await userService.getUserProfileByIdentifier(id);
      
      const userData: UserHoverData = {
        id: response?.id || id,
        name: response?.name || response?.firstName + ' ' + response?.lastName || fallbackName,
        username: response?.username,
        avatar: response?.avatar,
        bio: response?.bio,
        location: response?.location,
        joinedDate: response?.joinedDate || response?.createdAt ? 
          new Date(response?.joinedDate || response?.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
          }) : undefined,
        followersCount: response?.followersCount || response?.stats?.followers || 0,
        reviewsCount: response?.reviewsCount || response?.stats?.totalReviews || 0,
        avgRating: response?.avgRating || response?.averageRating || 0,
        isVerified: response?.isVerified || false,
        level: response?.level || 1,
        isFollowing: response?.isFollowing || false
      };

      // Cache the data
      cacheRef.current.set(id, { data: userData, timestamp: Date.now() });
      
      return userData;
    } catch (error) {
      console.log('Failed to fetch user data for hover card:', error);
      setError(true);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculatePosition = (triggerElement: HTMLElement) => {
    const rect = triggerElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    const modalWidth = 320;
    const modalHeight = 280;
    const padding = 12;
    
    let x = rect.left + scrollLeft;
    let y = rect.bottom + scrollTop + padding;
    
    // Adjust for right edge
    if (x + modalWidth > window.innerWidth) {
      x = window.innerWidth - modalWidth - padding;
    }
    
    // Adjust for bottom edge
    if (y + modalHeight > window.innerHeight + scrollTop) {
      y = rect.top + scrollTop - modalHeight - padding;
    }
    
    // Ensure minimum distance from edges
    x = Math.max(padding, x);
    y = Math.max(padding, y);
    
    return { x, y };
  };

  const handleMouseEnter = async () => {
    console.log('🐭 UserHoverCard: Mouse enter triggered', {
      isClickable,
      isTouchDevice,
      identifier,
      fallbackName,
      hasTriggerRef: !!triggerRef.current
    });
    
    if (!isClickable || isTouchDevice) {
      console.log('🚫 UserHoverCard: Hover disabled', { isClickable, isTouchDevice });
      return;
    }
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      console.log('⏰ UserHoverCard: Timeout fired', {
        hasTriggerRef: !!triggerRef.current,
        identifier
      });
      
      if (!triggerRef.current) {
        console.log('❌ UserHoverCard: Trigger ref is null');
        return;
      }
      
      console.log('💫 UserHoverCard: Showing modal for', identifier);
      const position = calculatePosition(triggerRef.current);
      setPosition(position);
      console.log('📍 UserHoverCard: Position calculated', position);
      
      if (identifier) {
        console.log('🔄 UserHoverCard: Fetching user data for', identifier);
        const data = await fetchUserData(identifier);
        console.log('📦 UserHoverCard: Fetched user data', data);
        if (data) {
          setUserData(data);
          setIsVisible(true);
          console.log('✅ UserHoverCard: Modal should be visible now', { isVisible: true, userData: data });
        } else {
          console.log('❌ UserHoverCard: Failed to show modal', { hasData: !!data });
        }
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    console.log('🚪 UserHoverCard: Mouse leave triggered');
    if (timeoutRef.current) {
      console.log('🚫 UserHoverCard: Clearing show timeout');
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    hideTimeoutRef.current = setTimeout(() => {
      console.log('👋 UserHoverCard: Hiding modal after delay');
      setIsVisible(false);
    }, 100);
  };

  const handleModalMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }
  };

  const handleModalMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    if (userData && identifier) {
      navigate(`/profile/${userData.username || identifier}`);
    }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement follow functionality
    console.log('Follow clicked for user:', userData?.id);
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    // TODO: Implement messaging functionality
    console.log('Message clicked for user:', userData?.id);
  };

  const renderModal = () => {
    console.log('🎨 UserHoverCard: Render modal called', { isVisible, hasUserData: !!userData, userData });
    if (!isVisible || !userData) {
      console.log('🚫 UserHoverCard: Modal not rendered', { isVisible, userData });
      return null;
    }

    console.log('🎭 UserHoverCard: Creating modal portal', { position, userData });
    return createPortal(
      <div
        ref={modalRef}
        className="fixed z-[9999] pointer-events-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleModalMouseLeave}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 max-w-sm">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              {userData.avatar ? (
                <img 
                  src={userData.avatar} 
                  alt={userData.name} 
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {generateInitials(userData.name)}
                </div>
              )}
              {userData.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <Shield className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900 truncate">{userData.name}</h3>
                {userData.level && userData.level > 1 && (
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-lg flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    <span className="text-xs font-medium">L{userData.level}</span>
                  </div>
                )}
              </div>
              {userData.username && (
                <p className="text-gray-600 text-sm">@{userData.username}</p>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{userData.followersCount || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{userData.reviewsCount || 0}</span>
                </div>
                {userData.avgRating && userData.avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{userData.avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {userData.bio && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                {userData.bio}
              </p>
            </div>
          )}

          {/* Location & Join Date */}
          <div className="flex flex-col gap-2 mb-4 text-sm text-gray-600">
            {userData.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{userData.location}</span>
              </div>
            )}
            {userData.joinedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Joined {userData.joinedDate}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleProfileClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              View Profile
            </button>
            <button
              onClick={handleFollowClick}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              onClick={handleMessageClick}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderLoadingModal = () => {
    console.log('⏳ UserHoverCard: Render loading modal called', { isVisible, loading, hasUserData: !!userData });
    if (!isVisible || !loading || userData) {
      console.log('🚫 UserHoverCard: Loading modal not rendered', { isVisible, loading, userData });
      return null;
    }
    console.log('⏳ UserHoverCard: Creating loading modal portal');

    return createPortal(
      <div
        className="fixed z-[9999] pointer-events-auto"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseEnter={handleModalMouseEnter}
        onMouseLeave={handleModalMouseLeave}
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80 max-w-sm">
          <div className="animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-4/5"></div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-10 bg-gray-300 rounded-lg"></div>
              <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
              <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (!isClickable) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={!isTouchDevice ? handleMouseEnter : undefined}
        onMouseLeave={!isTouchDevice ? handleMouseLeave : undefined}
        className="inline-block"
      >
        {children}
      </div>
      {renderModal()}
      {renderLoadingModal()}
    </>
  );
};

export default UserHoverCard;