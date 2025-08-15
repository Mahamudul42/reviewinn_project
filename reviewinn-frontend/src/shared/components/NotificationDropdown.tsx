/**
 * Enterprise Notification Dropdown Modal
 * Optimized for 10M+ users with real-time updates
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Settings, Archive, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  enterpriseNotificationService, 
  type EnterpriseNotificationData, 
  type NotificationDropdownResponse 
} from '../../api/services/enterpriseNotificationService';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  triggerRef
}) => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useUnifiedAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notificationData, setNotificationData] = useState<NotificationDropdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAsRead, setMarkingAsRead] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<Set<number>>(new Set());

  // Load notifications when dropdown opens
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await enterpriseNotificationService.getNotificationDropdown();
      // Ensure data has proper structure
      setNotificationData({
        notifications: data?.notifications || [],
        unread_count: data?.unread_count || 0,
        urgent_count: data?.urgent_count || 0,
        has_more: data?.has_more || false,
        last_checked: data?.last_checked || null
      });
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Handle notification click
  const handleNotificationClick = async (notification: EnterpriseNotificationData) => {
    try {
      // Mark as read if unread
      if (!notification.is_read) {
        setMarkingAsRead(prev => new Set(prev).add(notification.notification_id));
        
        const success = await enterpriseNotificationService.markAsRead(notification.notification_id);
        if (success) {
          // Update local state
          setNotificationData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              notifications: prev.notifications.map(n => 
                n.notification_id === notification.notification_id 
                  ? { ...n, is_read: true }
                  : n
              ),
              unread_count: Math.max(0, prev.unread_count - 1)
            };
          });
        }
        
        setMarkingAsRead(prev => {
          const newSet = new Set(prev);
          newSet.delete(notification.notification_id);
          return newSet;
        });
      }

      // Navigate based on notification type
      navigateToNotificationTarget(notification);
      onClose();
    } catch (err) {
      console.error('Failed to handle notification click:', err);
      setMarkingAsRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.notification_id);
        return newSet;
      });
    }
  };

  const navigateToNotificationTarget = (notification: EnterpriseNotificationData) => {
    const { type, entity_id, entity_type } = notification;

    switch (type) {
      case 'review_reply':
      case 'review_reaction':
      case 'review_comment':
      case 'review_vote':
        if (entity_id) {
          navigate(`/entity/${entity_id}`);
        }
        break;
      case 'review_same_entity':
        if (entity_id) {
          navigate(`/entity/${entity_id}`);
        }
        break;
      case 'circle_request':
      case 'circle_accepted':
      case 'circle_declined':
        navigate('/circle');
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
      case 'message_reaction':
        navigate('/messenger');
        break;
      case 'entity_claimed':
      case 'entity_verified':
      case 'entity_updated':
        if (entity_id) {
          navigate(`/entity/${entity_id}`);
        }
        break;
      default:
        console.log('No navigation configured for notification type:', type);
        break;
    }
  };

  // Mark notification as read without navigation
  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    
    try {
      setMarkingAsRead(prev => new Set(prev).add(notificationId));
      
      const success = await enterpriseNotificationService.markAsRead(notificationId);
      if (success) {
        setNotificationData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            notifications: prev.notifications.map(n => 
              n.notification_id === notificationId 
                ? { ...n, is_read: true }
                : n
            ),
            unread_count: Math.max(0, prev.unread_count - 1)
          };
        });
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingAsRead(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Delete notification
  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    
    try {
      setDeleting(prev => new Set(prev).add(notificationId));
      
      const success = await enterpriseNotificationService.deleteNotification(notificationId);
      if (success) {
        setNotificationData(prev => {
          if (!prev) return prev;
          
          const deletedNotification = prev.notifications.find(n => n.notification_id === notificationId);
          const wasUnread = deletedNotification && !deletedNotification.is_read;
          
          return {
            ...prev,
            notifications: prev.notifications.filter(n => n.notification_id !== notificationId),
            unread_count: wasUnread ? Math.max(0, prev.unread_count - 1) : prev.unread_count
          };
        });
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const result = await enterpriseNotificationService.markAllAsRead();
      if (result.success) {
        setNotificationData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
            unread_count: 0
          };
        });
      }
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  if (!isOpen) return null;

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
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600">
                <p className="text-sm">{error}</p>
                <button
                  onClick={loadNotifications}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}
          
          {!loading && !error && (!notificationData || !notificationData.notifications || notificationData.notifications.length === 0) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No notifications yet.</p>
                <p className="text-sm">When you get notifications, they'll appear here.</p>
              </div>
            </div>
          )}
          
          {!loading && !error && notificationData && notificationData.notifications && notificationData.notifications.length > 0 && (notificationData.notifications || []).map((notification) => (
            <div
              key={notification.notification_id}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-start gap-3 p-3 rounded-xl shadow-sm hover:bg-blue-50 transition-colors cursor-pointer flex-shrink-0 ${
                !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 mt-1">
                <span className="text-xl">
                  {enterpriseNotificationService.getNotificationIcon(notification.type)}
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
                  {enterpriseNotificationService.formatTimeAgo(notification.created_at)}
                </span>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {!loading && !error && (
          <div className="mt-4 pt-3 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Bell size={16} />
              See All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;