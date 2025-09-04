/**
 * Professional Messaging Service - Messages Module
 * Handles all message-related operations
 */

import { httpClient } from '../../httpClient';
import { API_CONFIG } from '../../config';
import { MessagingResponseHandler } from './responseHandler';
import {
  ProfessionalMessage,
  MessageSendRequest,
  MessageEditRequest,
  MessagesResponse,
  ProfessionalMessagingResponse,
  ProfessionalAttachment,
  ProfessionalReaction,
  ReactionRequest,
  PinnedMessage,
  SearchResults
} from './types';

export class MessagesModule {
  private baseURL: string;
  private apiPrefix: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.apiPrefix = '/messenger';
  }

  /**
   * Get messages from a conversation with pagination
   */
  async getMessages(conversationId: number, params?: {
    limit?: number;
    before?: string;
    after?: string;
    type?: string;
  }): Promise<ProfessionalMessagingResponse<MessagesResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.before) queryParams.append('before', params.before);
      if (params?.after) queryParams.append('after', params.after);
      if (params?.type) queryParams.append('type', params.type);

      const queryString = queryParams.toString();
      const url = `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;
      
      const response = await httpClient.get(url);

      return MessagingResponseHandler.handleResponse<MessagesResponse>(
        response,
        {
          operation: 'Get messages',
          fallbackData: {
            messages: [],
            count: 0,
            has_more: false
          }
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get messages');
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(data: MessageSendRequest): Promise<ProfessionalMessagingResponse<ProfessionalMessage>> {
    try {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('message_type', data.message_type || 'text');
      
      if (data.parent_message_id) {
        formData.append('parent_message_id', data.parent_message_id.toString());
      }
      
      if (data.mentions && data.mentions.length > 0) {
        formData.append('mentions', JSON.stringify(data.mentions));
      }
      
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${data.conversation_id}/messages`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      return MessagingResponseHandler.handleResponse<ProfessionalMessage>(
        response,
        { operation: 'Send message', requireData: true }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Send message');
    }
  }

  /**
   * Edit an existing message
   */
  async editMessage(data: MessageEditRequest): Promise<ProfessionalMessagingResponse<ProfessionalMessage>> {
    try {
      const formData = new FormData();
      formData.append('content', data.content);
      
      if (data.mentions && data.mentions.length > 0) {
        formData.append('mentions', JSON.stringify(data.mentions));
      }
      
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/messages/${data.message_id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      return MessagingResponseHandler.handleResponse<ProfessionalMessage>(
        response,
        { operation: 'Edit message' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Edit message');
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.delete(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Delete message' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Delete message');
    }
  }

  /**
   * Get message details by ID
   */
  async getMessageDetails(messageId: number): Promise<ProfessionalMessagingResponse<ProfessionalMessage>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}`
      );

      return MessagingResponseHandler.handleResponse<ProfessionalMessage>(
        response,
        { operation: 'Get message details', requireData: true }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get message details');
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(data: ReactionRequest): Promise<ProfessionalMessagingResponse<ProfessionalReaction>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/messages/${data.message_id}/reactions`,
        { emoji: data.emoji }
      );

      return MessagingResponseHandler.handleResponse<ProfessionalReaction>(
        response,
        { operation: 'Add reaction' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Add reaction');
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: number, reactionId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.delete(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/reactions/${reactionId}`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Remove reaction' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Remove reaction');
    }
  }

  /**
   * Pin a message
   */
  async pinMessage(messageId: number, reason?: string): Promise<ProfessionalMessagingResponse<PinnedMessage>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/pin`,
        { reason }
      );

      return MessagingResponseHandler.handleResponse<PinnedMessage>(
        response,
        { operation: 'Pin message' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Pin message');
    }
  }

  /**
   * Unpin a message
   */
  async unpinMessage(messageId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.delete(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/pin`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Unpin message' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Unpin message');
    }
  }

  /**
   * Get pinned messages from a conversation
   */
  async getPinnedMessages(conversationId: number): Promise<ProfessionalMessagingResponse<PinnedMessage[]>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/pinned-messages`
      );

      return MessagingResponseHandler.handleResponse<PinnedMessage[]>(
        response,
        {
          operation: 'Get pinned messages',
          fallbackData: []
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get pinned messages');
    }
  }

  /**
   * Get thread messages (replies to a message)
   */
  async getThreadMessages(messageId: number, params?: {
    limit?: number;
    offset?: number;
  }): Promise<ProfessionalMessagingResponse<MessagesResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());

      const queryString = queryParams.toString();
      const url = `${this.baseURL}${this.apiPrefix}/messages/${messageId}/thread${queryString ? `?${queryString}` : ''}`;
      
      const response = await httpClient.get(url);

      return MessagingResponseHandler.handleResponse<MessagesResponse>(
        response,
        {
          operation: 'Get thread messages',
          fallbackData: {
            messages: [],
            count: 0,
            has_more: false
          }
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get thread messages');
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/read`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Mark message as read' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Mark message as read');
    }
  }

  /**
   * Mark all messages in conversation as read
   */
  async markAllMessagesAsRead(conversationId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/mark-read`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Mark all messages as read' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Mark all messages as read');
    }
  }

  /**
   * Search messages across conversations
   */
  async searchMessages(query: string, params?: {
    conversation_id?: number;
    limit?: number;
    offset?: number;
    type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ProfessionalMessagingResponse<SearchResults>> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      
      if (params?.conversation_id) queryParams.append('conversation_id', params.conversation_id.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.type) queryParams.append('type', params.type);
      if (params?.date_from) queryParams.append('date_from', params.date_from);
      if (params?.date_to) queryParams.append('date_to', params.date_to);

      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/messages/search?${queryParams.toString()}`
      );

      return MessagingResponseHandler.handleResponse<SearchResults>(
        response,
        {
          operation: 'Search messages',
          fallbackData: {
            messages: [],
            conversations: [],
            users: [],
            total_results: 0,
            has_more: false
          }
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Search messages');
    }
  }

  /**
   * Get message attachments
   */
  async getMessageAttachments(messageId: number): Promise<ProfessionalMessagingResponse<ProfessionalAttachment[]>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/attachments`
      );

      return MessagingResponseHandler.handleResponse<ProfessionalAttachment[]>(
        response,
        {
          operation: 'Get message attachments',
          fallbackData: []
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get message attachments');
    }
  }

  /**
   * Download attachment
   */
  async downloadAttachment(attachmentId: number): Promise<ProfessionalMessagingResponse<Blob>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/attachments/${attachmentId}/download`,
        { responseType: 'blob' }
      );

      return MessagingResponseHandler.handleResponse<Blob>(
        response,
        { operation: 'Download attachment', requireData: true }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Download attachment');
    }
  }

  /**
   * Get message history (edits)
   */
  async getMessageHistory(messageId: number): Promise<ProfessionalMessagingResponse<ProfessionalMessage[]>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/history`
      );

      return MessagingResponseHandler.handleResponse<ProfessionalMessage[]>(
        response,
        {
          operation: 'Get message history',
          fallbackData: []
        }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get message history');
    }
  }
}