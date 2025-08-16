import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, TrendingUp, Settings, Search, Clock, Ban, Heart, UserCheck } from 'lucide-react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { circleService, homepageService } from '../../api/services';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import { useConfirmation, ConfirmationProvider } from '../../shared/components/ConfirmationSystem';
import CircleErrorBoundary from './components/CircleErrorBoundary';
import './circle-purple-buttons.css';
import { 
  CircleMembers, 
  CircleInvites, 
  SentRequests, 
  CircleSuggestions, 
  UserSearch, 
  CircleAnalytics as CircleAnalyticsComponent, 
  BlockedUsers, 
  CircleNavigation,
  UserSearchBar 
} from './components';
import UserActionsMenu from './components/UserActionsMenu';
import UserDisplay from './components/UserDisplay';
import type { 
  CircleMember, 
  CircleInvite, 
  CircleRequest, 
  CircleSuggestion,
  User,
  Review,
  Entity
} from '../../types';
import type { CircleAnalytics } from '../../types';
import { TrustLevel } from '../../types';
import { getUserId, createOptimisticRequest, persistRequestToLocalStorage } from './utils/circleHelpers';

// Main component
const ReviewCirclePageContent: React.FC = () => {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Initialize confirmation system
  const { confirm, prompt, showSuccess, showError } = useConfirmation();
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'sent' | 'suggestions' | 'search' | 'analytics' | 'blocked'>('members');
  
  // Track auth changes to prevent infinite loops
  const lastUserId = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for each tab
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CircleRequest[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<CircleInvite[]>([]);
  const [sentRequests, setSentRequestsData] = useState<CircleRequest[]>([]);
  const [suggestions, setSuggestions] = useState<CircleSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<CircleAnalytics | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'offline' | 'online'>('connecting');
  
  // Menu and search states
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  
  // Local tracking for sent requests (since API may not be available)
  const [localSentRequests, setLocalSentRequests] = useState<Set<string>>(new Set());
  // Track users who have rejected requests (cannot send again)
  const [rejectedUsers, setRejectedUsers] = useState<Set<string>>(new Set());
  

  // Create sets for quick lookup - track users we cannot send requests to
  const sentRequestsSet = useMemo(() => {
    const serverRequestIds = sentRequests
      .filter(req => req.status === 'pending')
      .map(req => getUserId(req.recipient || req.user || req.target_user))
      .filter(Boolean);
    
    const rejectedRequestIds = sentRequests
      .filter(req => req.status === 'rejected')
      .map(req => getUserId(req.recipient || req.user || req.target_user))
      .filter(Boolean);
    
    return new Set([
      ...serverRequestIds,
      ...Array.from(localSentRequests),
      ...rejectedRequestIds,
      ...Array.from(rejectedUsers)
    ]);
  }, [sentRequests, localSentRequests, rejectedUsers]);

  // Memoized callbacks to prevent infinite re-renders
  const handleSearchResults = useCallback((results: User[]) => {
    setSearchResults(results);
  }, []);

  const handleUserSelect = useCallback((user: User) => {
    console.log('Selected user:', user);
  }, []);
  
  // Left panel data

  // Tab configuration
  // Filter sent requests to only show pending ones (not accepted)
  const pendingSentRequests = sentRequests.filter(req => req.status === 'pending');
  
  
  const tabs = [
    { id: 'members' as const, label: 'Circle Mates', icon: Users, count: members.length },
    { id: 'invites' as const, label: 'Requests', icon: Clock, count: pendingRequests.length + receivedInvites.length },
    { id: 'sent' as const, label: 'Sent', icon: UserPlus, count: pendingSentRequests.length },
    { id: 'followers' as const, label: 'Followers', icon: Heart, count: followers.length },
    { id: 'following' as const, label: 'Following', icon: UserCheck, count: following.length },
    { id: 'suggestions' as const, label: 'Suggestions', icon: TrendingUp, count: suggestions.length },
    { id: 'search' as const, label: 'Find People', icon: Search, count: searchResults.length },
    { id: 'analytics' as const, label: 'Analytics', icon: Settings },
    { id: 'blocked' as const, label: 'Blocked', icon: Ban, count: blockedUsers.length }
  ];

  const loadCircleData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Show cached data immediately for better performance
      const userId = currentUser?.id || 'anonymous';
      const membersKey = `circle_members_${userId}`;
      const requestsKey = `circle_requests_${userId}`;
      const suggestionsKey = `circle_suggestions_${userId}`;
      
      // Load and display cached data immediately
      const savedMembers = localStorage.getItem(membersKey);
      const savedRequests = localStorage.getItem(requestsKey);
      const savedSuggestions = localStorage.getItem(suggestionsKey);
      
      if (savedMembers || savedRequests || savedSuggestions) {
        setMembers(savedMembers ? JSON.parse(savedMembers) : []);
        setSuggestions(savedSuggestions ? JSON.parse(savedSuggestions) : []);
        setPendingRequests(savedRequests ? JSON.parse(savedRequests) : []);
        setLoading(false);
      }
      
      // Load real data from API - currentUser is guaranteed to exist here
      setApiStatus('connecting');
      
      try {
        const [membersResponse, pendingRequestsResponse, sentRequestsResponse] = await Promise.allSettled([
          circleService.getMyCircleMembers({ page: 1, size: 50 }),
          circleService.getPendingRequests(),
          circleService.getSentRequests()
        ]);

        // Check if at least one API call succeeded
        const apiWorking = membersResponse.status === 'fulfilled' || pendingRequestsResponse.status === 'fulfilled';

        // Process responses
        if (membersResponse.status === 'fulfilled') {
          setMembers(membersResponse.value.members || []);
        }
        if (pendingRequestsResponse.status === 'fulfilled') {
          setPendingRequests(pendingRequestsResponse.value.requests || []);
        }
        if (sentRequestsResponse.status === 'fulfilled') {
          const requests = sentRequestsResponse.value.requests || [];
          setSentRequestsData(requests);
        } else {
          setSentRequestsData([]);
        }
        // Load secondary data
        Promise.allSettled([
          circleService.getReceivedInvites(),
          circleService.getSuggestions({ limit: 10 }),
          circleService.getAnalytics(),
          circleService.getBlockedUsers(),
          circleService.getFollowers(),
          circleService.getFollowing()
        ]).then(([receivedInvitesResponse, suggestionsResponse, analyticsResponse, blockedUsersResponse, followersResponse, followingResponse]) => {
          if (receivedInvitesResponse.status === 'fulfilled') {
            setReceivedInvites(receivedInvitesResponse.value.invites || []);
          }
          if (suggestionsResponse.status === 'fulfilled') {
            setSuggestions(suggestionsResponse.value.suggestions || []);
          }
          if (analyticsResponse.status === 'fulfilled') {
            setAnalytics(analyticsResponse.value || null);
          }
          if (blockedUsersResponse.status === 'fulfilled') {
            setBlockedUsers(blockedUsersResponse.value.blocked_users || []);
          }
          if (followersResponse.status === 'fulfilled') {
            setFollowers(followersResponse.value.followers || []);
          }
          if (followingResponse.status === 'fulfilled') {
            setFollowing(followingResponse.value.following || []);
          }
        });

        setApiStatus(apiWorking ? 'online' : 'offline');
      } catch (apiError) {
        console.error('API calls failed:', apiError);
        setApiStatus('offline');
        setError('Failed to connect to server. Please check your authentication.');
      }
    } catch (error) {
      console.error('Failed to load circle data:', error);
      setError('Failed to load circle data');
      setMembers([]);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const refreshData = useCallback(async () => {
    if (!currentUser) {
      console.log('❌ No current user, skipping data refresh');
      return;
    }
    
    console.log('🔄 Refreshing circle data for user:', currentUser.id);
    
    try {
      const [pendingRequestsResponse, sentRequestsResponse, membersResponse, followersResponse, followingResponse] = await Promise.allSettled([
        circleService.getPendingRequests(),
        circleService.getSentRequests(),
        circleService.getMyCircleMembers({ page: 1, size: 50 }),
        circleService.getFollowers(),
        circleService.getFollowing()
      ]);

      console.log('📊 Data refresh results:', {
        pending: pendingRequestsResponse.status,
        sent: sentRequestsResponse.status,
        members: membersResponse.status,
        followers: followersResponse.status,
        following: followingResponse.status
      });

      if (pendingRequestsResponse.status === 'fulfilled') {
        console.log('✅ Setting pending requests:', pendingRequestsResponse.value.requests?.length || 0);
        setPendingRequests(pendingRequestsResponse.value.requests);
      } else {
        console.error('❌ Pending requests failed:', pendingRequestsResponse.reason);
      }

      if (sentRequestsResponse.status === 'fulfilled') {
        console.log('✅ Setting sent requests:', sentRequestsResponse.value.requests?.length || 0);
        const serverSentRequests = sentRequestsResponse.value.requests || [];
        
        // If server returned empty but we have localStorage backup, use it
        if (serverSentRequests.length === 0) {
          try {
            const persistedSentRequests = JSON.parse(localStorage.getItem('reviewinn_sent_requests') || '[]');
            if (persistedSentRequests.length > 0) {
              console.log('🔄 Server returned empty, using localStorage backup:', persistedSentRequests.length);
              setSentRequestsData(persistedSentRequests);
              return; // Exit early, using localStorage data
            }
          } catch (error) {
            console.log('⚠️ Failed to load from localStorage:', error);
          }
        }
        
        // Merge server data with any local optimistic updates
        setSentRequestsData(prev => {
          // If we have local sent requests, merge them carefully
          if (localSentRequests.size > 0) {
            console.log('🔄 Merging server sent requests with local tracking');
            
            // Keep optimistic requests that aren't yet on server
            const optimisticRequests = prev.filter(req => {
              // Keep if it's a temporary ID (not yet on server)
              const isTemporary = typeof req.id === 'number' && req.id > 1000000000000; // Temp IDs are timestamps
              if (isTemporary) {
                const recipientId = String(req.recipient?.id || req.recipient?.user_id);
                // Only keep if not found in server data
                return !serverSentRequests.some(serverReq => 
                  String(serverReq.recipient?.id || serverReq.recipient?.user_id) === recipientId
                );
              }
              return false;
            });
            
            // Merge: server requests + remaining optimistic requests
            const mergedRequests = [...serverSentRequests, ...optimisticRequests];
            console.log('📊 Merged requests:', { server: serverSentRequests.length, optimistic: optimisticRequests.length, total: mergedRequests.length });
            return mergedRequests;
          } else {
            // No local tracking, just use server data
            return serverSentRequests;
          }
        });
      } else {
        console.error('❌ Sent requests failed:', sentRequestsResponse.reason);
        
        // Fallback to localStorage if server failed
        try {
          const persistedSentRequests = JSON.parse(localStorage.getItem('reviewinn_sent_requests') || '[]');
          if (persistedSentRequests.length > 0) {
            console.log('🔄 Server failed, using localStorage backup:', persistedSentRequests.length);
            setSentRequestsData(persistedSentRequests);
          }
        } catch (error) {
          console.log('⚠️ Failed to load from localStorage after server failure:', error);
        }
      }

      if (membersResponse.status === 'fulfilled') {
        console.log('✅ Setting members:', membersResponse.value.members?.length || 0);
        setMembers(membersResponse.value.members);
      } else {
        console.error('❌ Members failed:', membersResponse.reason);
      }

      if (followersResponse.status === 'fulfilled') {
        console.log('✅ Setting followers:', followersResponse.value.followers?.length || 0);
        setFollowers(followersResponse.value.followers);
      } else {
        console.error('❌ Followers failed:', followersResponse.reason);
      }

      if (followingResponse.status === 'fulfilled') {
        console.log('✅ Setting following:', followingResponse.value.following?.length || 0);
        setFollowing(followingResponse.value.following);
      } else {
        console.error('❌ Following failed:', followingResponse.reason);
      }

    } catch (error) {
      console.error('❌ Background refresh failed:', error);
    }
  }, [currentUser]);

  // Load circle data when authentication state is ready  
  useEffect(() => {
    // Wait for auth loading to complete
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    const currentUserId = currentUser?.id || null;
    
    // Only load if user ID changed or haven't loaded yet
    if (lastUserId.current === currentUserId && hasLoadedRef.current) {
      return;
    }
    
    // Update refs
    lastUserId.current = currentUserId;
    hasLoadedRef.current = true;
    
    if (currentUser) {
      console.log('Loading circle data for user:', currentUserId);
      loadCircleData();
    } else {
      // If not authenticated, show auth error
      setError('Authentication required. Please log in to view your circle.');
      setApiStatus('offline');
      setLoading(false);
    }
  }, [currentUser?.id, authLoading, loadCircleData]);

  // Auto-refresh data when visibility changes (but not too aggressively)
  useEffect(() => {
    let lastRefreshTime = 0;
    let lastUserActionTime = 0;
    
    // Track user actions to avoid interfering refreshes
    const trackUserAction = () => {
      lastUserActionTime = Date.now();
    };
    
    // Add event listeners to track user activity
    const events = ['click', 'keydown', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, trackUserAction, { passive: true });
    });
    
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && apiStatus === 'online') {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime;
        const timeSinceLastAction = now - lastUserActionTime;
        
        // Only refresh if:
        // - It's been more than 10 seconds since last refresh
        // - AND it's been more than 5 seconds since last user action (to avoid interfering with ongoing actions)
        if (timeSinceLastRefresh > 10000 && timeSinceLastAction > 5000) {
          console.log('👁️ Visibility change refresh (throttled)');
          refreshData();
          lastRefreshTime = now;
        } else {
          console.log('🚫 Visibility change refresh skipped (too recent or recent user action)', {
            timeSinceLastRefresh,
            timeSinceLastAction
          });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      events.forEach(event => {
        document.removeEventListener(event, trackUserAction);
      });
    };
  }, [currentUser, apiStatus, refreshData]);

  // Centralized localStorage management
  useEffect(() => {
    if (!currentUser) return;
    
    const userId = currentUser.id;
    const dataToCache = {
      members: members.length > 0 ? members : null,
      requests: pendingRequests,
      suggestions: suggestions
    };
    
    Object.entries(dataToCache).forEach(([key, data]) => {
      if (data !== null) {
        localStorage.setItem(`circle_${key}_${userId}`, JSON.stringify(data));
      }
    });
  }, [currentUser, members, pendingRequests, suggestions]);

  // Update analytics when members change
  useEffect(() => {
    if (members.length > 0) {
      const trustLevelBreakdown = members.reduce((acc: Record<string, number>, member: CircleMember) => {
        acc[member.trust_level] = (acc[member.trust_level] || 0) + 1;
        return acc;
      }, {});
      
      const averageTasteMatch = members.length > 0 
        ? members.reduce((sum: number, member: CircleMember) => sum + member.taste_match_score, 0) / members.length
        : 0;
      
      setAnalytics(prev => prev ? {
        ...prev,
        total_connections: members.length,
        trust_level_breakdown: trustLevelBreakdown,
        average_taste_match: averageTasteMatch,
        recent_connections: Math.max(0, members.length),
        circle_growth: {
          ...prev.circle_growth,
          this_month: Math.max(0, members.length),
          this_year: members.length
        }
      } : null);
    }
  }, [members]);

  const handleAddToCircle = async (userId: string | number, userName?: string): Promise<void> => {
    if (!currentUser) return;
    
    const userIdString = String(userId);
    
    // Check if request was already sent
    if (sentRequestsSet.has(userIdString)) {
      showError(`Circle request already sent to ${userName || 'this user'}.`);
      return;
    }
    
    const suggestion = suggestions.find(s => String(s.user.id) === userIdString);
    const newSentRequest = createOptimisticRequest(currentUser, suggestion, userIdString, userName);
    const tempRequestId = newSentRequest.id;
    
    // Optimistic UI updates
    setLocalSentRequests(prev => new Set([...prev, userIdString]));
    setSuggestions(prev => prev.filter(s => String(s.user.id) !== userIdString));
    setSentRequestsData(prev => {
      const exists = prev.some(req => getUserId(req.recipient) === userIdString);
      return exists ? prev : [newSentRequest, ...prev];
    });
    
    try {
      const result = await circleService.sendCircleRequest(userIdString, {
        message: `Hi ${userName || 'there'}! I'd like to connect with you in my review circle.`
      });
      
      // Update with real ID
      if (result.request_id) {
        setSentRequestsData(prev => prev.map(req => 
          req.id === tempRequestId ? { ...req, id: result.request_id } : req
        ));
        persistRequestToLocalStorage(newSentRequest, result.request_id);
      }
      
      // Background refresh
      setTimeout(async () => {
        try {
          const response = await circleService.getSentRequests();
          const serverRequests = response.requests || [];
          const requestExists = serverRequests.some(req => getUserId(req.recipient) === userIdString);
          
          if (requestExists) {
            setSentRequestsData(serverRequests);
            setLocalSentRequests(prev => {
              const newSet = new Set(prev);
              newSet.delete(userIdString);
              return newSet;
            });
          }
        } catch (error) {
          console.log('Background refresh failed:', error);
        }
      }, 1000);
      
      showSuccess(`Circle request sent to ${userName || 'user'}!`);
    } catch (error: any) {
      // Handle errors and revert optimistic updates
      const isConflict = error?.response?.status === 409 || error?.status === 409 || 
                        error.message?.includes('already sent') || error.message?.includes('409');
      
      if (isConflict) {
        showError(`Circle request already sent to ${userName || 'this user'}.`);
        setLocalSentRequests(prev => new Set([...prev, userIdString]));
      } else {
        showError(`Failed to send circle request to ${userName || 'user'}. Please try again.`);
        
        // Revert optimistic updates
        setSentRequestsData(prev => prev.filter(req => req.id !== tempRequestId));
        setLocalSentRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(userIdString);
          return newSet;
        });
        
        if (suggestion) {
          setSuggestions(prev => {
            const userExists = prev.some(s => String(s.user.id) === userIdString);
            return userExists ? prev : [suggestion, ...prev];
          });
        }
      }
    }
  };

  const handleSearchChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    setSearchLoading(true);
    
    try {
      const response = await circleService.searchUsers({ query, limit: 10 });
      setSearchResults(response.users || []);
    } catch (error) {
      console.log('API search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
      setShowDropdown(true);
    }
  }, []);

  const handleSendRequest = async (user: User) => {
    if (!currentUser) return;
    
    const userIdString = String(user.id);
    
    // Check if request was already sent
    if (sentRequestsSet.has(userIdString)) {
      showError(`Circle request already sent to ${user.name}.`);
      return;
    }
    
    const requestMessage = await prompt({
      title: 'Send Circle Request',
      message: `Send a circle request to ${user.name}?`,
      placeholder: 'Add a personal message (optional)...',
      defaultValue: `Hi ${user.name}! I'd like to connect with you in my review circle.`
    });
    
    if (requestMessage === null) return;
    
    try {
      const response = await circleService.sendCircleRequest(userIdString, {
        message: requestMessage
      });
      
      console.log('Circle request sent successfully:', response);
      
      // Add to local tracking
      setLocalSentRequests(prev => new Set([...prev, userIdString]));
      
      // Try to reload sent requests from server (if available)
      try {
        const sentRequestsResponse = await circleService.getSentRequests();
        setSentRequestsData(sentRequestsResponse.requests || []);
      } catch (error) {
        console.log('Sent requests API not available, using local tracking');
      }
      
      // Remove user from suggestions since they now have a pending request
      setSuggestions(prev => prev.filter(s => 
        String(s.user.id || s.user.user_id) !== userIdString
      ));
      
      showSuccess(`Circle request sent to ${user.name}!`);
      
      // Clear search results after successful request
      setSearchResults([]);
      setSearchQuery('');
      setShowDropdown(false);
      
    } catch (error: any) {
      console.error('Failed to send circle request:', error);
      
      // Handle specific error cases
      if (error.message?.includes('already sent') || error.message?.includes('409')) {
        showError(`Circle request already sent to ${user.name}.`);
        // Add to local tracking since server confirms request exists
        setLocalSentRequests(prev => new Set([...prev, userIdString]));
        // Try to reload sent requests from server (if available)
        try {
          const sentRequestsResponse = await circleService.getSentRequests();
          setSentRequestsData(sentRequestsResponse.requests || []);
        } catch (reloadError) {
          console.log('Sent requests API not available after conflict, using local tracking');
        }
      } else {
        showError(`Failed to send circle request to ${user.name}. Please try again.`);
      }
    }
  };

  const handleCancelRequest = async (requestId: string, userName: string) => {
    console.log('🗑️ handleCancelRequest called:', { requestId, userName });
    
    const confirmed = await confirm({
      title: 'Cancel Circle Request',
      message: `Are you sure you want to cancel the circle request to ${userName}?`,
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request'
    });
    
    if (!confirmed) {
      console.log('❌ User cancelled the cancel action');
      return;
    }
    
    try {
      console.log('📤 Cancelling circle request:', requestId);
      // Call the backend API to actually cancel the request
      await circleService.cancelCircleRequest(parseInt(requestId));
      console.log('✅ Circle request cancelled successfully');
      
      // Remove from local state
      setSentRequestsData(prev => {
        const filtered = prev.filter(req => req.id !== parseInt(requestId));
        console.log('📋 Updated sent requests after cancel. Before:', prev.length, 'After:', filtered.length);
        return filtered;
      });
      
      // Also remove from local tracking
      setLocalSentRequests(prev => {
        const newSet = new Set(prev);
        // Find the recipient ID and remove it
        const request = sentRequests.find(req => req.id === parseInt(requestId));
        if (request && request.recipient) {
          const recipientId = String(request.recipient.id || request.recipient.user_id);
          newSet.delete(recipientId);
          console.log('🎯 Removed user from local tracking:', recipientId);
        }
        console.log('📋 Updated local sent requests after cancel:', Array.from(newSet));
        return newSet;
      });
      
      console.log('🎉 Showing success message for cancelled request');
      showSuccess(`Circle request to ${userName} cancelled.`);
    } catch (error) {
      console.error('❌ Failed to cancel circle request:', error);
      showError('Failed to cancel circle request. Please try again.');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const isUserInCircle = (userId: string | number) => {
    return (members || []).some(member => String(member.user.id) === String(userId));
  };

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'decline' | 'keep_as_follower'): Promise<void> => {
    const requestIdNum = parseInt(requestId);
    const request = pendingRequests.find(req => req.id === requestIdNum);
    if (!request) return;
    
    // Handle different action types
    let actionText = action;
    let finalRelationship: 'circle_member' | 'follower' | undefined;
    
    if (action === 'accept') {
      actionText = 'accept as circle mate';
      finalRelationship = 'circle_member';
    } else if (action === 'keep_as_follower') {
      actionText = 'accept as follower';
      finalRelationship = 'follower';
    } else {
      actionText = 'decline';
    }
    
    const confirmed = await confirm({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Circle Request`,
      message: `Are you sure you want to ${actionText} the circle request from ${request.requester.name}?`,
      confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      // Map frontend actions to backend actions
      const backendAction = (action === 'keep_as_follower' || action === 'accept') ? 'accept' : 'decline';
      const response = await circleService.respondToCircleRequest(requestIdNum, backendAction, finalRelationship);
      console.log('Request response result:', response);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestIdNum));
      
      // Update state based on action type
      if (action === 'accept') {
        // Add to circle members
        const newMember: CircleMember = {
          connection_id: Date.now(),
          user: request.requester,
          trust_level: TrustLevel.REVIEWER,
          taste_match_score: 75.0, // Default taste match score
          interaction_count: 0,
          connected_since: new Date().toISOString()
        };
        setMembers(prev => [newMember, ...prev]);
      } else if (action === 'keep_as_follower') {
        // Add to followers list
        const newFollower = {
          id: request.requester.id || request.requester.user_id || '',
          name: request.requester.name,
          username: request.requester.username,
          avatar: request.requester.avatar
        };
        setFollowers(prev => [newFollower, ...prev]);
      }
      
      // Update success message based on action
      let successMessage = '';
      if (action === 'accept') {
        successMessage = 'User added as circle mate!';
      } else if (action === 'keep_as_follower') {
        successMessage = 'User kept as follower!';
      } else {
        successMessage = 'Circle request declined.';
      }
      showSuccess(successMessage);
      
    } catch (error: any) {
      const actionForError = action === 'keep_as_follower' ? 'accept as follower' : action;
      console.error(`Failed to ${actionForError} circle request:`, error);
      
      // Handle specific error cases
      if (error.message?.includes('already responded') || error.message?.includes('not found')) {
        // Request was already processed - remove it from UI and refresh
        showError(`This request has already been processed. Refreshing the list...`);
        setPendingRequests(prev => prev.filter(req => req.id !== requestIdNum));
        // Refresh data to get current state
        refreshData();
      } else {
        showError(`Failed to ${actionForError} circle request. Please try again.`);
      }
    }
  };

  const toggleUserMenu = (memberId: string) => {
    setOpenMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleUpdateTrustLevel = async (memberId: string, trustLevel: string, userName: string) => {
    const confirmed = await confirm({
      title: 'Update Trust Level',
      message: `Change ${userName}'s trust level to ${trustLevel.replace('_', ' ')}?`,
      confirmText: 'Update',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      const memberIdNum = parseInt(memberId);
      await circleService.updateTrustLevel(memberIdNum, trustLevel as TrustLevel);
      setMembers(prev => prev.map(member => 
        member.connection_id === memberIdNum ? { ...member, trust_level: trustLevel as TrustLevel } : member
      ));
      showSuccess(`Updated ${userName}'s trust level.`);
    } catch (error) {
      console.error('Failed to update trust level:', error);
      showError('Failed to update trust level. Please try again.');
    }
  };

  const handleRemoveUser = async (memberId: string, userName: string) => {
    const confirmed = await confirm({
      title: 'Remove from Circle',
      message: `Are you sure you want to remove ${userName} from your circle?`,
      confirmText: 'Remove',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      const memberIdNum = parseInt(memberId);
      await circleService.removeFromCircle(memberIdNum);
      setMembers(prev => prev.filter(member => member.connection_id !== memberIdNum));
      showSuccess(`Removed ${userName} from your circle.`);
    } catch (error) {
      console.error('Failed to remove user from circle:', error);
      showError('Failed to remove user from circle. Please try again.');
    }
  };

  const handleBlockUser = async (userId: string | number, userName: string) => {
    const reason = await prompt({
      title: 'Block User',
      message: `Are you sure you want to block ${userName}?`,
      placeholder: 'Enter reason for blocking...',
      defaultValue: ''
    });
    
    if (reason === null) return;
    
    try {
      await circleService.blockUser(String(userId), reason);
      
      // Remove from members if they were in the circle
      setMembers(prev => prev.filter(member => String(member.user.id) !== String(userId)));
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => String(s.user.id) !== String(userId)));
      
      showSuccess(`Blocked ${userName}.`);
    } catch (error) {
      console.error('Failed to block user:', error);
      showError('Failed to block user. Please try again.');
    }
  };

  const handleUnblockUser = async (userId: string | number, userName: string) => {
    const confirmed = await confirm({
      title: 'Unblock User',
      message: `Are you sure you want to unblock ${userName}?`,
      confirmText: 'Unblock',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      await circleService.unblockUser(String(userId));
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      showSuccess(`Unblocked ${userName}.`);
    } catch (error) {
      console.error('Failed to unblock user:', error);
      showError('Failed to unblock user. Please try again.');
    }
  };

  const handleDemoteToFollower = async (userId: string) => {
    const member = members.find(m => String(m.user.id) === String(userId));
    if (!member) return;
    
    const confirmed = await confirm({
      title: 'Demote to Follower',
      message: `Are you sure you want to demote ${member.user.name} from circle mate to follower?`,
      confirmText: 'Demote',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      await circleService.demoteToFollower(userId);
      
      // Remove from members
      setMembers(prev => prev.filter(m => String(m.user.id) !== String(userId)));
      
      // Add to followers
      const newFollower = {
        id: member.user.id,
        name: member.user.name,
        username: member.user.username,
        avatar: member.user.avatar
      };
      setFollowers(prev => [newFollower, ...prev]);
      
      showSuccess(`${member.user.name} has been demoted to follower.`);
    } catch (error) {
      console.error('Failed to demote user:', error);
      showError('Failed to demote user. Please try again.');
    }
  };

  const handlePromoteToCircleMate = async (userId: string) => {
    const follower = followers.find(f => String(f.id) === String(userId));
    if (!follower) return;
    
    const message = await prompt({
      title: 'Promote to Circle Mate',
      message: `Send a promotion request to ${follower.name} to become a circle mate?`,
      placeholder: 'Optional message...',
      confirmText: 'Send Request',
      cancelText: 'Cancel'
    });
    
    if (message === null) return;
    
    try {
      await circleService.promoteToCircleMate(userId, message);
      showSuccess(`Promotion request sent to ${follower.name}.`);
    } catch (error: any) {
      console.error('Failed to send promotion request:', error);
      if (error.message?.includes('already sent')) {
        showError('Promotion request already sent to this user.');
      } else {
        showError('Failed to send promotion request. Please try again.');
      }
    }
  };


  // Main render
  return (
    <ThreePanelLayout
      pageTitle="Review Circle"
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Circle Recommendations"
      centerPanelWidth="700px"
      headerGradient="from-purple-600 via-pink-600 to-red-800"
      centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      variant="full-width"
    >
      {/* Review Circle Middle Panel Content */}
      {error ? (
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-md mx-auto">
            <div className="p-4 bg-red-50 rounded-full w-16 h-16 mx-auto mb-4">
              <Users className="w-8 h-8 text-red-600 mx-auto" />
            </div>
            <div className="text-red-600 text-xl font-semibold mb-2">Error Loading Circle</div>
            <div className="text-gray-600 mb-6">{error}</div>
            <button 
              onClick={loadCircleData}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : loading || authLoading ? (
        <div className="flex items-center justify-center min-h-[600px]">
          <LoadingSpinner text="Loading your circle..." />
        </div>
      ) : (
        <div className="w-full space-y-6 px-8">
          {/* Circle Content */}
            
            {/* Unified Circle Header and Dashboard */}
            <div className="bg-gradient-to-br from-white via-purple-50 to-indigo-50 rounded-xl shadow-lg border-2 border-purple-200 p-6">
              {/* Circle Header Section */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-3">
                      <h1 className="text-2xl font-bold text-gray-900">
                        Review Circle
                      </h1>
                      {apiStatus === 'online' && (
                        <span className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium border border-green-200">
                          ✓ Live Data
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Connect with trusted reviewers and build your review network
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">
                        {members.length} members
                      </span>
                      <span className="text-xs text-gray-500">
                        {pendingRequests.length} pending requests
                      </span>
                      <span className="text-xs text-gray-500">
                        {suggestions.length} suggestions
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => refreshData()}
                    className="circle-action-button-primary flex items-center space-x-2 px-4 py-2 rounded-lg disabled:opacity-50 text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105"
                    title="Refresh circle data"
                    disabled={!currentUser}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
              </div>

              {/* Dashboard Navigation Section */}
              <div className="border-t border-purple-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-purple-900">Dashboard</h2>
                    <p className="text-sm text-purple-600">Choose your view to manage different aspects of your circle</p>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-purple-500">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">Active: {tabs.find(tab => tab.id === activeTab)?.label}</span>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Navigation Pills */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`group flex items-center space-x-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-300 border-2 min-w-[140px] justify-center hover:shadow-lg hover:transform hover:scale-105 ${
                          isActive
                            ? 'circle-nav-button-active transform scale-105'
                            : 'bg-white text-purple-600 hover:text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:border-purple-400 border-purple-200'
                        }`}
                      >
                        <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-current'}`} />
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-sm">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full min-w-[24px] text-center ${
                            isActive
                              ? 'bg-white bg-opacity-25 text-black backdrop-blur-sm'
                              : 'bg-purple-200 text-purple-700 group-hover:bg-purple-300 group-hover:text-purple-800'
                          }`}>
                            {tab.count > 99 ? '99+' : tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>


            {/* Main Tab Content Area - Only show one tab at a time */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 overflow-visible" data-tab={activeTab}>
              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'members' && (
                  <CircleMembers 
                    members={members}
                    openMenus={openMenus}
                    onToggleUserMenu={toggleUserMenu}
                    onUpdateTrustLevel={handleUpdateTrustLevel}
                    onRemoveUser={handleRemoveUser}
                    onBlockUser={handleBlockUser}
                    onDemoteToFollower={handleDemoteToFollower}
                  />
                )}
                
                {activeTab === 'invites' && (
                  <CircleInvites 
                    pendingRequests={pendingRequests}
                    receivedInvites={receivedInvites}
                    onRequestResponse={handleRequestResponse}
                    onCancelRequest={handleCancelRequest}
                  />
                )}
                
                {activeTab === 'sent' && (
                  <SentRequests 
                    sentRequests={pendingSentRequests}
                    onCancelRequest={handleCancelRequest}
                  />
                )}
                
                {activeTab === 'suggestions' && (
                  <CircleSuggestions 
                    suggestions={suggestions}
                    currentUser={currentUser}
                    sentRequestsSet={sentRequestsSet}
                    onAddToCircle={handleAddToCircle}
                    onError={showError}
                    onBlockUser={handleBlockUser}
                  />
                )}
                
                {activeTab === 'search' && (
                  <UserSearch 
                    searchResults={searchResults}
                    currentUser={currentUser}
                    isUserInCircle={isUserInCircle}
                    sentRequestsSet={sentRequestsSet}
                    onSearchResults={handleSearchResults}
                    onUserSelect={handleUserSelect}
                    onSendRequest={handleSendRequest}
                    onBlockUser={handleBlockUser}
                    onSwitchToSuggestions={() => setActiveTab('suggestions')}
                    onSwitchToMembers={() => setActiveTab('members')}
                  />
                )}
                
                {activeTab === 'followers' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Followers ({followers.length})
                      </h2>
                    </div>
                    
                    {followers.length === 0 ? (
                      <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm text-center">
                        <Heart className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">No Followers Yet</h3>
                        <p className="text-purple-600">People who follow you will appear here. Start building your network!</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {followers.map((follower) => (
                          <div key={follower.id} className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="space-y-3">
                              <UserDisplay 
                                user={{
                                  id: follower.id,
                                  name: follower.name,
                                  username: follower.username,
                                  avatar: follower.avatar
                                }}
                                size="lg"
                                badge={
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Heart size={12} className="mr-1" />
                                    Follower
                                  </span>
                                }
                                subtitle={`Following since ${follower.followed_since ? new Date(follower.followed_since).toLocaleDateString() : 'recently'}`}
                                actions={
                                  <UserActionsMenu
                                    userId={String(follower.id)}
                                    userName={follower.name || follower.username}
                                    userType="follower"
                                    onPromoteToCircleMate={handlePromoteToCircleMate}
                                    onBlock={handleBlockUser}
                                  />
                                }
                              />
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 pl-15">
                                <span className="font-medium text-blue-600">Follower</span>
                                <span>•</span>
                                <span>Can be promoted to Circle Mate</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'following' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Following ({following.length})
                      </h2>
                    </div>
                    
                    {following.length === 0 ? (
                      <div className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-xl p-8 shadow-sm text-center">
                        <UserCheck className="w-16 h-16 mx-auto text-purple-400 mb-4" />
                        <h3 className="text-lg font-semibold text-purple-900 mb-2">Not Following Anyone</h3>
                        <p className="text-purple-600">People you follow will appear here. Explore suggestions to find interesting users!</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {following.map((followingUser) => (
                          <div key={followingUser.id} className="bg-gradient-to-br from-white to-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="space-y-3">
                              <UserDisplay 
                                user={{
                                  id: followingUser.id,
                                  name: followingUser.name,
                                  username: followingUser.username,
                                  avatar: followingUser.avatar
                                }}
                                size="lg"
                                badge={
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <UserCheck size={12} className="mr-1" />
                                    Following
                                  </span>
                                }
                                subtitle={`Following since ${followingUser.followed_since ? new Date(followingUser.followed_since).toLocaleDateString() : 'recently'}`}
                                actions={
                                  <UserActionsMenu
                                    userId={String(followingUser.id)}
                                    userName={followingUser.name || followingUser.username}
                                    userType="following"
                                    onBlock={handleBlockUser}
                                  />
                                }
                              />
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 pl-15">
                                <span className="font-medium text-green-600">Following</span>
                                <span>•</span>
                                <span className="capitalize">{followingUser.relationship_type || 'Connection'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'analytics' && (
                  <CircleAnalyticsComponent analytics={analytics} />
                )}
                
                {activeTab === 'blocked' && (
                  <BlockedUsers 
                    blockedUsers={blockedUsers}
                    onUnblockUser={handleUnblockUser}
                  />
                )}
              </div>
            </div>

            {/* Active Tab Indicator - Enhanced with purple theme */}
            <div className="text-center py-6">
              <div className="inline-flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-purple-100 via-purple-50 to-indigo-100 rounded-full border-2 border-purple-300 shadow-lg">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-sm font-bold text-purple-800">
                  Currently viewing: {tabs.find(tab => tab.id === activeTab)?.label}
                </span>
                <div className="w-2 h-2 bg-purple-400 rounded-full opacity-60"></div>
              </div>
            </div>

        </div>
      )}
    </ThreePanelLayout>
  );
};

// Wrapper component that provides the confirmation context
const ReviewCirclePage: React.FC = () => {
  return (
    <CircleErrorBoundary>
      <ConfirmationProvider>
        <ReviewCirclePageContent />
      </ConfirmationProvider>
    </CircleErrorBoundary>
  );
};

export default ReviewCirclePage;