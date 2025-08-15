import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';

export interface NotificationData {
  notification_id: number;
  user_id: number;
  actor_id?: number;
  type: string; // Changed from notification_type to type
  entity_type?: string;
  entity_id?: number;
  title: string;
  content: string;
  is_read: boolean;
  priority: string; // Added enterprise fields
  delivery_status: string;
  notification_data?: Record<string, unknown>; // Changed from data to notification_data
  expires_at?: string;
  created_at: string;
  updated_at: string;
  actor_name?: string;
  actor_avatar?: string;
  actor_username?: string;
}

export interface NotificationSummary {
  total_unread: number;
  recent_notifications: NotificationData[];
}

export interface NotificationListResponse {
  notifications: NotificationData[];
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface NotificationCreate {
  user_id: number;
  actor_id?: number;
  type: string; // Changed from notification_type to type
  entity_type?: string;
  entity_id?: number;
  title: string;
  content: string;
  priority?: string;
  delivery_status?: string;
  notification_data?: Record<string, unknown>; // Changed from data to notification_data
}

export interface NotificationUpdate {
  is_read?: boolean;
}

class NotificationService {
  private baseUrl = `${API_CONFIG.BASE_URL}/enterprise-notifications`;

  async getNotificationSummary(): Promise<NotificationSummary> {
    try {
      const response = await httpClient.get(`${this.baseUrl}/summary`);
      const apiData = response.data;
      
      // Merge with demo notifications
      const demoData = this.getDemoNotificationSummary();
      
      return {
        total_unread: apiData.total_unread + demoData.total_unread,
        recent_notifications: [...demoData.recent_notifications, ...apiData.recent_notifications].slice(0, 10)
      };
    } catch (error: any) {
      // Handle authentication errors differently
      if (error.status === 401 || error.status === 403) {
        console.log('User not authenticated for notifications, showing demo notifications only');
        return this.getDemoNotificationSummary();
      }
      console.error('Failed to fetch notification summary:', error);
      // Return demo notifications if API fails
      return this.getDemoNotificationSummary();
    }
  }

  private getDemoNotificationSummary(): NotificationSummary {
    // Import authService dynamically to avoid circular dependencies
    const authService = (window as any).authService || (() => {
      try {
        return require('../../api/auth').authService;
      } catch {
        return null;
      }
    })();
    
    const authState = authService?.getAuthState();
    const currentUser = authState?.user;
    
    if (!currentUser) {
      return {
        total_unread: 0,
        recent_notifications: []
      };
    }
    
    // Load demo notifications for current user
    const demoNotificationsKey = `demo_notifications_${currentUser.id}`;
    const demoUnreadKey = `demo_unread_count_${currentUser.id}`;
    
    const demoNotifications = JSON.parse(localStorage.getItem(demoNotificationsKey) || '[]');
    const demoUnreadCount = parseInt(localStorage.getItem(demoUnreadKey) || '0');
    
    return {
      total_unread: demoUnreadCount,
      recent_notifications: demoNotifications.slice(0, 10)
    };
  }

  async getNotifications(page: number = 1, perPage: number = 20): Promise<NotificationListResponse> {
    try {
      const response = await httpClient.get(`${this.baseUrl}?page=${page}&per_page=${perPage}`);
      const apiData = response.data;
      
      // Merge with demo notifications
      const demoData = this.getDemoNotifications(page, perPage);
      
      const allNotifications = [...demoData.notifications, ...apiData.notifications];
      const total = demoData.total + apiData.total;
      
      // Apply pagination to merged data
      const startIndex = (page - 1) * perPage;
      const paginatedNotifications = allNotifications.slice(startIndex, startIndex + perPage);
      
      return {
        notifications: paginatedNotifications,
        total: total,
        page: page,
        per_page: perPage,
        has_next: startIndex + perPage < total,
        has_prev: page > 1
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Return demo notifications if API fails
      return this.getDemoNotifications(page, perPage);
    }
  }

  private getDemoNotifications(page: number = 1, perPage: number = 20): NotificationListResponse {
    const demoSummary = this.getDemoNotificationSummary();
    const allNotifications = demoSummary.recent_notifications;
    
    // Apply pagination
    const startIndex = (page - 1) * perPage;
    const paginatedNotifications = allNotifications.slice(startIndex, startIndex + perPage);
    
    return {
      notifications: paginatedNotifications,
      total: allNotifications.length,
      page: page,
      per_page: perPage,
      has_next: startIndex + perPage < allNotifications.length,
      has_prev: page > 1
    };
  }

  async markAsRead(notificationId: number): Promise<void> {
    try {
      await httpClient.patch(`${this.baseUrl}/${notificationId}`, {
        is_read: true
      });
    } catch (error) {
      console.error('Failed to mark notification as read via API:', error);
    }
    
    // Also handle demo notifications
    this.markDemoNotificationAsRead(notificationId);
  }

  private markDemoNotificationAsRead(notificationId: number): void {
    const authService = (window as any).authService;
    const authState = authService?.getAuthState();
    const currentUser = authState?.user;
    
    if (!currentUser) return;
    
    const demoNotificationsKey = `demo_notifications_${currentUser.id}`;
    const demoUnreadKey = `demo_unread_count_${currentUser.id}`;
    
    const demoNotifications = JSON.parse(localStorage.getItem(demoNotificationsKey) || '[]');
    const updatedNotifications = demoNotifications.map((notification: any) => {
      if (notification.notification_id === notificationId && !notification.is_read) {
        // Decrease unread count
        const currentUnread = parseInt(localStorage.getItem(demoUnreadKey) || '0');
        localStorage.setItem(demoUnreadKey, Math.max(0, currentUnread - 1).toString());
        
        return { ...notification, is_read: true };
      }
      return notification;
    });
    
    localStorage.setItem(demoNotificationsKey, JSON.stringify(updatedNotifications));
  }

  async markAsUnread(notificationId: number): Promise<void> {
    try {
      await httpClient.patch(`${this.baseUrl}/${notificationId}`, {
        is_read: false
      });
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await httpClient.post(`${this.baseUrl}/mark-all-read`);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification via API:', error);
    }
    
    // Also handle demo notifications
    this.deleteDemoNotification(notificationId);
  }

  private deleteDemoNotification(notificationId: number): void {
    const authService = (window as any).authService;
    const authState = authService?.getAuthState();
    const currentUser = authState?.user;
    
    if (!currentUser) return;
    
    const demoNotificationsKey = `demo_notifications_${currentUser.id}`;
    const demoUnreadKey = `demo_unread_count_${currentUser.id}`;
    
    const demoNotifications = JSON.parse(localStorage.getItem(demoNotificationsKey) || '[]');
    const notificationToDelete = demoNotifications.find((n: any) => n.notification_id === notificationId);
    
    if (notificationToDelete && !notificationToDelete.is_read) {
      // Decrease unread count if notification was unread
      const currentUnread = parseInt(localStorage.getItem(demoUnreadKey) || '0');
      localStorage.setItem(demoUnreadKey, Math.max(0, currentUnread - 1).toString());
    }
    
    const updatedNotifications = demoNotifications.filter((n: any) => n.notification_id !== notificationId);
    localStorage.setItem(demoNotificationsKey, JSON.stringify(updatedNotifications));
  }

  async createNotification(notification: NotificationCreate): Promise<NotificationData> {
    const response = await httpClient.post(this.baseUrl, notification);
    return response.data;
  }

  // Utility methods for formatting
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      // Circle notifications
      'circle_request': '👥',
      'circle_accepted': '✅',
      'circle_declined': '❌',
      'circle_invite': '📧',
      
      // Review notifications
      'review_reply': '💬',
      'review_vote': '🗳️',
      'review_reaction': '❤️',
      'review_comment': '💭',
      'review_shared': '🔗',
      'review_same_entity': '🎯',
      
      // Gamification notifications
      'badge_earned': '🏆',
      'level_up': '🎉',
      'goal_completed': '✅',
      'milestone_reached': '🎯',
      'daily_task_complete': '📋',
      
      // Social notifications
      'friend_request': '👤',
      'friend_accepted': '🤝',
      'user_followed': '👥',
      'user_mentioned': '📢',
      
      // Messaging notifications
      'message': '💬',
      'message_reaction': '😊',
      
      // System notifications
      'system_announcement': '📢',
      'account_verification': '✅',
      'security_alert': '🔒',
      
      // Legacy
      'post_like': '❤️',
      'comment': '💬',
      'share': '🔗',
      'tag': '🏷️'
    };
    
    return iconMap[type] || '📄';
  }

  getNotificationColor(type: string): string {
    const colorMap: Record<string, string> = {
      // Circle notifications
      'circle_request': 'text-blue-600',
      'circle_accepted': 'text-green-600',
      'circle_declined': 'text-red-600',
      'circle_invite': 'text-purple-600',
      
      // Review notifications
      'review_reply': 'text-blue-600',
      'review_vote': 'text-indigo-600',
      'review_reaction': 'text-pink-600',
      'review_comment': 'text-gray-600',
      'review_shared': 'text-emerald-600',
      'review_same_entity': 'text-orange-600',
      
      // Gamification notifications
      'badge_earned': 'text-yellow-600',
      'level_up': 'text-purple-600',
      'goal_completed': 'text-green-600',
      'milestone_reached': 'text-orange-600',
      'daily_task_complete': 'text-blue-600',
      
      // Social notifications
      'friend_request': 'text-blue-600',
      'friend_accepted': 'text-green-600',
      'user_followed': 'text-indigo-600',
      'user_mentioned': 'text-red-600',
      
      // Messaging notifications
      'message': 'text-blue-600',
      'message_reaction': 'text-pink-600',
      
      // System notifications
      'system_announcement': 'text-gray-800',
      'account_verification': 'text-green-600',
      'security_alert': 'text-red-600',
      
      // Legacy
      'post_like': 'text-red-600',
      'comment': 'text-gray-600',
      'share': 'text-blue-600',
      'tag': 'text-purple-600'
    };
    
    return colorMap[type] || 'text-gray-600';
  }

  getNotificationBgColor(type: string): string {
    const bgColorMap: Record<string, string> = {
      // Circle notifications
      'circle_request': 'bg-blue-50 hover:bg-blue-100',
      'circle_accepted': 'bg-green-50 hover:bg-green-100',
      'circle_declined': 'bg-red-50 hover:bg-red-100',
      'circle_invite': 'bg-purple-50 hover:bg-purple-100',
      
      // Review notifications
      'review_reply': 'bg-blue-50 hover:bg-blue-100',
      'review_vote': 'bg-indigo-50 hover:bg-indigo-100',
      'review_reaction': 'bg-pink-50 hover:bg-pink-100',
      'review_comment': 'bg-gray-50 hover:bg-gray-100',
      'review_shared': 'bg-emerald-50 hover:bg-emerald-100',
      'review_same_entity': 'bg-orange-50 hover:bg-orange-100',
      
      // Gamification notifications
      'badge_earned': 'bg-yellow-50 hover:bg-yellow-100',
      'level_up': 'bg-purple-50 hover:bg-purple-100',
      'goal_completed': 'bg-green-50 hover:bg-green-100',
      'milestone_reached': 'bg-orange-50 hover:bg-orange-100',
      'daily_task_complete': 'bg-blue-50 hover:bg-blue-100',
      
      // Social notifications
      'friend_request': 'bg-blue-50 hover:bg-blue-100',
      'friend_accepted': 'bg-green-50 hover:bg-green-100',
      'user_followed': 'bg-indigo-50 hover:bg-indigo-100',
      'user_mentioned': 'bg-red-50 hover:bg-red-100',
      
      // Messaging notifications
      'message': 'bg-blue-50 hover:bg-blue-100',
      'message_reaction': 'bg-pink-50 hover:bg-pink-100',
      
      // System notifications
      'system_announcement': 'bg-gray-50 hover:bg-gray-100',
      'account_verification': 'bg-green-50 hover:bg-green-100',
      'security_alert': 'bg-red-50 hover:bg-red-100',
      
      // Legacy
      'post_like': 'bg-red-50 hover:bg-red-100',
      'comment': 'bg-gray-50 hover:bg-gray-100',
      'share': 'bg-blue-50 hover:bg-blue-100',
      'tag': 'bg-purple-50 hover:bg-purple-100'
    };
    
    return bgColorMap[type] || 'bg-gray-50 hover:bg-gray-100';
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

export const notificationService = new NotificationService();