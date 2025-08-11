import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Trash2, ExternalLink } from 'lucide-react';
import { notificationService } from '../../api/services/notificationService';
import type { NotificationData, NotificationSummary } from '../../api/services/notificationService';
import { useNavigate } from 'react-router-dom';
import { useNotificationWebSocket } from '../../hooks/useNotificationWebSocket';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface NotificationIconProps {
  className?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, getToken } = useUnifiedAuth();

  // WebSocket for real-time notifications - only for authenticated users
  const {
    unreadCount,
    latestNotifications,
    isConnected,
    refreshNotificationSummary,
    markAsReadViaWebSocket,
    deleteNotificationViaWebSocket
  } = useNotificationWebSocket({
    enabled: true, // Will check auth token internally
    onNewNotification: (notification) => {
      console.log('New notification received:', notification);
      // The WebSocket hook handles updating the counts automatically
      // We just need to refresh the summary if the dropdown is open
      if (isOpen) {
        loadSummary();
      }
    },
    onNotificationRead: (notification) => {
      console.log('Notification marked as read:', notification);
      // Refresh summary if dropdown is open
      if (isOpen) {
        loadSummary();
      }
    },
    onNotificationDeleted: (notificationId) => {
      console.log('Notification deleted:', notificationId);
      // Refresh summary if dropdown is open
      if (isOpen) {
        loadSummary();
      }
    }
  });

  // Load notification summary
  const loadSummary = async () => {
    // Only load if user is authenticated
    if (!getToken()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const summaryData = await notificationService.getNotificationSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load notification summary:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Load summary on mount - only for authenticated users
  useEffect(() => {
    if (getToken()) {
      loadSummary();
    }
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      // Mark as read if not already read
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.notification_id);
        // Refresh summary
        await loadSummary();
      }

      // Navigate based on notification type
      navigateToNotificationTarget(notification);
    } catch (err) {
      console.error('Failed to handle notification click:', err);
    }
  };

  const navigateToNotificationTarget = (notification: NotificationData) => {
    const { notification_type, entity_type, entity_id } = notification;

    switch (notification_type) {
      case 'CIRCLE_REQUEST':
      case 'CIRCLE_ACCEPTED':
      case 'CIRCLE_DECLINED':
      case 'circle_request':
      case 'circle_accepted':
      case 'circle_declined':
      case 'circle_invite':
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
        // For other types, just close the dropdown
        setIsOpen(false);
        break;
    }
  };

  const handleMarkAsRead = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationService.markAsRead(notificationId);
      await loadSummary();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      await loadSummary();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadSummary();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadSummary();
          }
        }}
        className="relative p-2 rounded-full hover:bg-blue-50 transition group"
        aria-label="Notifications"
      >
        <Bell size={22} className="text-blue-700 group-hover:text-blue-900" />
        {/* Use WebSocket unread count with fallback to summary */}
        {(unreadCount > 0 || (summary && summary.total_unread > 0)) && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold shadow min-w-[20px] text-center">
            {(() => {
              const count = unreadCount > 0 ? unreadCount : (summary?.total_unread || 0);
              return count > 99 ? '99+' : count;
            })()}
          </span>
        )}
        {/* Connection indicator */}
        {isConnected && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
        )}
      </button>

      {/* Dropdown - Facebook-style */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-300 z-50 max-h-[500px] overflow-hidden">
          {/* Header - Facebook-style */}
          <div className="px-4 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Review Notifications</h3>
              <div className="flex items-center space-x-3">
                {(unreadCount > 0 || (summary && summary.total_unread > 0)) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-3 py-1 rounded-full transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Content - Facebook-style */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="px-4 py-6 text-center text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Use WebSocket data if available, otherwise fall back to summary */}
            {(() => {
              const notifications = latestNotifications.length > 0 ? latestNotifications : (summary?.recent_notifications || []);
              
              if (notifications.length === 0 && !loading) {
                return (
                  <div className="px-4 py-12 text-center text-gray-500">
                    <div className="text-6xl mb-4">🔔</div>
                    <h4 className="text-lg font-semibold mb-2">No review notifications yet</h4>
                    <p className="text-sm">When you get notifications about reviews, circles, and interactions, they'll appear here.</p>
                  </div>
                );
              }

              return notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`px-4 py-4 border-b border-gray-100 cursor-pointer transition-all duration-150 hover:bg-gray-50 ${
                    notification.is_read ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar/Icon - Facebook-style */}
                    <div className="flex-shrink-0">
                      {notification.actor_avatar ? (
                        <img
                          src={notification.actor_avatar}
                          alt={notification.actor_name || 'User'}
                          className="w-12 h-12 rounded-full border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl">
                          {notificationService.getNotificationIcon(notification.notification_type)}
                        </div>
                      )}
                    </div>

                    {/* Content - Facebook-style */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {notification.actor_name && (
                              <span className="font-semibold text-gray-900">
                                {notification.actor_name}
                              </span>
                            )}{' '}
                            <span className="text-gray-700">{notification.content}</span>
                          </p>
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            {notificationService.formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        
                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full ml-2 flex-shrink-0"></div>
                        )}
                      </div>
                      
                      {/* Actions - Facebook-style */}
                      <div className="flex items-center space-x-4 mt-2">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notification.notification_id, e)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                            title="Mark as read"
                          >
                            Mark as read
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(notification.notification_id, e)}
                          className="text-xs text-gray-500 hover:text-red-600 font-semibold hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          title="Remove"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Footer - Facebook-style */}
          {(() => {
            const notifications = latestNotifications.length > 0 ? latestNotifications : (summary?.recent_notifications || []);
            return notifications.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleViewAllNotifications}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-semibold py-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>See All Review Notifications</span>
                  <ExternalLink size={16} />
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;