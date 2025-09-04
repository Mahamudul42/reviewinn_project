/**
 * Professional Messaging Service Types - Enhanced and Modular
 */

// ========== BASE TYPES ==========
export interface ProfessionalUser {
  user_id: number;
  username: string;
  name: string;
  avatar?: string;
  display_name?: string;
  is_online?: boolean;
  last_seen?: string;
  status?: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
}

export interface ProfessionalParticipant {
  user_id: number;
  username: string;
  name: string;
  avatar?: string;
  role: string;
  joined_at: string;
  is_admin: boolean;
  is_muted: boolean;
  last_read_at?: string;
}

// ========== CONVERSATION TYPES ==========
export interface ProfessionalConversation {
  conversation_id: number;
  conversation_type: 'direct' | 'group' | 'channel' | 'broadcast';
  title?: string;
  description?: string;
  avatar_url?: string;
  is_private: boolean;
  is_archived: boolean;
  is_muted: boolean;
  join_policy: 'open' | 'invite_only' | 'admin_approval';
  creator_id?: number;
  total_messages: number;
  active_participants: number;
  last_activity: string;
  created_at: string;
  participants: ProfessionalParticipant[];
  latest_message?: ProfessionalLatestMessage;
  user_role: string;
  user_unread_count: number;
  user_unread_mentions: number;
  settings: ConversationSettings;
}

export interface ProfessionalLatestMessage {
  message_id: number;
  content: string;
  sender_name: string;
  sent_at: string;
  message_type: string;
}

export interface ConversationSettings {
  notifications_enabled: boolean;
  sound_enabled: boolean;
  mention_notifications: boolean;
  typing_indicators: boolean;
  read_receipts: boolean;
}

// ========== MESSAGE TYPES ==========
export interface ProfessionalMessage {
  message_id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  sender_username: string;
  sender_avatar?: string;
  content: string;
  message_type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
  parent_message_id?: number;
  thread_count?: number;
  sent_at: string;
  edited_at?: string;
  is_edited: boolean;
  is_deleted: boolean;
  is_pinned: boolean;
  attachments: ProfessionalAttachment[];
  reactions: ProfessionalReaction[];
  mentions: ProfessionalMention[];
  delivery_status: 'sent' | 'delivered' | 'read' | 'failed';
  read_by: ReadReceipt[];
}

export interface ProfessionalAttachment {
  attachment_id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
  created_at: string;
}

export interface ProfessionalReaction {
  reaction_id: number;
  user_id: number;
  username: string;
  emoji: string;
  created_at: string;
}

export interface ProfessionalMention {
  mention_id: number;
  user_id: number;
  username: string;
  start_position: number;
  end_position: number;
}

export interface ReadReceipt {
  user_id: number;
  username: string;
  read_at: string;
}

// ========== PRESENCE & ACTIVITY TYPES ==========
export interface UserPresence {
  user_id: number;
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  last_seen?: string;
  custom_status?: string;
  is_typing?: boolean;
  current_conversation_id?: number;
}

export interface TypingIndicator {
  user_id: number;
  username: string;
  conversation_id: number;
  is_typing: boolean;
  started_at: string;
}

// ========== ADVANCED FEATURES ==========
export interface MessageThread {
  thread_id: number;
  parent_message_id: number;
  message_count: number;
  participants: number[];
  last_activity: string;
  created_at: string;
}

export interface PinnedMessage {
  message_id: number;
  pinned_by: number;
  pinned_at: string;
  reason?: string;
  message: ProfessionalMessage;
}

export interface SearchResults {
  messages: ProfessionalMessage[];
  conversations: ProfessionalConversation[];
  users: ProfessionalUser[];
  total_results: number;
  has_more: boolean;
}

// ========== REQUEST TYPES ==========
export interface ConversationCreateRequest {
  participant_ids: number[];
  conversation_type: 'direct' | 'group' | 'channel' | 'broadcast';
  title?: string;
  description?: string;
  is_private?: boolean;
  join_policy?: 'open' | 'invite_only' | 'admin_approval';
}

export interface MessageSendRequest {
  conversation_id: number;
  content: string;
  message_type?: 'text' | 'file' | 'image' | 'video' | 'audio';
  parent_message_id?: number;
  attachments?: File[];
  mentions?: number[];
}

export interface MessageEditRequest {
  message_id: number;
  content: string;
  attachments?: File[];
  mentions?: number[];
}

export interface ReactionRequest {
  message_id: number;
  emoji: string;
}

export interface PresenceUpdateRequest {
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  custom_status?: string;
}

// ========== RESPONSE TYPES ==========
export interface ProfessionalMessagingResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ConversationsResponse {
  conversations: ProfessionalConversation[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface MessagesResponse {
  messages: ProfessionalMessage[];
  count: number;
  has_more: boolean;
  next_cursor?: string;
}

export interface PresenceResponse {
  users: UserPresence[];
  total_online: number;
  last_updated: string;
}

// ========== ERROR TYPES ==========
export interface MessagingError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export enum MessagingErrorCodes {
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  MESSAGE_NOT_FOUND = 'MESSAGE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  USER_NOT_IN_CONVERSATION = 'USER_NOT_IN_CONVERSATION',
  INVALID_MESSAGE_TYPE = 'INVALID_MESSAGE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  WEBSOCKET_CONNECTION_FAILED = 'WEBSOCKET_CONNECTION_FAILED'
}