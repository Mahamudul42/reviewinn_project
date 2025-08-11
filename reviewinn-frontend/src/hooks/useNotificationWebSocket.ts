import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { notificationService } from '../api/services/notificationService';
import type { NotificationData } from '../api/services/notificationService';
import { useUnifiedAuth } from './useUnifiedAuth';

export interface NotificationWebSocketMessage {
  type: 'new_notification' | 'notification_read' | 'notification_deleted';
  data: NotificationData;
}

export interface UseNotificationWebSocketOptions {
  onNewNotification?: (notification: NotificationData) => void;
  onNotificationRead?: (notification: NotificationData) => void;
  onNotificationDeleted?: (notificationId: number) => void;
  enabled?: boolean;
}

export const useNotificationWebSocket = (options: UseNotificationWebSocketOptions = {}) => {
  const { isAuthenticated, getToken } = useUnifiedAuth();
  const {
    onNewNotification,
    onNotificationRead,
    onNotificationDeleted,
    enabled = true
  } = options;

  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<NotificationData[]>([]);

  // Load initial notification summary
  const loadNotificationSummary = useCallback(async () => {
    // Only load if user is authenticated
    if (!isAuthenticated || !getToken()) {
      setUnreadCount(0);
      setLatestNotifications([]);
      return;
    }
    
    try {
      const summary = await notificationService.getNotificationSummary();
      setUnreadCount(summary.total_unread);
      setLatestNotifications(summary.recent_notifications);
    } catch (error: any) {
      // Handle authentication errors gracefully
      if (error.status === 401 || error.status === 403) {
        setUnreadCount(0);
        setLatestNotifications([]);
      } else {
        console.error('Failed to load notification summary:', error);
      }
    }
  }, [isAuthenticated, getToken]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    // Only handle notification messages, ignore other WebSocket messages
    if (!message || typeof message !== 'object' || !message.type) {
      return;
    }
    
    console.log('WebSocket message received:', message);
    
    // Handle notification-specific messages
    if (message.type === 'new_notification') {
      const notification = message.data as NotificationData;
      console.log('New notification received:', notification);
      
      // Update unread count
      setUnreadCount(prev => prev + 1);
      
      // Add to latest notifications
      setLatestNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      // Call custom handler
      onNewNotification?.(notification);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: `${notification.actor_name || 'Someone'} ${notification.content}`,
          icon: notification.actor_avatar || '/favicon.ico',
          tag: `notification-${notification.notification_id}`,
          requireInteraction: false,
          silent: false
        });
      }
    } else if (message.type === 'notification_read') {
      const notification = message.data as NotificationData;
      console.log('Notification marked as read:', notification);
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Update notification in latest list
      setLatestNotifications(prev => 
        prev.map(n => 
          n.notification_id === notification.notification_id 
            ? { ...n, is_read: true }
            : n
        )
      );
      
      // Call custom handler
      onNotificationRead?.(notification);
    } else if (message.type === 'notification_deleted') {
      const notificationId = message.data as number;
      console.log('Notification deleted:', notificationId);
      
      // Remove from latest notifications
      setLatestNotifications(prev => 
        prev.filter(n => n.notification_id !== notificationId)
      );
      
      // Update unread count (if it was unread)
      const deletedNotification = latestNotifications.find(n => n.notification_id === notificationId);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Call custom handler
      onNotificationDeleted?.(notificationId);
    }
  }, [onNewNotification, onNotificationRead, onNotificationDeleted, latestNotifications]);

  // WebSocket connection - only for authenticated users
  const { isConnected, isConnecting, sendMessage } = useWebSocket({
    endpoint: 'notifications', // Use notifications endpoint instead of messenger
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('Notification WebSocket connected');
      // Load initial data when connected
      loadNotificationSummary();
    },
    onDisconnect: () => {
      console.log('Notification WebSocket disconnected');
    },
    onError: (error) => {
      console.warn('Notification WebSocket error (not critical):', error);
    },
    shouldReconnect: enabled,
    reconnectAttempts: 3, // Limit reconnection attempts
    reconnectInterval: 10000, // Wait 10 seconds between attempts
  });

  // Load initial notification summary on mount
  useEffect(() => {
    if (enabled && isAuthenticated && getToken()) {
      loadNotificationSummary();
    }
  }, [enabled, loadNotificationSummary]);

  // Request notification permission
  useEffect(() => {
    if (enabled && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, [enabled]);

  // Refresh notification summary periodically
  useEffect(() => {
    if (!enabled || !isAuthenticated || !getToken()) return;

    const interval = setInterval(() => {
      loadNotificationSummary();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [enabled, loadNotificationSummary]);

  // Subscribe to notification events
  const subscribeToNotifications = useCallback(() => {
    if (isConnected) {
      sendMessage({ type: 'subscribe_notifications' });
    }
  }, [isConnected, sendMessage]);

  // Unsubscribe from notification events
  const unsubscribeFromNotifications = useCallback(() => {
    if (isConnected) {
      sendMessage({ type: 'unsubscribe_notifications' });
    }
  }, [isConnected, sendMessage]);

  // Auto-subscribe when connected
  useEffect(() => {
    if (isConnected && enabled) {
      subscribeToNotifications();
    }
  }, [isConnected, enabled, subscribeToNotifications]);

  // Mark notification as read via WebSocket
  const markAsReadViaWebSocket = useCallback((notificationId: number) => {
    if (isConnected) {
      sendMessage({ 
        type: 'mark_notification_read',
        notification_id: notificationId
      });
    }
  }, [isConnected, sendMessage]);

  // Delete notification via WebSocket
  const deleteNotificationViaWebSocket = useCallback((notificationId: number) => {
    if (isConnected) {
      sendMessage({
        type: 'delete_notification',
        notification_id: notificationId
      });
    }
  }, [isConnected, sendMessage]);

  // Refresh notification summary manually
  const refreshNotificationSummary = useCallback(() => {
    loadNotificationSummary();
  }, [loadNotificationSummary]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    
    // Notification state
    unreadCount,
    latestNotifications,
    
    // Actions
    subscribeToNotifications,
    unsubscribeFromNotifications,
    markAsReadViaWebSocket,
    deleteNotificationViaWebSocket,
    refreshNotificationSummary,
    
    // Utility
    loadNotificationSummary,
  };
};