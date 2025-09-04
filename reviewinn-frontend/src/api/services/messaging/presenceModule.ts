/**
 * Professional Messaging Service - Presence Module
 * Handles all user presence and activity tracking operations
 */

import { httpClient } from '../../httpClient';
import { API_CONFIG } from '../../config';
import { MessagingResponseHandler } from './responseHandler';
import {
  UserPresence,
  TypingIndicator,
  PresenceUpdateRequest,
  PresenceResponse,
  ProfessionalMessagingResponse,
  ProfessionalUser
} from './types';

export class PresenceModule {
  private baseURL: string;
  private apiPrefix: string;
  private presenceUpdateInterval?: NodeJS.Timeout;
  private typingTimeouts = new Map<number, NodeJS.Timeout>();
  private currentPresence: UserPresence | null = null;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.apiPrefix = '/messenger';
    this.setupPresenceTracking();
  }

  /**
   * Initialize presence tracking
   */
  private setupPresenceTracking() {
    // Track page visibility for presence updates
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updatePresence({ status: 'away' });
      } else {
        this.updatePresence({ status: 'online' });
      }
    });

    // Track user activity for auto-away
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let lastActivity = Date.now();

    const resetActivity = () => {
      lastActivity = Date.now();
      if (this.currentPresence?.status === 'away') {
        this.updatePresence({ status: 'online' });
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, resetActivity, true);
    });

    // Auto-away after 5 minutes of inactivity
    setInterval(() => {
      if (Date.now() - lastActivity > 5 * 60 * 1000 && this.currentPresence?.status === 'online') {
        this.updatePresence({ status: 'away' });
      }
    }, 60000); // Check every minute

    // Send heartbeat every 30 seconds when online
    this.presenceUpdateInterval = setInterval(() => {
      if (this.currentPresence && this.currentPresence.status !== 'offline') {
        this.sendPresenceHeartbeat();
      }
    }, 30000);
  }

  /**
   * Get current user presence
   */
  async getCurrentPresence(): Promise<ProfessionalMessagingResponse<UserPresence>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/presence/me`
      );

      const result = MessagingResponseHandler.handleResponse<UserPresence>(
        response,
        { operation: 'Get current presence', requireData: true }
      );

      if (result.success && result.data) {
        this.currentPresence = result.data;
      }

      return result;
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get current presence');
    }
  }

  /**
   * Update user presence status
   */
  async updatePresence(data: PresenceUpdateRequest): Promise<ProfessionalMessagingResponse<UserPresence>> {
    try {
      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/presence`,
        data
      );

      const result = MessagingResponseHandler.handleResponse<UserPresence>(
        response,
        { operation: 'Update presence' }
      );

      if (result.success && result.data) {
        this.currentPresence = result.data;
      }

      return result;
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Update presence');
    }
  }

  /**
   * Get presence status for multiple users
   */
  async getUsersPresence(userIds: number[]): Promise<ProfessionalMessagingResponse<PresenceResponse>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/presence/users`,
        { user_ids: userIds }
      );

      return MessagingResponseHandler.handleResponse<PresenceResponse>(
        response,
        {
          operation: 'Get users presence',
          fallbackData: {
            users: [],
            total_online: 0,
            last_updated: new Date().toISOString()
          }
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get users presence');
    }
  }

  /**
   * Get presence for all users in a conversation
   */
  async getConversationPresence(conversationId: number): Promise<ProfessionalMessagingResponse<PresenceResponse>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/presence`
      );

      return MessagingResponseHandler.handleResponse<PresenceResponse>(
        response,
        {
          operation: 'Get conversation presence',
          fallbackData: {
            users: [],
            total_online: 0,
            last_updated: new Date().toISOString()
          }
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get conversation presence');
    }
  }

  /**
   * Start typing indicator
   */
  async startTyping(conversationId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      // Clear existing timeout for this conversation
      const existingTimeout = this.typingTimeouts.get(conversationId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/typing`,
        { is_typing: true }
      );

      // Auto-stop typing after 10 seconds
      const timeout = setTimeout(() => {
        this.stopTyping(conversationId);
      }, 10000);
      
      this.typingTimeouts.set(conversationId, timeout);

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Start typing' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Start typing');
    }
  }

  /**
   * Stop typing indicator
   */
  async stopTyping(conversationId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      // Clear timeout
      const existingTimeout = this.typingTimeouts.get(conversationId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.typingTimeouts.delete(conversationId);
      }

      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/typing`,
        { is_typing: false }
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Stop typing' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Stop typing');
    }
  }

  /**
   * Get typing indicators for a conversation
   */
  async getTypingIndicators(conversationId: number): Promise<ProfessionalMessagingResponse<TypingIndicator[]>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/typing`
      );

      return MessagingResponseHandler.handleResponse<TypingIndicator[]>(
        response,
        {
          operation: 'Get typing indicators',
          fallbackData: []
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get typing indicators');
    }
  }

  /**
   * Set custom status message
   */
  async setCustomStatus(customStatus: string): Promise<ProfessionalMessagingResponse<UserPresence>> {
    try {
      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/presence/status`,
        { custom_status: customStatus }
      );

      const result = MessagingResponseHandler.handleResponse<UserPresence>(
        response,
        { operation: 'Set custom status' }
      );

      if (result.success && result.data) {
        this.currentPresence = result.data;
      }

      return result;
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Set custom status');
    }
  }

  /**
   * Clear custom status
   */
  async clearCustomStatus(): Promise<ProfessionalMessagingResponse<UserPresence>> {
    try {
      const response = await httpClient.delete(
        `${this.baseURL}${this.apiPrefix}/presence/status`
      );

      const result = MessagingResponseHandler.handleResponse<UserPresence>(
        response,
        { operation: 'Clear custom status' }
      );

      if (result.success && result.data) {
        this.currentPresence = result.data;
      }

      return result;
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Clear custom status');
    }
  }

  /**
   * Get online users count
   */
  async getOnlineUsersCount(): Promise<ProfessionalMessagingResponse<{ count: number; timestamp: string }>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/presence/online-count`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        {
          operation: 'Get online users count',
          fallbackData: { count: 0, timestamp: new Date().toISOString() }
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get online users count');
    }
  }

  /**
   * Get recently active users
   */
  async getRecentlyActiveUsers(limit: number = 50): Promise<ProfessionalMessagingResponse<ProfessionalUser[]>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/presence/recent?limit=${limit}`
      );

      return MessagingResponseHandler.handleResponse<ProfessionalUser[]>(
        response,
        {
          operation: 'Get recently active users',
          fallbackData: []
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get recently active users');
    }
  }

  /**
   * Set user as currently active in a conversation
   */
  async setActiveConversation(conversationId: number | null): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/presence/active-conversation`,
        { conversation_id: conversationId }
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Set active conversation' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Set active conversation');
    }
  }

  /**
   * Send presence heartbeat to maintain online status
   */
  private async sendPresenceHeartbeat(): Promise<void> {
    try {
      await httpClient.post(`${this.baseURL}${this.apiPrefix}/presence/heartbeat`);
    } catch {
      // Silently handle heartbeat failures to avoid console spam
    }
  }

  /**
   * Set presence to offline and cleanup
   */
  async goOffline(): Promise<ProfessionalMessagingResponse<UserPresence>> {
    try {
      // Clear all timeouts
      this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
      this.typingTimeouts.clear();
      
      if (this.presenceUpdateInterval) {
        clearInterval(this.presenceUpdateInterval);
      }

      const response = await this.updatePresence({ status: 'offline' });
      this.currentPresence = null;
      
      return response;
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Go offline');
    }
  }

  /**
   * Get current presence status (synchronous)
   */
  getCurrentPresenceSync(): UserPresence | null {
    return this.currentPresence;
  }

  /**
   * Check if user is currently typing in a conversation
   */
  isTypingInConversation(conversationId: number): boolean {
    return this.typingTimeouts.has(conversationId);
  }

  /**
   * Cleanup when service is destroyed
   */
  destroy(): void {
    this.goOffline();
  }
}