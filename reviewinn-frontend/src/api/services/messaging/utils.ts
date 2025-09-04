/**
 * Messaging Service Utilities
 * Shared utility functions for the messaging modules
 */

import { ProfessionalMessage, UserPresence, ProfessionalConversation } from './types';

/**
 * Format message timestamp for display
 */
export const formatMessageTime = (timestamp: string): string => {
  const messageDate = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - messageDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return messageDate.toLocaleDateString();
};

/**
 * Get user status display text
 */
export const getPresenceDisplayText = (presence: UserPresence): string => {
  switch (presence.status) {
    case 'online': return 'Online';
    case 'away': return 'Away';
    case 'busy': return 'Busy';
    case 'invisible': return 'Offline';
    case 'offline': return 'Offline';
    default: return 'Unknown';
  }
};

/**
 * Get conversation display name
 */
export const getConversationDisplayName = (conversation: ProfessionalConversation): string => {
  if (conversation.title) return conversation.title;
  
  if (conversation.conversation_type === 'direct') {
    const otherParticipant = conversation.participants.find(p => p.user_id !== getCurrentUserId());
    return otherParticipant?.name || 'Direct Message';
  }
  
  return `Group (${conversation.participants.length})`;
};

/**
 * Check if message contains mentions for current user
 */
export const hasUserMention = (message: ProfessionalMessage): boolean => {
  const currentUserId = getCurrentUserId();
  return message.mentions.some(mention => mention.mentioned_user_id === currentUserId);
};

/**
 * Get file type icon for attachment
 */
export const getFileTypeIcon = (fileType: string): string => {
  const type = fileType.toLowerCase();
  
  if (type.includes('image')) return '🖼️';
  if (type.includes('video')) return '🎥';
  if (type.includes('audio')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('excel') || type.includes('sheet')) return '📊';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
  if (type.includes('zip') || type.includes('archive')) return '📦';
  
  return '📎';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Validate message content
 */
export const validateMessageContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content.trim()) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 4000) {
    return { isValid: false, error: 'Message too long (max 4000 characters)' };
  }
  
  return { isValid: true };
};

/**
 * Extract mentions from message content
 */
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Sanitize message content for display
 */
export const sanitizeMessageContent = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Generate unique conversation key for caching
 */
export const getConversationKey = (conversationId: number): string => {
  return `conversation_${conversationId}`;
};

/**
 * Generate unique message key for caching
 */
export const getMessageKey = (messageId: number): string => {
  return `message_${messageId}`;
};

/**
 * Check if conversation is muted
 */
export const isConversationMuted = (conversation: ProfessionalConversation): boolean => {
  return conversation.is_muted;
};

/**
 * Get unread count for conversation
 */
export const getUnreadCount = (conversation: ProfessionalConversation): number => {
  return conversation.user_unread_count || 0;
};

/**
 * Check if user has admin permissions in conversation
 */
export const hasAdminPermissions = (conversation: ProfessionalConversation): boolean => {
  const currentUserId = getCurrentUserId();
  const currentParticipant = conversation.participants.find(p => p.user_id === currentUserId);
  
  return currentParticipant?.is_admin || conversation.user_role === 'owner' || conversation.user_role === 'admin';
};

/**
 * Mock function to get current user ID - replace with actual implementation
 */
function getCurrentUserId(): number {
  // This should be replaced with actual user ID from auth store
  return 1;
}

/**
 * Debounce function for typing indicators
 */
export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function for presence updates
 */
export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), wait);
    }
  };
};

/**
 * Create WebSocket URL from HTTP URL
 */
export const createWebSocketURL = (httpUrl: string, path: string = '/ws'): string => {
  return httpUrl.replace(/^http/, 'ws') + path;
};

/**
 * Retry function for failed API calls
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};