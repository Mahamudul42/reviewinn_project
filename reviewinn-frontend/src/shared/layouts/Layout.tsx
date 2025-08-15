import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { User, Search, BarChart3, LogOut, LogIn, Bell, MessageCircle, Users, Building2, Home, Plus } from 'lucide-react';
import AuthModal from '../../features/auth/components/AuthModal';
import NotificationSystem, { useNotifications } from '../organisms/NotificationSystem';
import QuickActionsPanel from '../organisms/QuickActionsPanel';
import RecentActivityDropdown from '../molecules/RecentActivityDropdown';
import MessagesDropdown from '../molecules/MessagesDropdown';
import NotificationsDropdown from '../molecules/NotificationsDropdown';
import NotificationBell from '../components/NotificationBell';
import { professionalMessagingService } from '../../api/services/professionalMessagingService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

const Layout: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, getToken } = useUnifiedAuth();
  
  // Debug authentication state on every render
  console.log('Layout render - useAuth state:', {
    isAuthenticated,
    hasUser: !!user,
    userId: user?.id,
    isLoading,
    timestamp: new Date().toISOString()
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [recentActivityShown, setRecentActivityShown] = useState(false);
  const [showRecentActivityDropdown, setShowRecentActivityDropdown] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [unreadConversationsCount, setUnreadConversationsCount] = useState(0); // Track unread conversations (industry standard)
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError
  } = useNotifications();

  // WebSocket for real-time updates (only when authenticated)
  const { isConnected } = useWebSocket({
    enabled: isAuthenticated && !!user,
    onMessage: (message) => {
      // Update last message indicator for visual debugging
      
      console.log('🔔 Layout: WebSocket message received:', {
        type: message.type,
        fullMessage: message,
        currentUserId: user?.id,
        senderIdFromMessage: message.sender_id,
        conversationId: message.conversation_id,
        currentUnreadCount: unreadConversationsCount,
        timestamp: message.timestamp
      });
      
      if (message.type === 'new_message') {
        console.log('📨 Layout: Processing new message for counter update');
        console.log('📨 Message details:', {
          senderId: message.sender_id,
          currentUserId: user?.id,
          senderIdType: typeof message.sender_id,
          currentUserIdType: typeof user?.id,
          senderIdEquals: message.sender_id === user?.id,
          senderIdEqualsNumber: message.sender_id === Number(user?.id),
          numberSenderIdEquals: Number(message.sender_id) === Number(user?.id)
        });
        
        // Check if this message is from another user (not from current user)
        const isFromOtherUser = message.sender_id && user?.id && 
          Number(message.sender_id) !== Number(user?.id);
        
        console.log('📨 Is from other user?', isFromOtherUser);
        
        if (message.conversation_id && isFromOtherUser) {
          console.log('🔄 Layout: Updating counter optimistically for message from other user');
          // Optimistically update counter for better UX
          setUnreadConversationsCount(prev => {
            const newCount = prev + 1;
            console.log(`📈 Layout: Counter updated optimistically: ${prev} → ${newCount}`);
            return newCount;
          });
          
          // Verify with backend after short delay
          setTimeout(() => {
            console.log('🔄 Layout: Verifying counter with backend after new message');
            loadUnreadConversationsCount();
          }, 1000);
        } else {
          console.log('⏭️ Layout: Skipping counter update - message from current user or missing data');
        }
      } else if (message.type === 'conversation_read') {
        console.log('👁️ Layout: Conversation marked as read, updating counter');
        if (message.conversation_id) {
          // Optimistically decrease counter
          setUnreadConversationsCount(prev => {
            const newCount = Math.max(0, prev - 1);
            console.log(`📉 Layout: Counter decreased: ${prev} → ${newCount}`);
            return newCount;
          });
        }
        
        // Verify with backend
        setTimeout(() => {
          console.log('🔄 Layout: Verifying counter after conversation read');
          loadUnreadConversationsCount();
        }, 500);
      } else if (message.type === 'conversation_updated' || message.type === 'message_status') {
        // Handle other conversation updates
        console.log('🔄 Layout: Conversation updated, refreshing count');
        setTimeout(() => {
          loadUnreadConversationsCount();
        }, 300);
      } else {
        console.log('❓ Layout: Unknown message type, triggering general refresh');
        setTimeout(() => {
          loadUnreadConversationsCount();
        }, 500);
      }
    },
    onConnect: () => {
      console.log('Layout: WebSocket connected, loading unread conversations count');
      loadUnreadConversationsCount();
    },
    onDisconnect: () => {
      console.log('Layout: WebSocket disconnected');
    },
    onError: (error) => {
      console.log('Layout: WebSocket connection error:', error);
    }
  });

  useEffect(() => {
    // Listen for custom auth modal events from PublicRightPanel
    const handleOpenAuthModal = () => {
      setShowAuthModal(true);
    };

    // Listen for login events to load unread count
    const handleLoginSuccess = () => {
      console.log('Login success event received, loading unread count');
      // Small delay to ensure token persistence is complete
      setTimeout(() => {
        loadUnreadCount();
      }, 200);
    };

    // Force re-render on auth state changes
    const handleAuthStateChange = () => {
      console.log('Layout: Auth state change detected, forcing re-render');
      // Force component re-render by updating state
      setShowUserMenu(prev => prev);
    };

    // Handle logout events from auth system
    const handleAuthLogout = () => {
      console.log('Layout: Auth logout event detected');
      // Close any open menus
      setShowUserMenu(false);
      setShowRecentActivityDropdown(false);
      setShowMessagesDropdown(false);
      // Clear conversations count
      setUnreadConversationsCount(0);
    };

    // Handle conversation updates from MessagesDropdown
    const handleConversationUpdate = () => {
      console.log('Layout: Conversation update event received');
      if (isAuthenticated && !isLoading && user) {
        setTimeout(() => {
          loadUnreadConversationsCount();
        }, 300); // Small delay to ensure backend state is updated
      }
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    window.addEventListener('loginSuccess', handleLoginSuccess as EventListener);
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    window.addEventListener('authLogout', handleAuthLogout as EventListener);
    window.addEventListener('conversationUpdated', handleConversationUpdate as EventListener);

    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
      window.removeEventListener('loginSuccess', handleLoginSuccess as EventListener);
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('authLogout', handleAuthLogout as EventListener);
      window.removeEventListener('conversationUpdated', handleConversationUpdate as EventListener);
    };
  }, []);

  // Separate effect for auth state changes (without loading unread count immediately)
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      // Reset conversation counts when user logs out or is loading
      setUnreadConversationsCount(0);
      setShowMessagesDropdown(false);
      setShowRecentActivityDropdown(false);
    }
  }, [isAuthenticated, isLoading]);

  const loadUnreadConversationsCount = async () => {
    // Only load unread conversations count if user is authenticated and not still loading
    if (!isAuthenticated || isLoading || !user) {
      setUnreadConversationsCount(0);
      return;
    }
    
    // Use unified auth token - get fresh token reference
    const token = getToken();
    
    if (!token) {
      console.warn('No auth token found, retrying once...');
      console.log('Debug - user state:', { isAuthenticated, isLoading, userId: user.id });
      
      // Retry once after a short delay in case token persistence is in progress
      setTimeout(() => {
        const retryToken = getToken();
        if (retryToken) {
          console.log('Token found on retry, proceeding with unread conversations count load');
          loadUnreadConversationsCount();
        } else {
          console.warn('No token found after retry, giving up on loading unread conversations count');
          setUnreadConversationsCount(0);
        }
      }, 500);
      return;
    }
    
    console.log('Loading unread conversations count for user:', user.id);
    
    try {
      console.log('🔄 Layout: Starting conversation API call...');
      const response = await professionalMessagingService.getConversations();
      
      console.log('✅ Layout: API call successful, processing response');
      console.log('Layout: Raw API response for unread count:', response);
      
      // Handle multiple possible response structures
      let conversations = null;
      if (response?.data?.conversations && Array.isArray(response.data.conversations)) {
        conversations = response.data.conversations;
        console.log('Layout: Using response.data.conversations for unread count');
      } else if (response?.conversations && Array.isArray(response.conversations)) {
        conversations = response.conversations;
        console.log('Layout: Using response.conversations for unread count');
      } else if (Array.isArray(response)) {
        conversations = response;
        console.log('Layout: Response is direct array for unread count');
      }
      
      if (conversations && Array.isArray(conversations)) {
        // Industry Standard: Count conversations with unread messages (not total message count)
        const unreadConversations = conversations.filter(conv => {
          // A conversation is "unread" if it has any unread messages
          const hasUnreadMessages = conv.user_unread_count > 0;
          return hasUnreadMessages;
        });
        
        const unreadConversationsCount = unreadConversations.length;
        setUnreadConversationsCount(unreadConversationsCount);
        
        console.log(`🔢 Layout: Found ${unreadConversationsCount} unread conversations out of ${conversations.length} total conversations`);
        console.log('🔢 Layout: Unread conversations debug:');
        conversations.forEach((conv, index) => {
          console.log(`Conversation ${index + 1}:`, conv);
        });
        console.log('🔢 Layout: Unread conversations summary:', conversations.map(conv => ({
          id: conv.conversation_id,
          title: conv.title,
          userUnreadCount: conv.user_unread_count,
          isUnread: conv.user_unread_count > 0,
          lastMessage: conv.latest_message?.content?.substring(0, 30) || conv.last_message?.content?.substring(0, 30),
          // Debug all unread-related fields
          allUnreadFields: {
            user_unread_count: conv.user_unread_count,
            unread_count: conv.unread_count,
            unread_messages: conv.unread_messages,
            has_unread: conv.has_unread,
            is_unread: conv.is_unread
          },
          // Show all properties to find the right field
          allProperties: Object.keys(conv)
        })));
        console.log('🔢 Layout: Setting unread badge count to:', unreadConversationsCount);
        
        // Also emit event for MessagesDropdown to update
        window.dispatchEvent(new CustomEvent('conversationCountUpdated', { 
          detail: { count: unreadConversationsCount } 
        }));
      } else {
        console.warn('Layout: Unexpected response structure from professional messaging service:', response);
        setUnreadConversationsCount(0);
      }
    } catch (error: any) {
      console.error('❌ Layout: Failed to load unread conversations count:', error);
      console.error('❌ Layout: Error details:', {
        status: error.response?.status,
        message: error.message,
        code: error.code,
        type: error.constructor.name
      });
      
      // Handle specific error cases
      if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
        console.warn('⏰ Layout: API timeout - messaging service may be slow');
        setUnreadConversationsCount(0);
        // Don't retry timeout errors immediately
      } else if (error.response?.status === 401) {
        console.warn('🔐 Layout: Unauthorized access to messenger API - user may need to re-authenticate');
        setUnreadConversationsCount(0);
      } else if (error.response?.status >= 500) {
        console.error('🛠️ Layout: Server error when loading unread conversations count');
        setUnreadConversationsCount(0);
      } else {
        console.warn('❓ Layout: Unknown error, setting count to 0');
        setUnreadConversationsCount(0);
      }
    }
  };

  // Effect to load unread conversations count when user becomes available (for page refresh/initial load)
  useEffect(() => {
    if (isAuthenticated && !isLoading && user && unreadConversationsCount === 0) {
      console.log('User became available, loading unread conversations count');
      setTimeout(() => {
        loadUnreadConversationsCount();
      }, 300);
    }
  }, [user, isAuthenticated, isLoading, loadUnreadConversationsCount]);

  // Periodic fallback to refresh counter (enterprise standard)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    console.log('📡 Layout: Setting up periodic counter refresh (fallback mechanism)');
    const periodicRefresh = setInterval(() => {
      console.log('📡 Layout: Periodic counter refresh triggered');
      loadUnreadConversationsCount();
    }, 10000); // Refresh every 10 seconds for testing (normally 30)
    
    return () => {
      console.log('📡 Layout: Clearing periodic counter refresh');
      clearInterval(periodicRefresh);
    };
  }, [isAuthenticated, user, loadUnreadConversationsCount]);

  const handleLogout = async () => {
    try {
      console.log('Layout: Starting logout process...');
      setShowUserMenu(false);
      
      // Show success message immediately
      showSuccess('Signing Out', 'Signing you out...');
      
      // Wait for logout to complete
      await logout();
      console.log('Layout: Logout completed, clearing auth state...');
      
      // Small delay to ensure all cleanup is done
      setTimeout(() => {
        console.log('Layout: Forcing page reload after logout');
        // Force a hard reload to ensure we get the public version of the homepage
        // This ensures all cached state is cleared and the page starts fresh
        window.location.reload();
      }, 300);
      
    } catch (error) {
      console.error('Layout: Logout failed:', error);
      showError('Logout Failed', 'There was an error signing you out. Please try again.');
      
      // Even if logout failed, force a reload to ensure clean state after a delay
      setTimeout(() => {
        console.log('Layout: Forcing page reload after logout failure');
        window.location.reload();
      }, 1500);
    }
  };

  // Recent Activity data (moved from RightPanel)
  const recentInteractions = [
    { type: 'like', user: 'Sarah M.', action: 'liked your review', time: '2h ago', icon: '❤️', color: 'text-red-500', bgColor: 'bg-red-50' },
    { type: 'follow', user: 'Alex K.', action: 'started following you', time: '4h ago', icon: '👥', color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { type: 'comment', user: 'Mike R.', action: 'commented on your review', time: '6h ago', icon: '💬', color: 'text-green-500', bgColor: 'bg-green-50' }  ];

  // Don't auto-show notifications on mount - they will be shown when user clicks the bell
  // Handler for notification bell click
  const handleShowRecentActivity = () => {
    // Check if user is authenticated for notifications
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    // Close messages dropdown if it's open
    if (showMessagesDropdown) {
      setShowMessagesDropdown(false);
    }
    // Toggle notifications dropdown
    setShowRecentActivityDropdown((prev) => !prev);
    // Mark notifications as "seen" when user opens the dropdown
    if (!recentActivityShown) {
      setRecentActivityShown(true);
    }
  };

  // TODO: Replace with real messages from API
  const messages = [
    {
      user: 'System',
      message: 'Welcome to ReviewInn! Start by exploring entities.',
      time: '2m ago',
      avatar: 'https://ui-avatars.com/api/?name=System&background=3b82f6&color=fff&size=40&rounded=true'
    },
    {
      user: 'Platform',
      message: 'Your review received positive feedback!',
      time: '5m ago',
      avatar: 'https://ui-avatars.com/api/?name=Platform&background=10b981&color=fff&size=40&rounded=true'
    },
    {
      user: 'Moderator',
      message: 'New features available - check them out!',
      time: '10m ago',
      avatar: 'https://ui-avatars.com/api/?name=Moderator&background=f59e42&color=fff&size=40&rounded=true'
    }
  ];

  // Handler for message icon click
  const handleShowMessages = () => {
    // Check if user is authenticated for messages
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    // Close notifications dropdown if it's open
    if (showRecentActivityDropdown) {
      setShowRecentActivityDropdown(false);
    }
    // Toggle messages dropdown
    setShowMessagesDropdown((prev) => !prev);
    // Refresh unread conversations count when opening dropdown
    if (!showMessagesDropdown) {
      loadUnreadConversationsCount();
    }
  };

  // Helper function for navigation items that require auth
  const handleAuthRequiredNavigation = (_path: string, event: React.MouseEvent) => {
    if (!isAuthenticated) {
      event.preventDefault();
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const renderUserMenu = () => {
    // Enhanced auth state debugging
    console.log('Layout renderUserMenu - Auth State:', {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      userName: user?.name,
      isLoading,
      userObject: user
    });
    
    // Wait for auth to finish loading before showing sign in button
    if (isLoading) {
      return (
        <div className="btn btn-primary opacity-50">
          <LogIn size={16} />
          Loading...
        </div>
      );
    }
    
    if (!isAuthenticated || !user) {
      console.log('Layout: Showing Sign In button - not authenticated or no user');
      return (
        <button
          onClick={() => setShowAuthModal(true)}
          className="btn btn-primary"
        >
          <LogIn size={16} />
          Sign In
        </button>
      );
    }

    return (
      <div className="user-menu-container">
        <button
          onClick={() => {
            // Close notification and message dropdowns when opening user menu
            if (showRecentActivityDropdown) setShowRecentActivityDropdown(false);
            if (showMessagesDropdown) setShowMessagesDropdown(false);
            setShowUserMenu(!showUserMenu);
          }}
          className="user-menu-trigger"
        >
          <img 
            src={user.avatar || 'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg'} 
            alt={user.name || user.username || ''}
            className="user-avatar"
          />
          <span className="user-name">{user.name || user.username || ''}</span>
        </button>

        {showUserMenu && (
          <div className="user-menu-dropdown">
            <Link 
              to={`/profile/${user.id}`}
              className="menu-item"
              onClick={() => setShowUserMenu(false)}
            >
              <User size={16} />
              Profile
            </Link>
            <Link 
              to="/dashboard"
              className="menu-item"
              onClick={() => setShowUserMenu(false)}
            >
              <BarChart3 size={16} />
              Dashboard
            </Link>
            <div className="menu-divider" />
            <button 
              onClick={handleLogout}
              className="menu-item menu-item-button"
            >
              <LogOut size={16} />              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <Link to="/" className="logo">
              <h1>ReviewInn</h1>
            </Link>
            
            <nav className="main-nav">
              <Link to="/" className="nav-link">
                <Home size={16} />
                Home
              </Link>
              <Link 
                to="/entity" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/entity', e)}
              >
                <Building2 size={16} />
                Browse Entities
              </Link>
              <Link 
                to="/search" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/search', e)}
              >
                <Search size={16} />
                Search
              </Link>
              
              {/* Always show these nav items, but require auth for non-authenticated users */}
              <Link 
                to="/add-entity" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/add-entity', e)}
              >
                <Plus size={16} />
                Add Entity
              </Link>
              <Link 
                to="/circle" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/circle', e)}
              >
                <Users size={16} />
                Review Circle
              </Link>
            </nav>

            <div className="header-actions">
              {/* Notification and Message icons */}
              {/* Enterprise Notification Bell */}
              <div className="relative inline-block mr-3">
                <NotificationBell className="p-3 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group shadow-lg hover:shadow-xl" />
              </div>
              <div className="relative inline-block">
                <button
                  className="relative p-3 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group mr-4 shadow-lg hover:shadow-xl"
                  aria-label={isAuthenticated ? `Messages ${unreadConversationsCount > 0 ? `(${unreadConversationsCount} unread)` : ''}` : "Sign in to view messages"}
                  title={isAuthenticated ? 
                    `${unreadConversationsCount > 0 ? `You have ${unreadConversationsCount} unread conversation${unreadConversationsCount === 1 ? '' : 's'}` : 'All conversations read'}${isConnected ? ' • Live updates enabled' : ''}` : 
                    "Sign in to access messages"
                  }
                  onClick={handleShowMessages}
                >
                  <MessageCircle size={20} className="text-white group-hover:scale-110 transition-transform duration-200" />
                  
                  {/* Enterprise-Grade Unread Badge */}
                  {isAuthenticated && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <span className="relative flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full font-extrabold shadow-2xl border-4 border-white transform transition-all duration-200 hover:scale-110" style={{
                        fontSize: '12px',
                        minWidth: unreadConversationsCount > 9 ? '28px' : '24px',
                        height: unreadConversationsCount > 9 ? '28px' : '24px',
                        lineHeight: '1',
                        animation: 'messageNotification 2s ease-in-out infinite',
                        boxShadow: '0 4px 20px rgba(239, 68, 68, 0.6), 0 0 0 4px rgba(239, 68, 68, 0.2)',
                        background: 'linear-gradient(45deg, #ef4444, #dc2626, #b91c1c)',
                        WebkitBackgroundClip: 'padding-box',
                        backgroundClip: 'padding-box'
                      }}>
                        <span className="relative z-10 drop-shadow-sm">
                          {unreadConversationsCount > 99 ? '99+' : unreadConversationsCount || '0'}
                        </span>
                        {/* Pulse ring animation */}
                        <span className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></span>
                        {/* Secondary pulse ring for enhanced visibility */}
                        <span className="absolute -inset-1 bg-red-300 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></span>
                      </span>
                    </div>
                  )}
                  
                  
                  {/* Live Connection Indicator */}
                  {isAuthenticated && isConnected && unreadConversationsCount === 0 && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white opacity-80 animate-pulse"></div>
                  )}
                  
                  
                  {/* Login Required Indicator */}
                  {!isAuthenticated && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md" style={{fontSize:'10px'}}>
                      ?
                    </span>
                  )}
                </button>
                {isAuthenticated && (
                  <MessagesDropdown
                    open={showMessagesDropdown}
                    onClose={() => setShowMessagesDropdown(false)}
                    messages={messages}
                  />
                )}
              </div>
              {renderUserMenu()}
            </div>
          </div>
        </div>
        
      </header>

      <main className="main-content">
        <Outlet />
      </main>


      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          showSuccess('Welcome!', 'You have been successfully signed in.');
          
          // Emit login success event for other components to listen to
          window.dispatchEvent(new CustomEvent('loginSuccess'));
          
          // Force a re-render by updating state after a small delay
          setTimeout(() => {
            console.log('Layout: Forcing re-render after login success');
            setShowUserMenu(prev => prev); // This forces a re-render
          }, 100);
          
          // Redirect to intended destination if available
          const intendedDestination = sessionStorage.getItem('intendedDestination');
          if (intendedDestination && intendedDestination !== '/') {
            sessionStorage.removeItem('intendedDestination');
            window.location.href = intendedDestination;
          }
        }}
      />

      <NotificationSystem
        notifications={notifications}
        onDismiss={removeNotification}
      />

      <QuickActionsPanel />

      <style>{`        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -8px, 0);
          }
          70% {
            transform: translate3d(0, -4px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }
        
        @keyframes messageNotification {
          0% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6), 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          25% {
            transform: scale(1.02);
            box-shadow: 0 6px 24px rgba(239, 68, 68, 0.7), 0 0 0 4px rgba(239, 68, 68, 0.5);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 8px 30px rgba(239, 68, 68, 0.8), 0 0 0 8px rgba(239, 68, 68, 0.3);
          }
          75% {
            transform: scale(1.02);
            box-shadow: 0 6px 24px rgba(239, 68, 68, 0.7), 0 0 0 4px rgba(239, 68, 68, 0.2);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(239, 68, 68, 0.6), 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        
        @keyframes notificationAlert {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.1) rotate(3deg);
          }
          75% {
            transform: scale(1.1) rotate(-3deg);
          }
        }
        
        .border-3 {
          border-width: 3px;
        }
        
        .border-4 {
          border-width: 4px;
        }
        
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .header {
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px 0 rgba(168, 85, 247, 0.15);
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 4rem;
        }        .logo {
          text-decoration: none;
          color: white;
        }

        .logo h1 {
          margin: 0;
          font-size: 1.75rem;
          font-weight: 800;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          letter-spacing: -0.025em;
        }

        .main-nav {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        @media (min-width: 1024px) {
          .main-nav {
            gap: 2rem;
          }
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.9);
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          color: white;
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-menu-container {
          position: relative;
        }

        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 1rem;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.3s ease;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .user-menu-trigger:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .user-menu-trigger:hover .user-avatar {
          border-color: rgba(255, 255, 255, 0.5);
          transform: scale(1.05);
        }

        .user-name {
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .user-menu-trigger:hover .user-name {
          color: rgba(255, 255, 255, 1);
        }

        .user-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          min-width: 220px;
          overflow: hidden;
          z-index: 1000;
          animation: slideInFromTop 0.2s ease-out;
        }
        
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .menu-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          color: #374151;
          text-decoration: none;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .menu-item:hover {
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
          color: white;
          transform: translateX(4px);
        }

        .menu-item-button {
          width: 100%;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: inherit;
          font-family: inherit;
        }

        .menu-divider {
          height: 1px;
          background: var(--border-color);
          margin: 0.5rem 0;
        }

        .main-content {
          flex: 1 0 auto;
          width: 100%;
          padding: 0;
          min-height: 0;
        }

        @media (max-width: 768px) {
          .header-content {
            gap: 0.5rem;
            flex-wrap: wrap;
          }

          .header-container {
            padding: 0 0.5rem;
          }

          .main-nav {
            order: 3;
            width: 100%;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            margin-top: 0.5rem;
          }

          .nav-link {
            font-size: 0.875rem;
            padding: 0.4rem 0.8rem;
          }

          .nav-link svg {
            display: none;
          }

          .user-name {
            display: none;
          }

          .header-actions {
            gap: 0.5rem;
          }

          .logo h1 {
            font-size: 1.5rem;
          }

          .main-content {
            padding: 0.5rem;
          }
        }

        @media (max-width: 480px) {
          .main-nav {
            justify-content: center;
          }
          
          .nav-link {
            font-size: 0.8rem;
            padding: 0.3rem 0.6rem;
          }
        }
      `}</style>

      {/* Debug Panel - Development Only (uncomment to debug auth issues) */}
      {/* <AuthDebugPanel /> */}
    </div>
  );
};

export default Layout;
