/**
 * Professional Messaging Service - Conversations Module
 * Handles all conversation-related operations
 */

import { httpClient } from '../../httpClient';
import { API_CONFIG } from '../../config';
import { MessagingResponseHandler } from './responseHandler';
import {
  ProfessionalConversation,
  ConversationCreateRequest,
  ConversationsResponse,
  ProfessionalMessagingResponse,
  ProfessionalParticipant
} from './types';

export class ConversationsModule {
  private baseURL: string;
  private apiPrefix: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.apiPrefix = '/messenger';
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: ConversationCreateRequest): Promise<ProfessionalMessagingResponse<ProfessionalConversation>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations`,
        data
      );

      return MessagingResponseHandler.handleResponse<ProfessionalConversation>(
        response,
        { operation: 'Create conversation', requireData: true }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Create conversation');
    }
  }

  /**
   * Get or create direct conversation with a user
   */
  async getOrCreateDirectConversation(participantId: number): Promise<ProfessionalConversation> {
    try {
      // First, check for existing conversations
      const conversationsResponse = await this.getConversations();
      
      let conversations: ProfessionalConversation[] = [];
      if (conversationsResponse.success && conversationsResponse.data) {
        conversations = conversationsResponse.data.conversations || [];
      }
      
      // Look for existing direct conversation with this participant
      const existingConversation = conversations.find((conv: ProfessionalConversation) => 
        conv.conversation_type === 'direct' && 
        conv.participants.some((p: ProfessionalParticipant) => p.user_id.toString() === participantId.toString())
      );
      
      if (existingConversation) {
        return existingConversation;
      }
      
      // Create new conversation
      const response = await this.createConversation({
        participant_ids: [parseInt(participantId.toString())],
        conversation_type: 'direct'
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to create conversation');
      }

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create or get direct conversation: ${errorMessage}`);
    }
  }

  /**
   * Get conversations list with pagination
   */
  async getConversations(params?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<ProfessionalMessagingResponse<ConversationsResponse>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.type) queryParams.append('type', params.type);

      const queryString = queryParams.toString();
      const url = `${this.baseURL}${this.apiPrefix}/conversations${queryString ? `?${queryString}` : ''}`;
      
      const response = await httpClient.get(url);

      // Handle response with fallback for empty conversations
      const result = MessagingResponseHandler.handleResponse<ConversationsResponse>(
        response,
        {
          operation: 'Get conversations',
          fallbackData: {
            conversations: [],
            total: 0,
            limit: params?.limit || 20,
            offset: params?.offset || 0,
            has_more: false
          }
        }
      );

      return result;
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get conversations');
    }
  }

  /**
   * Get conversation details by ID
   */
  async getConversationDetails(conversationId: number): Promise<ProfessionalMessagingResponse<ProfessionalConversation>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}`
      );

      return MessagingResponseHandler.handleResponse<ProfessionalConversation>(
        response,
        { operation: 'Get conversation details', requireData: true }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Get conversation details');
    }
  }

  /**
   * Update conversation settings
   */
  async updateConversationSettings(
    conversationId: number,
    settings: Partial<{
      title: string;
      description: string;
      is_private: boolean;
      join_policy: string;
    }>
  ): Promise<ProfessionalMessagingResponse<ProfessionalConversation>> {
    try {
      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}`,
        settings
      );

      return MessagingResponseHandler.handleResponse<ProfessionalConversation>(
        response,
        { operation: 'Update conversation settings' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Update conversation settings');
    }
  }

  /**
   * Join a conversation
   */
  async joinConversation(conversationId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/join`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Join conversation' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Join conversation');
    }
  }

  /**
   * Leave a conversation
   */
  async leaveConversation(conversationId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/leave`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Leave conversation' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Leave conversation');
    }
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/archive`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Archive conversation' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Archive conversation');
    }
  }

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: number): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/unarchive`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Unarchive conversation' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Unarchive conversation');
    }
  }

  /**
   * Mute/unmute conversation notifications
   */
  async muteConversation(conversationId: number, muted: boolean): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.put(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/mute`,
        { muted }
      );

      const operation = muted ? 'Mute conversation' : 'Unmute conversation';
      return MessagingResponseHandler.handleResponse(
        response,
        { operation }
      );
    } catch (error) {
      const operation = muted ? 'Mute conversation' : 'Unmute conversation';
      return MessagingResponseHandler.handleError(error, operation);
    }
  }

  /**
   * Add participants to a conversation
   */
  async addParticipants(
    conversationId: number,
    userIds: number[]
  ): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string; added_count: number }>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/participants`,
        { user_ids: userIds }
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Add participants' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Add participants');
    }
  }

  /**
   * Remove participant from conversation
   */
  async removeParticipant(
    conversationId: number,
    userId: number
  ): Promise<ProfessionalMessagingResponse<{ success: boolean; message: string }>> {
    try {
      const response = await httpClient.delete(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/participants/${userId}`
      );

      return MessagingResponseHandler.handleResponse(
        response,
        { operation: 'Remove participant' }
      );
    } catch (error) {
      return MessagingResponseHandler.handleError(error, 'Remove participant');
    }
  }
}