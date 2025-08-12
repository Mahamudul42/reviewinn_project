import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { User, Search, BarChart3, LogOut, LogIn, Bell, MessageCircle, Users, Building2 } from 'lucide-react';
import AuthModal from '../../features/auth/components/AuthModal';
import NotificationSystem, { useNotifications } from '../organisms/NotificationSystem';
import QuickActionsPanel from '../organisms/QuickActionsPanel';
import RecentActivityDropdown from '../molecules/RecentActivityDropdown';
import MessagesDropdown from '../molecules/MessagesDropdown';
import NotificationsDropdown from '../molecules/NotificationsDropdown';
import { messengerService } from '../../api/services/messengerService';
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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // Track unread messages
  const {
    notifications,
    removeNotification,
    showSuccess,
    showError
  } = useNotifications();

  // WebSocket for real-time updates (only when authenticated)
  useWebSocket({
    enabled: isAuthenticated,
    onMessage: (message) => {
      if (message.type === 'new_message') {
        // Update unread count when new message arrives
        loadUnreadCount();
      }
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
      // Clear message count
      setUnreadMessagesCount(0);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal as EventListener);
    window.addEventListener('loginSuccess', handleLoginSuccess as EventListener);
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    window.addEventListener('authLogout', handleAuthLogout as EventListener);

    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal as EventListener);
      window.removeEventListener('loginSuccess', handleLoginSuccess as EventListener);
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('authLogout', handleAuthLogout as EventListener);
    };
  }, []);

  // Separate effect for auth state changes (without loading unread count immediately)
  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      // Reset message counts when user logs out or is loading
      setUnreadMessagesCount(0);
      setShowMessagesDropdown(false);
      setShowRecentActivityDropdown(false);
    }
  }, [isAuthenticated, isLoading]);

  // Effect to load unread count when user becomes available (for page refresh/initial load)
  useEffect(() => {
    if (isAuthenticated && !isLoading && user && unreadMessagesCount === 0) {
      console.log('User became available, loading unread count');
      setTimeout(() => {
        loadUnreadCount();
      }, 300);
    }
  }, [user, isAuthenticated, isLoading]);

  const loadUnreadCount = async () => {
    // Only load unread count if user is authenticated and not still loading
    if (!isAuthenticated || isLoading || !user) {
      setUnreadMessagesCount(0);
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
          console.log('Token found on retry, proceeding with unread count load');
          loadUnreadCount();
        } else {
          console.warn('No token found after retry, giving up on loading unread count');
          setUnreadMessagesCount(0);
        }
      }, 500);
      return;
    }
    
    console.log('Loading unread message count for user:', user.id);
    
    try {
      const response = await messengerService.getConversations();
      
      // Check if response has the expected structure
      if (response && response.conversations && Array.isArray(response.conversations)) {
        const totalUnread = response.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
        setUnreadMessagesCount(totalUnread);
      } else {
        console.warn('Unexpected response structure from messenger service:', response);
        setUnreadMessagesCount(0);
      }
    } catch (error: any) {
      console.error('Failed to load unread count:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        console.warn('Unauthorized access to messenger API - user may need to re-authenticate');
        // Don't show error to user, just set count to 0
        setUnreadMessagesCount(0);
        // Don't call logout here as it could interfere with the auth flow
      } else if (error.response?.status >= 500) {
        console.error('Server error when loading unread count');
        setUnreadMessagesCount(0);
      } else {
        // For other errors, just set count to 0 without showing error
        setUnreadMessagesCount(0);
      }
    }
  };
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
    // Refresh unread count when opening dropdown
    if (!showMessagesDropdown) {
      loadUnreadCount();
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
                Home
              </Link>
              <Link 
                to="/search" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/search', e)}
              >
                <Search size={16} />
                Search
              </Link>
              <Link 
                to="/entity" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/entity', e)}
              >
                <Building2 size={16} />
                Browse Entities
              </Link>
              
              {/* Always show these nav items, but require auth for non-authenticated users */}
              <Link 
                to="/add-entity" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/add-entity', e)}
              >
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
              <Link 
                to="/dashboard" 
                className="nav-link"
                onClick={(e) => handleAuthRequiredNavigation('/dashboard', e)}
              >
                <BarChart3 size={16} />
                Dashboard
              </Link>
            </nav>

            <div className="header-actions">
              {/* Notification and Message icons */}
              <div className="relative inline-block">
                <button
                  className="relative p-3 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group mr-3 shadow-lg hover:shadow-xl"
                  aria-label={isAuthenticated ? "Notifications" : "Sign in to view notifications"}
                  title={isAuthenticated ? "View your notifications" : "Sign in to access notifications"}
                  onClick={handleShowRecentActivity}
                >
                  <Bell size={20} className="text-white group-hover:scale-110 transition-transform duration-200" />
                  {isAuthenticated && !recentActivityShown && recentInteractions.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse" style={{fontSize:'11px'}}>
                      {recentInteractions.length}
                    </span>
                  )}
                  {!isAuthenticated && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md" style={{fontSize:'11px'}}>
                      ?
                    </span>
                  )}
                </button>
                {isAuthenticated ? (
                  <NotificationsDropdown
                    open={showRecentActivityDropdown}
                    onClose={() => setShowRecentActivityDropdown(false)}
                  />
                ) : (
                  <RecentActivityDropdown
                    open={showRecentActivityDropdown}
                    onClose={() => setShowRecentActivityDropdown(false)}
                    interactions={recentInteractions}
                  />
                )}
              </div>
              <div className="relative inline-block">
                <button
                  className="relative p-3 rounded-xl bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 group mr-4 shadow-lg hover:shadow-xl"
                  aria-label={isAuthenticated ? "Messages" : "Sign in to view messages"}
                  title={isAuthenticated ? "View your messages" : "Sign in to access messages"}
                  onClick={handleShowMessages}
                >
                  <MessageCircle size={20} className="text-white group-hover:scale-110 transition-transform duration-200" />
                  {isAuthenticated && unreadMessagesCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg animate-pulse" style={{fontSize:'11px'}}>
                      {unreadMessagesCount}
                    </span>
                  )}
                  {!isAuthenticated && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md" style={{fontSize:'11px'}}>
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

      <style>{`        .layout {
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
