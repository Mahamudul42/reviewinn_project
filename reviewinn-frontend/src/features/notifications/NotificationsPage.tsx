import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, CheckCheck, Trash2, Filter, RefreshCw, Bell, User, MessageCircle, Award, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import { enterpriseNotificationService } from '../../api/services/enterpriseNotificationService';
import type { EnterpriseNotificationData, NotificationListResponse } from '../../api/services/enterpriseNotificationService';
import { useNavigate } from 'react-router-dom';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { homepageService } from '../../api/services';
import type { Entity, Review } from '../../types';
import NotificationFilterModal from './components/NotificationFilterModal';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface NotificationFilters {
  readStatus?: 'all' | 'unread' | 'read';
  notificationType?: 'all' | 'circle' | 'review' | 'gamification' | 'social';
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();
  
  const [notifications, setNotifications] = useState<NotificationListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Track auth changes to prevent infinite loops
  const lastUserId = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const perPage = 20;

  // Load notifications - optimized to prevent excessive API calls
  const loadNotifications = useCallback(async (page: number = 1) => {
    if (!isAuthenticated || !currentUser) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await enterpriseNotificationService.getNotifications(page, perPage);
      setNotifications(data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [perPage, isAuthenticated, currentUser?.id]); // Only depend on user ID, not full user object

  // Check authentication and load notifications
  useEffect(() => {
    // Don't do anything if auth is still loading
    if (authLoading) {
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
    
    // Check if user is authenticated before loading notifications
    if (!currentUser) {
      // Use React Router navigation instead of window.location.href to avoid redirect loops
      navigate('/login', { state: { from: '/notifications' } });
      return;
    }
    
    loadNotifications();
  }, [currentUser?.id, authLoading, navigate, loadNotifications]);

  // Filter notifications based on modal filters
  const filteredNotifications = notifications?.notifications?.filter(notification => {
    // Apply read status filter
    if (filters.readStatus && filters.readStatus !== 'all') {
      if (filters.readStatus === 'unread' && notification.is_read) return false;
      if (filters.readStatus === 'read' && !notification.is_read) return false;
    }

    // Apply notification type filter
    if (filters.notificationType && filters.notificationType !== 'all') {
      switch (filters.notificationType) {
        case 'circle':
          return notification.type.includes('circle');
        case 'review':
          return notification.type.includes('review');
        case 'gamification':
          return ['badge_earned', 'level_up', 'milestone_reached', 'daily_task_complete'].includes(notification.type);
        case 'social':
          return ['friend_request', 'friend_accepted', 'user_followed', 'user_mentioned'].includes(notification.type);
        default:
          return true;
      }
    }

    return true;
  }) || [];

  // Handle notification click
  const handleNotificationClick = async (notification: EnterpriseNotificationData) => {
    try {
      // Mark as read if not already read
      if (!notification.is_read) {
        await enterpriseNotificationService.markAsRead(notification.notification_id);
        // Refresh notifications
        await loadNotifications(currentPage);
      }

      // Navigate based on notification type
      navigateToNotificationTarget(notification);
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  const navigateToNotificationTarget = (notification: EnterpriseNotificationData) => {
    const { type: notification_type, entity_id } = notification;

    switch (notification_type) {
      case 'circle_request':
      case 'circle_accepted':
      case 'circle_declined':
        navigate('/circle');
        break;
      case 'review_reply':
      case 'review_vote':
      case 'review_reaction':
      case 'review_comment':
        if (entity_id) {
          navigate(`/review/${entity_id}`);
        }
        break;
      case 'review_same_entity':
        if (entity_id) {
          navigate(`/entity/${entity_id}`);
        }
        break;
      case 'badge_earned':
      case 'level_up':
      case 'milestone_reached':
        navigate('/dashboard');
        break;
      case 'friend_request':
      case 'friend_accepted':
      case 'user_followed':
        navigate('/profile');
        break;
      case 'message':
        navigate('/messages');
        break;
      default:
        break;
    }
  };

  // Handle bulk actions
  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.notification_id)));
    }
  };

  const handleSelectNotification = (notificationId: number) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const handleBulkMarkAsRead = async () => {
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedNotifications).map(id => 
        enterpriseNotificationService.markAsRead(id)
      );
      await Promise.all(promises);
      setSelectedNotifications(new Set());
      await loadNotifications(currentPage);
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedNotifications).map(id => 
        enterpriseNotificationService.deleteNotification(id)
      );
      await Promise.all(promises);
      setSelectedNotifications(new Set());
      await loadNotifications(currentPage);
    } catch (err) {
      console.error('Failed to delete notifications:', err);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await enterpriseNotificationService.markAllAsRead();
      await loadNotifications(currentPage);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Get filter stats
  const getFilterStats = () => {
    const allNotifications = notifications?.notifications || [];
    return {
      all: allNotifications.length,
      unread: allNotifications.filter(n => !n.is_read).length,
      read: allNotifications.filter(n => n.is_read).length,
      circle: allNotifications.filter(n => n.type.includes('circle')).length,
      review: allNotifications.filter(n => n.type.includes('review')).length,
      gamification: allNotifications.filter(n => ['badge_earned', 'level_up', 'milestone_reached', 'daily_task_complete'].includes(n.type)).length,
      social: allNotifications.filter(n => ['friend_request', 'friend_accepted', 'user_followed', 'user_mentioned'].includes(n.type)).length,
    };
  };

  const filterStats = getFilterStats();

  const handleFiltersChange = (newFilters: NotificationFilters) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // Filters are applied automatically through state change
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== '' && value !== 'all'
    ).length;
  };

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <ThreePanelLayout
        pageTitle="🔔 Notifications"
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Recent Activity"
        centerPanelWidth="700px"
        headerGradient="from-amber-600 via-orange-600 to-red-800"
        centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </ThreePanelLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!currentUser) {
    return null;
  }

  return (
    <ThreePanelLayout
      pageTitle="🔔 Notifications"
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Recent Activity"
      centerPanelWidth="700px"
      headerGradient="from-amber-600 via-orange-600 to-red-800"
      centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
      variant="full-width"
    >
      {/* Notifications Middle Panel Content */}
      <div className="w-full">
        {/* Bulk Actions */}
        {selectedNotifications.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedNotifications.size} notification(s) selected
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkMarkAsRead}
                  disabled={bulkActionLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>Mark Read</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow-sm border">
            {/* List Header */}
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
              {/* Main Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Bell className="h-6 w-6 text-blue-600" />
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-xs text-gray-600">
                      {notifications ? `${notifications.total || 0} total notifications` : 'Loading...'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadNotifications(currentPage)}
                    disabled={loading}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                  {notifications?.notifications?.some(n => !n.is_read) && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      <CheckCheck size={14} />
                      <span>Mark All Read</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Filter and Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    aria-label="Select all notifications"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {filteredNotifications.length} notification(s)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all text-sm ${
                      getActiveFilterCount() > 0
                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Sliders size={14} />
                    <span>Filters</span>
                    {getActiveFilterCount() > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* List Content */}
            <div className="divide-y divide-gray-200">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {error && (
                <div className="px-4 py-8 text-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <div className="text-red-600 text-sm font-medium mb-2">Error Loading Notifications</div>
                    <div className="text-red-500 text-sm mb-4">{error}</div>
                    <button
                      onClick={() => loadNotifications(currentPage)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}

              {!loading && !error && filteredNotifications.length === 0 && (
                <div className="px-4 py-12 text-center text-gray-500">
                  <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium">No notifications found</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              )}

              {filteredNotifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : 'bg-white'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                  aria-label={`Notification: ${notification.title}. ${notification.is_read ? 'Read' : 'Unread'}`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.notification_id)}
                      onChange={() => handleSelectNotification(notification.notification_id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label={`Select notification: ${notification.title}`}
                    />
                    
                    <div className="flex-shrink-0 mt-1">
                      <span className="text-2xl">
                        {enterpriseNotificationService.getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500">
                            {enterpriseNotificationService.formatTimeAgo(notification.created_at)}
                          </p>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        {notification.actor_avatar && (
                          <img
                            src={notification.actor_avatar}
                            alt={notification.actor_name || 'User'}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <p className="text-sm text-gray-600">
                          {notification.actor_name && (
                            <span className="font-medium text-gray-900">
                              {notification.actor_name}
                            </span>
                          )}{' '}
                          {notification.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {notifications && (notifications.total || 0) > perPage && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => loadNotifications(currentPage - 1)}
                  disabled={!notifications?.has_prev || loading}
                  className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {Math.ceil((notifications?.total || 0) / perPage)}
                </span>
                <button
                  onClick={() => loadNotifications(currentPage + 1)}
                  disabled={!notifications?.has_next || loading}
                  className="flex items-center space-x-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, notifications?.total || 0)} of {notifications?.total || 0} notifications
              </div>
            </div>
          )}
        </div>

      {/* Filter Modal */}
      <NotificationFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        filterStats={filterStats}
      />

      <style>{`
        .max-width-container {
          max-width: 1200px;
        }
      `}</style>
    </ThreePanelLayout>
  );
};

export default NotificationsPage;