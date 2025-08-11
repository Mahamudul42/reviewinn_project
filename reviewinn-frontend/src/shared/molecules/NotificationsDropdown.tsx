import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, X } from 'lucide-react';
import { notificationService } from '../../api/services/notificationService';
import type { NotificationData } from '../../api/services/notificationService';

interface NotificationsDropdownProps {
  open: boolean;
  onClose: () => void;
}

const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ open, onClose }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecentNotifications();
    }
  }, [open]);

  const loadRecentNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(1, 10); // Get first 10 notifications
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to load recent notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    try {
      // Mark as read if not already read
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.notification_id);
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.notification_id === notification.notification_id 
              ? { ...n, is_read: true }
              : n
          )
        );
      }
      
      // Navigate based on notification type (you can customize this logic)
      navigateToNotificationTarget(notification);
      onClose();
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  };

  const navigateToNotificationTarget = (notification: NotificationData) => {
    const { notification_type, entity_id } = notification;
    
    // This is the same logic from NotificationsPage.tsx
    switch (notification_type) {
      case 'CIRCLE_REQUEST':
      case 'CIRCLE_ACCEPTED':
      case 'CIRCLE_DECLINED':
        window.location.href = '/circle';
        break;
      case 'REVIEW_REPLY':
      case 'REVIEW_VOTE':
      case 'COMMENT':
        if (entity_id) {
          window.location.href = `/review/${entity_id}`;
        }
        break;
      case 'BADGE_EARNED':
        window.location.href = '/dashboard';
        break;
      case 'FRIEND_REQUEST':
        window.location.href = '/profile';
        break;
      case 'MESSAGE':
        window.location.href = '/messages';
        break;
      default:
        // For other types, just go to notifications page
        window.location.href = '/notifications';
        break;
    }
  };

  const getNotificationIcon = (notificationType: string) => {
    return notificationService.getNotificationIcon(notificationType);
  };

  if (!open) return null;

  return (
    <div className="absolute right-0 mt-2 z-50" style={{right: '12px', width: '384px'}}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-fade-in" style={{minHeight: '400px', width: '100%'}}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-lg text-blue-800">Notifications</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold" aria-label="Close">×</button>
        </div>
        
        <div className="flex flex-col gap-3 overflow-y-auto" style={{height: '280px'}}>
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            </div>
          )}
          
          {!loading && notifications.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No notifications yet.</p>
                <p className="text-sm">When you get notifications, they'll appear here.</p>
              </div>
            </div>
          )}
          
          {!loading && notifications.map((notification) => (
            <div
              key={notification.notification_id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-3 p-3 rounded-xl shadow-sm hover:bg-blue-50 transition-colors cursor-pointer flex-shrink-0 ${
                !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                <span className="text-xl">
                  {getNotificationIcon(notification.notification_type)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{notification.title}</div>
                <div className="text-gray-600 text-xs">
                  {notification.actor_name && (
                    <span className="font-medium text-gray-800">{notification.actor_name} </span>
                  )}
                  {notification.content}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  {formatTime(notification.created_at)}
                </span>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {!loading && (
          <div className="mt-4 pt-3 border-t border-gray-200 flex-shrink-0">
            <Link
              to="/notifications"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Bell size={16} />
              See All Notifications
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;