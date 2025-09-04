/**
 * Professional Messaging Service - Modular Architecture Entry Point
 * 
 * This file provides a clean interface to the refactored messaging system.
 * Import what you need:
 * 
 * For new code (recommended):
 * ```typescript
 * import { ConversationsModule, MessagesModule, PresenceModule } from '@/api/services/messaging';
 * ```
 * 
 * For backward compatibility:
 * ```typescript
 * import { professionalMessagingService } from '@/api/services/messaging';
 * ```
 */

// Import and export the modular components
import { ConversationsModule } from './conversationsModule';
import { MessagesModule } from './messagesModule';  
import { PresenceModule } from './presenceModule';
import { MessagingResponseHandler } from './responseHandler';
import { ConversationCreateRequest } from './types';

export { ConversationsModule, MessagesModule, PresenceModule, MessagingResponseHandler };

// Export all types and utilities
export * from './types';
export * from './utils';

// Create a unified messaging service using the new modular components
class UnifiedMessagingService {
  public readonly conversations: ConversationsModule;
  public readonly messages: MessagesModule;
  public readonly presence: PresenceModule;

  constructor() {
    this.conversations = new ConversationsModule();
    this.messages = new MessagesModule();
    this.presence = new PresenceModule();
  }

  // Backward compatibility methods
  async createOrGetDirectConversation(participantId: number) {
    return this.conversations.getOrCreateDirectConversation(participantId);
  }

  async createConversation(data: ConversationCreateRequest) {
    return this.conversations.createConversation(data);
  }

  async getConversations(limit = 20, offset = 0, search?: string, conversationType?: string) {
    return this.conversations.getConversations({ limit, offset, type: conversationType });
  }

  async getConversationDetails(conversationId: number) {
    return this.conversations.getConversationDetails(conversationId);
  }

  async sendMessage(conversationId: number, data: { content: string; message_type?: string; reply_to_message_id?: number; mentions?: number[] }, files?: File[]) {
    const messageRequest = {
      conversation_id: conversationId,
      content: data.content,
      message_type: data.message_type,
      parent_message_id: data.reply_to_message_id,
      attachments: files,
      mentions: data.mentions
    };
    return this.messages.sendMessage(messageRequest);
  }

  async getMessages(conversationId: number, options: { limit?: number; beforeMessageId?: number; afterMessageId?: number; messageType?: string } = {}) {
    return this.messages.getMessages(conversationId, {
      limit: options.limit,
      before: options.beforeMessageId?.toString(),
      after: options.afterMessageId?.toString(),
      type: options.messageType
    });
  }

  async addReaction(messageId: number, reactionType: string) {
    return this.messages.addReaction({ message_id: messageId, emoji: reactionType });
  }

  async removeReaction(messageId: number, reactionType: string) {
    console.warn('removeReaction: Need reaction ID, not just reaction type');
    return { success: false, message: 'Reaction removal requires reaction ID' };
  }
}

export const ProfessionalMessagingService = UnifiedMessagingService;
export const professionalMessagingService = new UnifiedMessagingService();

// Create a convenient factory for getting module instances
export const createMessagingModules = () => ({
  conversations: new ConversationsModule(),
  messages: new MessagesModule(),
  presence: new PresenceModule()
});

// Helper function to create a unified service with all modules
export const createMessagingService = () => {
  const modules = createMessagingModules();
  
  return {
    ...modules,
    // Convenience methods that work across modules
    async createDirectConversation(participantId: number) {
      return modules.conversations.getOrCreateDirectConversation(participantId);
    },
    
    async sendMessageToConversation(conversationId: number, content: string) {
      return modules.messages.sendMessage({
        conversation_id: conversationId,
        content,
        message_type: 'text'
      });
    },
    
    async startTypingInConversation(conversationId: number) {
      return modules.presence.startTyping(conversationId);
    },
    
    async stopTypingInConversation(conversationId: number) {
      return modules.presence.stopTyping(conversationId);
    }
  };
};

// Export default instance for immediate use
export const messagingService = createMessagingService();