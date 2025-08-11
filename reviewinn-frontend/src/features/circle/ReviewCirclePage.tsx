import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, TrendingUp, Settings, Search, Clock, Ban } from 'lucide-react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { circleService, homepageService } from '../../api/services';
import ReviewCirclePageLayout from './components/ReviewCirclePageLayout';
import LoadingSpinner from '../../shared/atoms/LoadingSpinner';
import { useConfirmation, ConfirmationProvider } from '../../shared/components/ConfirmationSystem';
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

// Main component
const ReviewCirclePageContent: React.FC = () => {
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  // Initialize confirmation system
  const { confirm, prompt, showSuccess, showError } = useConfirmation();
  const [activeTab, setActiveTab] = useState<'members' | 'invites' | 'sent' | 'suggestions' | 'analytics' | 'blocked'>('members');
  
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connecting' | 'offline' | 'online'>('connecting');
  
  // Menu and search states
  const [openMenus, setOpenMenus] = useState<Set<string>>(new Set());
  
  // Create sets for quick lookup
  const sentRequestsSet = new Set(sentRequests.map(req => String(req.requester.id)));
  
  // Left panel data

  // Tab configuration
  const tabs = [
    { id: 'members' as const, label: 'Members', icon: Users, count: members.length },
    { id: 'invites' as const, label: 'Requests', icon: Clock, count: pendingRequests.length + receivedInvites.length },
    { id: 'sent' as const, label: 'Sent', icon: UserPlus, count: sentRequests.length },
    { id: 'suggestions' as const, label: 'Suggestions', icon: TrendingUp, count: suggestions.length },
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
          setSentRequestsData(sentRequestsResponse.value.requests || []);
        }
        // Load secondary data
        Promise.allSettled([
          circleService.getReceivedInvites(),
          circleService.getSuggestions({ limit: 10 }),
          circleService.getAnalytics(),
          circleService.getBlockedUsers()
        ]).then(([receivedInvitesResponse, suggestionsResponse, analyticsResponse, blockedUsersResponse]) => {
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
    if (!currentUser) return;
    
    try {
      const [pendingRequestsResponse, sentRequestsResponse, membersResponse] = await Promise.allSettled([
        circleService.getPendingRequests(),
        circleService.getSentRequests(),
        circleService.getMyCircleMembers({ page: 1, size: 50 })
      ]);

      if (pendingRequestsResponse.status === 'fulfilled') {
        setPendingRequests(pendingRequestsResponse.value.requests);
      }

      if (sentRequestsResponse.status === 'fulfilled') {
        setSentRequestsData(sentRequestsResponse.value.requests);
      }

      if (membersResponse.status === 'fulfilled') {
        setMembers(membersResponse.value.members);
      }

    } catch (error) {
      console.log('Background refresh failed:', error);
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

  // Auto-refresh data when visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser && apiStatus === 'online') {
        refreshData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentUser, apiStatus, refreshData]);

  // Persist data to localStorage
  useEffect(() => {
    if (currentUser && members.length > 0) {
      const membersKey = `circle_members_${currentUser.id}`;
      localStorage.setItem(membersKey, JSON.stringify(members));
    }
  }, [members, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const requestsKey = `circle_requests_${currentUser.id}`;
      localStorage.setItem(requestsKey, JSON.stringify(pendingRequests));
    }
  }, [pendingRequests, currentUser]);

  useEffect(() => {
    if (currentUser) {
      const suggestionsKey = `circle_suggestions_${currentUser.id}`;
      localStorage.setItem(suggestionsKey, JSON.stringify(suggestions));
    }
  }, [suggestions, currentUser]);

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

  const handleAddToCircle = async (userId: string | number, userName?: string) => {
    if (!currentUser) return;
    
    const userIdString = String(userId);
    
    try {
      console.log('Attempting to add user to circle:', { userId, userName });
      const result = await circleService.addToCircle(userIdString);
      console.log('User added to circle successfully:', result);
      
      // Find the suggestion to get user details
      const suggestion = (suggestions || []).find(s => s.user.id === Number(userId));
      
      if (suggestion) {
        const newMember: CircleMember = {
          connection_id: Date.now(),
          user: suggestion.user,
          trust_level: TrustLevel.REVIEWER,
          taste_match_score: suggestion.taste_match_score || 0,
          interaction_count: 0,
          connected_since: new Date().toISOString()
        };
        
        setMembers(prev => [newMember, ...prev]);
        setSuggestions(prev => prev.filter(s => s.user.id !== Number(userId)));
      }
      
      showSuccess(`Successfully added ${userName || 'user'} to your circle!`);
    } catch (error) {
      console.error('Failed to add user to circle:', error);
      showError(`Failed to add ${userName || 'user'} to circle. Please try again.`);
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
    
    const requestMessage = await prompt({
      title: 'Send Circle Request',
      message: `Send a circle request to ${user.name}?`,
      placeholder: 'Add a personal message (optional)...',
      defaultValue: `Hi ${user.name}! I'd like to connect with you in my review circle.`
    });
    
    if (requestMessage === null) return;
    
    try {
      const response = await circleService.sendCircleRequest(String(user.id), {
        message: requestMessage
      });
      
      console.log('Circle request sent successfully:', response);
      
      // Add to sent requests locally for immediate feedback
      const newSentRequest: CircleRequest = {
        id: response.request_id || Date.now(),
        requester: {
          id: typeof user.id === 'string' ? parseInt(user.id) : user.id,
          name: user.name,
          username: user.username || user.name.toLowerCase().replace(/\s+/g, ''),
          avatar: user.avatar
        },
        message: requestMessage,
        created_at: new Date().toISOString(),
        status: 'pending' as const
      };
      setSentRequestsData(prev => [newSentRequest, ...prev]);
      
      // Remove user from suggestions since they now have a pending request
      setSuggestions(prev => prev.filter(s => 
        String(s.user.id || s.user.user_id) !== String(user.id) && 
        String(s.user.user_id || s.user.id) !== String(user.id)
      ));
      
      showSuccess(`Circle request sent to ${user.name}!`);
      
      // Clear search results after successful request
      setSearchResults([]);
      setSearchQuery('');
      setShowDropdown(false);
      
    } catch (error) {
      console.error('Failed to send circle request:', error);
      showError('Failed to send circle request. Please try again.');
    }
  };

  const handleCancelRequest = async (requestId: string, userName: string) => {
    const confirmed = await confirm({
      title: 'Cancel Circle Request',
      message: `Are you sure you want to cancel the circle request to ${userName}?`,
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request'
    });
    
    if (!confirmed) return;
    
    try {
      // For now, just remove from local state since API may not support cancellation
      setSentRequestsData(prev => prev.filter(req => req.id !== parseInt(requestId)));
      showSuccess(`Circle request to ${userName} cancelled.`);
    } catch (error) {
      console.error('Failed to cancel circle request:', error);
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

  const handleRequestResponse = async (requestId: string, action: 'accept' | 'decline') => {
    const requestIdNum = parseInt(requestId);
    const request = pendingRequests.find(req => req.id === requestIdNum);
    if (!request) return;
    
    const actionText = action === 'accept' ? 'accept' : 'decline';
    const confirmed = await confirm({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Circle Request`,
      message: `Are you sure you want to ${actionText} the circle request from ${request.requester.name}?`,
      confirmText: actionText.charAt(0).toUpperCase() + actionText.slice(1),
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      const response = await circleService.respondToCircleRequest(requestIdNum, action);
      console.log('Request response result:', response);
      
      // Remove from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestIdNum));
      
      // If accepted, add to members
      if (action === 'accept') {
        const newMember: CircleMember = {
          connection_id: Date.now(),
          user: request.requester,
          trust_level: TrustLevel.REVIEWER,
          taste_match_score: 75.0, // Default taste match score
          interaction_count: 0,
          connected_since: new Date().toISOString()
        };
        setMembers(prev => [newMember, ...prev]);
      }
      
      showSuccess(`Circle request ${action === 'accept' ? 'accepted' : 'declined'}.`);
      
      // Refresh data to get updated state from server
      setTimeout(() => refreshData(), 1000);
      
    } catch (error) {
      console.error(`Failed to ${action} circle request:`, error);
      showError(`Failed to ${action} circle request. Please try again.`);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <CircleMembers 
            members={members}
            openMenus={openMenus}
            onToggleUserMenu={toggleUserMenu}
            onUpdateTrustLevel={handleUpdateTrustLevel}
            onRemoveUser={handleRemoveUser}
            onBlockUser={handleBlockUser}
          />
        );
      case 'invites':
        return (
          <CircleInvites 
            pendingRequests={pendingRequests}
            receivedInvites={receivedInvites}
            onRequestResponse={handleRequestResponse}
          />
        );
      case 'sent':
        return (
          <SentRequests 
            sentRequests={sentRequests}
            onCancelRequest={handleCancelRequest}
          />
        );
      case 'suggestions':
        return (
          <CircleSuggestions 
            suggestions={suggestions}
            currentUser={currentUser}
            sentRequestsSet={sentRequestsSet}
            onAddToCircle={handleAddToCircle}
            onError={showError}
          />
        );
      case 'analytics':
        return <CircleAnalyticsComponent analytics={analytics} />;
      case 'blocked':
        return (
          <BlockedUsers 
            blockedUsers={blockedUsers}
            onUnblockUser={handleUnblockUser}
          />
        );
      default:
        return (
          <CircleMembers 
            members={members}
            openMenus={openMenus}
            onToggleUserMenu={toggleUserMenu}
            onUpdateTrustLevel={handleUpdateTrustLevel}
            onRemoveUser={handleRemoveUser}
            onBlockUser={handleBlockUser}
          />
        );
    }
  };

  // Main render
  return (
    <ReviewCirclePageLayout>
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
            
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between">
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
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium shadow-sm border border-gray-200 transition-all duration-200"
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
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Search className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Find People</h2>
                <span className="text-sm text-gray-500">Search and connect with reviewers</span>
              </div>
              <UserSearchBar
                onSearchResults={(results: User[]) => setSearchResults(results)}
                onUserSelect={(user: User) => {
                  console.log('Selected user:', user);
                }}
                currentUser={currentUser}
                isUserInCircle={isUserInCircle}
                sentRequestsSet={sentRequestsSet}
                onSendRequest={handleSendRequest}
                onBlockUser={(userId: string | number, userName: string) => handleBlockUser(userId, userName)}
                placeholder="Search for people by name, username, or interests..."
              />
            </div>

            {/* Circle Members - Default View */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Circle Members</h2>
                  <span className="px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
                    {members.length} members
                  </span>
                </div>
              </div>
              <CircleMembers 
                members={members}
                openMenus={openMenus}
                onToggleUserMenu={toggleUserMenu}
                onUpdateTrustLevel={handleUpdateTrustLevel}
                onRemoveUser={handleRemoveUser}
                onBlockUser={handleBlockUser}
              />
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Pending Requests */}
              {(pendingRequests.length > 0 || receivedInvites.length > 0) && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                      {pendingRequests.length + receivedInvites.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <CircleInvites 
                      pendingRequests={pendingRequests.slice(0, 3)}
                      receivedInvites={receivedInvites.slice(0, 3)}
                      onRequestResponse={handleRequestResponse}
                    />
                    {(pendingRequests.length + receivedInvites.length) > 3 && (
                      <button
                        onClick={() => setActiveTab('invites')}
                        className="w-full text-center py-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        View all {pendingRequests.length + receivedInvites.length} requests
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Suggestions</h3>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {suggestions.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <CircleSuggestions 
                      suggestions={suggestions.slice(0, 3)}
                      currentUser={currentUser}
                      sentRequestsSet={sentRequestsSet}
                      onAddToCircle={handleAddToCircle}
                      onError={showError}
                    />
                    {suggestions.length > 3 && (
                      <button
                        onClick={() => setActiveTab('suggestions')}
                        className="w-full text-center py-2 text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        View all {suggestions.length} suggestions
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal-style views for detailed tabs */}
            {activeTab !== 'members' && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {activeTab === 'invites' && 'All Invites & Requests'}
                    {activeTab === 'sent' && 'Sent Requests'}
                    {activeTab === 'suggestions' && 'All Suggestions'}
                    {activeTab === 'analytics' && 'Circle Analytics'}
                    {activeTab === 'blocked' && 'Blocked Users'}
                  </h2>
                  <button
                    onClick={() => setActiveTab('members')}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {renderContent()}
                </div>
              </div>
            )}

            {/* Navigation Pills */}
            <div className="flex items-center justify-center space-x-2 py-4">
              <div className="flex items-center space-x-1 bg-white rounded-full shadow-lg border border-gray-100 p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === tab.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

        </div>
      )}
    </ReviewCirclePageLayout>
  );
};

// Wrapper component that provides the confirmation context
const ReviewCirclePage: React.FC = () => {
  return (
    <ConfirmationProvider>
      <ReviewCirclePageContent />
    </ConfirmationProvider>
  );
};

export default ReviewCirclePage;