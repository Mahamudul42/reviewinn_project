/**
 * Service for the new messaging system using msg_ tables.
 */
import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';

// Updated interfaces for the new msg_ system
export interface MsgUser {
  user_id: number;
  username: string;
  name: string;
  avatar?: string;
}

export interface MsgAttachment {
  attachment_id: number;
  file_url: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

export interface MsgReaction {
  reaction_id: number;
  reaction_type: string;
  user: MsgUser;
}

export interface MsgMessage {
  message_id: number;
  conversation_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'attachment';
  is_edited: boolean;
  reply_to_message_id?: number;
  created_at: string;
  updated_at: string;
  sender: MsgUser;
  attachments: MsgAttachment[];
  reactions: MsgReaction[];
}

export interface MsgConversation {
  conversation_id: number;
  conversation_type: 'direct' | 'group';
  title?: string;
  is_private: boolean;
  unread_count: number;
  updated_at: string;
  participants: Array<{
    user_id: number;
    username: string;
    name: string;
    avatar?: string;
    role: string;
  }>;
  latest_message?: {
    message_id: number;
    content: string;
    message_type: string;
    created_at: string;
    sender: {
      user_id: number;
      username: string;
      name: string;
    };
  };
}

export interface MsgConversationCreate {
  participant_ids: number[];
  conversation_type?: 'direct' | 'group';
  title?: string;
}

export interface MsgMessageCreate {
  conversation_id: number;
  content: string;
  message_type?: 'text' | 'image' | 'file' | 'system';
  reply_to_message_id?: number;
}

export interface MsgReactionCreate {
  reaction_type: string;
}

export interface MsgServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

export class MsgService {
  private baseURL = API_CONFIG.BASE_URL;
  private apiPrefix = '/messaging';

  /**
   * Create a new conversation
   */
  async createConversation(data: MsgConversationCreate): Promise<MsgServiceResponse<MsgConversation>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations`,
        data,
        true // requireAuth
      );
      return response.data as MsgServiceResponse<MsgConversation>;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getConversations(limit = 20, offset = 0): Promise<MsgServiceResponse<{
    conversations: MsgConversation[];
    total: number;
    limit: number;
    offset: number;
  }>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/conversations?limit=${limit}&offset=${offset}`,
        true // requireAuth
      );
      return response.data as MsgServiceResponse<{
        conversations: MsgConversation[];
        total: number;
        limit: number;
        offset: number;
      }>;
    } catch (error) {
      console.error('Failed to get conversations:', error);
      throw error;
    }
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(data: MsgMessageCreate): Promise<MsgServiceResponse<MsgMessage>> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/messages`,
        data,
        true // requireAuth
      );
      return response.data as MsgServiceResponse<MsgMessage>;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Get messages from a conversation
   */
  async getMessages(
    conversationId: number,
    limit = 50,
    offset = 0
  ): Promise<MsgServiceResponse<MsgMessage[]>> {
    try {
      const response = await httpClient.get(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`,
        true // requireAuth
      );
      return response.data as MsgServiceResponse<MsgMessage[]>;
    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationRead(conversationId: number): Promise<MsgServiceResponse> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/conversations/${conversationId}/read`,
        {},
        true // requireAuth
      );
      return response.data as MsgServiceResponse;
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      throw error;
    }
  }

  /**
   * Add reaction to a message
   */
  async addReaction(messageId: number, reactionType: string): Promise<MsgServiceResponse> {
    try {
      const response = await httpClient.post(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/reactions`,
        { reaction_type: reactionType },
        true // requireAuth
      );
      return response.data as MsgServiceResponse;
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  /**
   * Remove reaction from a message
   */
  async removeReaction(messageId: number): Promise<MsgServiceResponse> {
    try {
      const response = await httpClient.delete(
        `${this.baseURL}${this.apiPrefix}/messages/${messageId}/reactions`,
        true // requireAuth
      );
      return response.data as MsgServiceResponse;
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      throw error;
    }
  }

  /**
   * Create a direct conversation with another user
   */
  async createDirectConversation(otherUserId: number): Promise<MsgServiceResponse<MsgConversation>> {
    return this.createConversation({
      participant_ids: [otherUserId],
      conversation_type: 'direct'
    });
  }

  /**
   * Create a group conversation
   */
  async createGroupConversation(
    participantIds: number[],
    title: string
  ): Promise<MsgServiceResponse<MsgConversation>> {
    return this.createConversation({
      participant_ids: participantIds,
      conversation_type: 'group',
      title
    });
  }

  /**
   * Health check for the messaging service
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await httpClient.get(`${this.baseURL}${this.apiPrefix}/health`);
      return response.data;
    } catch (error) {
      console.error('Messaging service health check failed:', error);
      throw error;
    }
  }
}

export const msgService = new MsgService();

// Re-export types for convenience
export type {
  MsgUser,
  MsgAttachment,
  MsgReaction,
  MsgMessage,
  MsgConversation,
  MsgConversationCreate,
  MsgMessageCreate,
  MsgReactionCreate,
  MsgServiceResponse
};