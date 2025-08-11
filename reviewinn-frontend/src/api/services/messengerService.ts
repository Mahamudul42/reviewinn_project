import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';

export interface User {
  user_id: number;
  username: string;
  name: string;
  avatar?: string;
}

export interface Message {
  message_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  sender_id: number;
  sender_name: string;
  sender_username: string;
  sender_avatar?: string;
  created_at: string;
  updated_at: string;
  reactions: Record<string, string>;
  is_own_message: boolean;
  status: 'sent' | 'delivered' | 'read';
  reply_to?: {
    message_id: number;
    content: string;
    sender_name: string;
    message_type: string;
  };
}

export interface Conversation {
  conversation_id: number;
  is_group: boolean;
  group_name?: string;
  group_description?: string;
  group_image?: string;
  created_at: string;
  last_message_at?: string;
  unread_count: number;
  participants: Array<{
    user_id: number;
    username: string;
    name: string;
    avatar?: string;
    role: string;
    nickname?: string;
  }>;
  last_message?: {
    message_id: number;
    content: string;
    message_type: string;
    sender_id: number;
    sender_name: string;
    created_at: string;
  };
  other_user?: {
    user_id: number;
    username: string;
    name: string;
    avatar?: string;
  };
}

export interface ConversationCreate {
  participant_ids: number[];
  is_group?: boolean;
  group_name?: string;
  group_description?: string;
}

export interface DirectMessageCreate {
  other_user_id: number;
  content: string;
  message_type?: string;
}

export interface MessageCreate {
  content: string;
  message_type?: string;
  reply_to_message_id?: number;
}

export interface ReactionCreate {
  emoji: string;
}

export interface MessageSearchQuery {
  query: string;
  limit?: number;
}

export class MessengerService {
  private baseURL = API_CONFIG.BASE_URL;

  async createConversation(data: ConversationCreate): Promise<any> {
    const response = await httpClient.post(`${this.baseURL}${API_ENDPOINTS.MESSENGER.CONVERSATIONS}`, data);
    return response.data;
  }

  async createDirectConversation(data: DirectMessageCreate): Promise<any> {
    const response = await httpClient.post(`${this.baseURL}${API_ENDPOINTS.MESSENGER.DIRECT_CONVERSATION}`, data);
    return response.data;
  }

  async getConversations(): Promise<{ conversations: Conversation[] }> {
    const response = await httpClient.get(`${this.baseURL}${API_ENDPOINTS.MESSENGER.CONVERSATIONS}`);
    return response.data as { conversations: Conversation[] };
  }

  async getConversationMessages(
    conversationId: number,
    offset: number = 0,
    limit: number = 50
  ): Promise<{ messages: Message[], total: number, offset: number, limit: number, has_more: boolean }> {
    const response = await httpClient.get(
      `${this.baseURL}${API_ENDPOINTS.MESSENGER.MESSAGES(conversationId.toString())}`,
      {
        params: { offset, limit }
      }
    );
    return response.data as { messages: Message[], total: number, offset: number, limit: number, has_more: boolean };
  }

  async sendMessage(conversationId: number, data: MessageCreate): Promise<any> {
    const response = await httpClient.post(
      `${this.baseURL}${API_ENDPOINTS.MESSENGER.SEND_MESSAGE(conversationId.toString())}`,
      data
    );
    return response.data;
  }

  async sendFileMessage(
    conversationId: number,
    file: File,
    content: string = ''
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content', content);

    const response = await httpClient.post(
      `${this.baseURL}${API_ENDPOINTS.MESSENGER.UPLOAD_FILE(conversationId.toString())}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async markMessagesAsRead(conversationId: number, messageId?: number): Promise<any> {
    const response = await httpClient.put(
      `${this.baseURL}${API_ENDPOINTS.MESSENGER.MARK_READ(conversationId.toString())}`,
      { message_id: messageId }
    );
    return response.data;
  }

  async addReaction(messageId: number, data: ReactionCreate): Promise<any> {
    const response = await httpClient.post(
      `${this.baseURL}${API_ENDPOINTS.MESSENGER.ADD_REACTION(messageId.toString())}`,
      data
    );
    return response.data;
  }

  async removeReaction(messageId: number): Promise<any> {
    const response = await httpClient.delete(
      `${this.baseURL}${API_ENDPOINTS.MESSENGER.REMOVE_REACTION(messageId.toString())}`
    );
    return response.data;
  }

  async searchMessages(data: MessageSearchQuery): Promise<{ messages: any[] }> {
    const response = await httpClient.post(`${this.baseURL}${API_ENDPOINTS.MESSENGER.SEARCH_MESSAGES}`, data);
    return response.data;
  }

  async searchUsers(query: string, limit: number = 10): Promise<{ users: User[] }> {
    const url = `${this.baseURL}${API_ENDPOINTS.MESSENGER.SEARCH_USERS}?query=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await httpClient.get(url);
    return response.data;
  }
}

export const messengerService = new MessengerService();

// Re-export interfaces to ensure they're available
export type { User, Message, Conversation, ConversationCreate, DirectMessageCreate, MessageCreate, ReactionCreate, MessageSearchQuery };