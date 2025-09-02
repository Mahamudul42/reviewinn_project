/**
 * Enterprise Notification Service for ReviewInn Frontend
 * Handles 10M+ users with optimized API calls and caching
 */

import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';
import { createAuthenticatedRequestInit } from '../../shared/utils/auth';

// Enterprise notification interfaces
export interface EnterpriseNotificationData {
  notification_id: number;
  user_id?: number;
  actor_id?: number;
  type: string;
  title?: string;
  content?: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  priority: string;
  delivery_status: string;
  notification_data?: Record<string, any>;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Actor information
  actor_name?: string;
  actor_avatar?: string;
  actor_username?: string;
  // Enterprise metrics
  time_ago?: string;
  is_urgent?: boolean;
  is_expired?: boolean;
  // Backward compatibility
  notification_type?: string;
  data?: Record<string, any>;
}

export interface NotificationDropdownResponse {
  notifications: EnterpriseNotificationData[];
  unread_count: number;
  urgent_count: number;
  has_more: boolean;
  last_checked?: string;
}

export interface NotificationListResponse {
  notifications: EnterpriseNotificationData[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface NotificationSummary {
  total_unread: number;
  total_urgent: number;
  total_critical: number;
  recent_notifications: EnterpriseNotificationData[];
  has_more: boolean;
}

export interface NotificationStats {
  total_notifications: number;
  unread_count: number;
  read_count: number;
  urgent_count: number;
  critical_count: number;
  expired_count: number;
  delivery_stats: Record<string, number>;
  type_breakdown: Record<string, number>;
}

export interface NotificationCreate {
  user_id?: number;
  actor_id?: number;
  type: string;
  title?: string;
  content?: string;
  entity_type?: string;
  entity_id?: number;
  priority?: string;
  notification_data?: Record<string, any>;
  expires_at?: string;
  delivery_status?: string;
}

export interface NotificationBulkUpdate {
  notification_ids: number[];
  is_read?: boolean;
  delivery_status?: string;
}

class EnterpriseNotificationService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/enterprise-notifications`;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 30000; // 30 seconds cache for real-time feel

  /**
   * Get optimized notification data for dropdown modal
   */
  async getNotificationDropdown(): Promise<NotificationDropdownResponse> {
    const cacheKey = 'notification_dropdown';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await httpClient.get(`${this.baseUrl}/dropdown`);
      
      // Standardized response handling
      const data = response?.data || response;
      
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error: any) {
      // Silently return empty data when service is not available
      return {
        notifications: [],
        unread_count: 0,
        urgent_count: 0,
        has_more: false
      };
    }
  }

  /**
   * Get notification summary for header
   */
  async getNotificationSummary(): Promise<NotificationSummary> {
    const cacheKey = 'notification_summary';
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const fetchResponse = await fetch(`${this.baseUrl}/summary`, {
        ...createAuthenticatedRequestInit({
          method: 'GET',
          credentials: 'include',
        })
      });

      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch notification summary: ${fetchResponse.statusText}`);
      }

      const response = await fetchResponse.json();
      
      // Standardized response handling
      const data = response?.data || response;
      this.setCachedData(cacheKey, data);
      return data;
    } catch (error: any) {
      // Silently return empty data when service is not available
      return {
        total_unread: 0,
        total_urgent: 0,
        total_critical: 0,
        recent_notifications: [],
        has_more: false
      };
    }
  }

  /**
   * Get paginated notifications with enterprise filtering
   */
  async getNotifications(
    page: number = 1,
    limit: number = 20,
    unread_only: boolean = false,
    priority_filter?: string
  ): Promise<NotificationListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (unread_only) {
        params.append('unread_only', 'true');
      }
      
      if (priority_filter) {
        params.append('priority_filter', priority_filter);
      }

      const url = `${this.baseUrl}/?${params.toString()}`;
      
      const response = await httpClient.get(url);
      
      // Standardized response handling
      return response?.data || response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const response = await httpClient.patch(`${this.baseUrl}/${notificationId}`, {
        is_read: true
      });
      
      // Clear cache to force refresh
      this.clearCache();
      
      return response.success || response.data?.success;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ success: boolean; count: number }> {
    try {
      const response = await httpClient.patch(`${this.baseUrl}/mark-all-read`);
      
      // Clear cache to force refresh
      this.clearCache();
      
      return {
        success: response.success || response.data?.success,
        count: response.data?.count || 0
      };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Enterprise bulk update for multiple notifications
   */
  async bulkUpdateNotifications(bulkData: NotificationBulkUpdate): Promise<{ success: boolean; count: number }> {
    try {
      const response = await httpClient.patch(`${this.baseUrl}/bulk-update`, bulkData);
      
      // Clear cache to force refresh
      this.clearCache();
      
      return {
        success: response.success || response.data?.success,
        count: response.data?.count || 0
      };
    } catch (error) {
      console.error('Failed to bulk update notifications:', error);
      return { success: false, count: 0 };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: number): Promise<boolean> {
    try {
      const response = await httpClient.delete(`${this.baseUrl}/${notificationId}`);
      
      // Clear cache to force refresh
      this.clearCache();
      
      return response.success || response.data?.success;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  /**
   * Get comprehensive notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await httpClient.get(`${this.baseUrl}/stats`);
      return response.success ? response : response.data;
    } catch (error) {
      console.error('Failed to fetch notification stats:', error);
      throw error;
    }
  }

  /**
   * Create a new notification (admin use)
   */
  async createNotification(notification: NotificationCreate): Promise<EnterpriseNotificationData> {
    try {
      const response = await httpClient.post(this.baseUrl, notification);
      
      // Clear cache to force refresh
      this.clearCache();
      
      return response.success ? response : response.data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Utility methods for UI
  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      // Enhanced enterprise notification types
      'review_reply': '💬',
      'review_reaction': '❤️',
      'review_comment': '💭',
      'review_shared': '📤',
      'review_same_entity': '🎯',
      'review_vote': '👍',
      
      'circle_request': '👥',
      'circle_accepted': '✅',
      'circle_declined': '❌',
      'circle_invite': '📧',
      
      'badge_earned': '🏆',
      'level_up': '⬆️',
      'goal_completed': '🎯',
      'milestone_reached': '🌟',
      'daily_task_complete': '✅',
      
      'friend_request': '👤',
      'friend_accepted': '🤝',
      'user_followed': '👁️',
      'user_mentioned': '📢',
      
      'message': '💬',
      'message_reaction': '😊',
      
      'system_announcement': '📢',
      'account_verification': '✅',
      'security_alert': '🔒',
      
      // Entity notifications
      'entity_claimed': '🏢',
      'entity_verified': '✅',
      'entity_updated': '📝',
      
      // Comment notifications  
      'comment_reply': '💬',
      'comment_reaction': '❤️',
      
      // Default
      'default': '📄'
    };
    
    return iconMap[type] || iconMap['default'];
  }

  getPriorityColor(priority: string): string {
    const colorMap: Record<string, string> = {
      'critical': 'text-red-600 bg-red-50',
      'urgent': 'text-orange-600 bg-orange-50',
      'high': 'text-yellow-600 bg-yellow-50',
      'normal': 'text-blue-600 bg-blue-50',
      'low': 'text-gray-600 bg-gray-50'
    };
    
    return colorMap[priority] || colorMap['normal'];
  }

  getPriorityBadgeColor(priority: string): string {
    const colorMap: Record<string, string> = {
      'critical': 'bg-red-100 text-red-800 border-red-200',
      'urgent': 'bg-orange-100 text-orange-800 border-orange-200',
      'high': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'normal': 'bg-blue-100 text-blue-800 border-blue-200',
      'low': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return colorMap[priority] || colorMap['normal'];
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks}w`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  // Cache management for performance
  private getCachedData(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * Real-time notification updates (for future WebSocket integration)
   */
  onNotificationUpdate(callback: (notification: EnterpriseNotificationData) => void): void {
    // Future: WebSocket integration for real-time updates
    // For now, this is a placeholder for the interface
    console.log('Real-time notifications will be implemented with WebSocket');
  }
}

export const enterpriseNotificationService = new EnterpriseNotificationService();