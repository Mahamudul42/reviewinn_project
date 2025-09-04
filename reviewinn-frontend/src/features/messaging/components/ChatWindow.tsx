import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Paperclip, X, Phone, Video, Info, Smile, MoreVertical, Search } from 'lucide-react';
import type { ProfessionalConversation, ProfessionalMessage, ProfessionalUser } from '../../../api/services/messaging';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import UserProfileModal from './UserProfileModal';
import { useUserProfile, createUserForProfile } from '../../../hooks/useUserProfile';

interface ChatWindowProps {
  conversation: ProfessionalConversation;
  messages: ProfessionalMessage[];
  onSendMessage: (content: string, replyToMessageId?: number) => void;
  onSendFile: (file: File, content?: string) => void;
  onReaction: (messageId: number, emoji: string) => void;
  onRemoveReaction: (messageId: number) => void;
  onMarkAsRead: (messageId?: number) => void;
  onLoadMoreMessages: () => void;
  typingUsers: string[];
  isConnected: boolean;
  loading?: boolean;
  hasMoreMessages?: boolean;
  isInitialLoad?: boolean;
  currentUserId?: number;
  onCreateDirectConversation?: (user: ProfessionalUser, initialMessage: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  onSendMessage,
  onSendFile,
  onReaction,
  onRemoveReaction,
  onMarkAsRead,
  onLoadMoreMessages,
  typingUsers,
  isConnected,
  loading = false,
  hasMoreMessages = false,
  isInitialLoad = false,
  currentUserId,
  onCreateDirectConversation,
}) => {
  const [messageText, setMessageText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ProfessionalMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { showProfileModal, selectedUser, openProfile, closeProfile } = useUserProfile();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const emojis = ['😊', '😂', '❤️', '👍', '👎', '😮', '😢', '😡', '🎉', '🔥'];

  // Only scroll to show new messages when user is viewing recent messages
  const scrollToBottomIfAtBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // With column-reverse, being at "top" (scrollTop near 0) means viewing newest messages
      const isViewingNewest = container.scrollTop <= 100;
      
      // Only scroll if user was already viewing newest messages
      if (isViewingNewest) {
        container.scrollTop = 0; // In column-reverse, 0 is where newest messages are
      }
    }
  }, []);

  // Handle new messages - only scroll if user is already at bottom
  useEffect(() => {
    if (!isInitialLoad && messages.length > 0) {
      scrollToBottomIfAtBottom();
    }
  }, [messages.length, isInitialLoad, scrollToBottomIfAtBottom]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[0]; // First message in array is the newest (due to column-reverse)
      if (lastMessage.sender_id !== currentUserId) {
        onMarkAsRead(lastMessage.message_id);
      }
    }
  }, [messages, onMarkAsRead, currentUserId]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [messageText]);

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      return;
    }

    try {
      onSendMessage(messageText.trim(), replyToMessage?.message_id);
      setMessageText('');
      setReplyToMessage(null);
      setShowEmojiPicker(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      onSendFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // With column-reverse, we need to check if we're near the bottom to load more older messages
      // When scrollTop + clientHeight >= scrollHeight - 100, we're near the bottom (which shows older messages)
      if (scrollTop + clientHeight >= scrollHeight - 100 && hasMoreMessages && !loading) {
        onLoadMoreMessages();
      }
    }
  };

  const getConversationTitle = (): string => {
    if (conversation.conversation_type === 'group') {
      return conversation.title || 'Group Chat';
    }
    
    // For direct conversations, find the other participant
    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
    return otherParticipant?.display_name || 'Unknown User';
  };

  const getConversationSubtitle = (): string => {
    if (conversation.conversation_type === 'group') {
      return `${conversation.participants?.length || 0} participants`;
    }
    
    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
    return otherParticipant ? `@${otherParticipant.display_name}` : 'Direct Message';
  };
  
  const getConversationAvatar = (): string => {
    if (conversation.conversation_type === 'group') {
      return conversation.avatar_url || 
             `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.title || 'Group')}&background=4f46e5&color=fff&size=56`;
    }
    
    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
    const participantName = otherParticipant?.display_name || 'User';
    return otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&size=56`;
  };

  // Removed infinite loading screen - show chat interface immediately
  // If data is not available, user can use refresh button

  return (
    <div 
      className={`chat-window h-full flex flex-col bg-gradient-to-br from-white to-gray-50 relative ${dragOver ? 'drag-over' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Elegant Header */}
      <div className="chat-header flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white via-blue-50 to-purple-50">
        <div className="flex items-center space-x-4">
          {/* Artistic Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-0.5">
              <img
                src={getConversationAvatar()}
                alt={getConversationTitle()}
                className="w-full h-full rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
                onClick={() => {
                  if (conversation.conversation_type === 'direct') {
                    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
                    if (otherParticipant && otherParticipant.user_id !== currentUserId) {
                      const user = createUserForProfile({
                        user_id: otherParticipant.user_id,
                        username: (otherParticipant as any).username,
                        name: (otherParticipant as any).full_name || otherParticipant.display_name,
                        display_name: otherParticipant.display_name,
                        full_name: (otherParticipant as any).full_name,
                        avatar: (otherParticipant as any).avatar,
                      });
                      openProfile(user);
                    }
                  }
                }}
              />
              {!isConnected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
              )}
              {isConnected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          </div>
          
          <div>
            <h3 
              className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => {
                if (conversation.conversation_type === 'direct') {
                  const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
                  if (otherParticipant && otherParticipant.user_id !== currentUserId) {
                    const user = createUserForProfile({
                      user_id: otherParticipant.user_id,
                      username: (otherParticipant as any).username,
                      name: (otherParticipant as any).full_name || otherParticipant.display_name,
                      display_name: otherParticipant.display_name,
                      full_name: (otherParticipant as any).full_name,
                      avatar: (otherParticipant as any).avatar,
                    });
                    openProfile(user);
                  }
                }
              }}
            >
              {getConversationTitle()}
            </h3>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600">{getConversationSubtitle()}</p>
              {!isConnected && (
                <span className="flex items-center text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  Disconnected
                </span>
              )}
              {isConnected && (
                <span className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Online
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button type="button" className="p-3 bg-white hover:bg-blue-50 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-105">
            <Phone size={20} className="text-blue-600" />
          </button>
          <button type="button" className="p-3 bg-white hover:bg-green-50 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-105">
            <Video size={20} className="text-green-600" />
          </button>
          <button type="button" className="p-3 bg-white hover:bg-purple-50 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-105">
            <Info size={20} className="text-purple-600" />
          </button>
        </div>
      </div>

      {/* Enhanced Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="messages-container flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-b from-gray-50/50 to-white"
        onScroll={handleScroll}
      >
        {/* Typing indicator - appears at bottom with column-reverse */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />

        {messages.map((message, index) => {
          // With column-reverse, next message (index + 1) is visually above current message
          const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
          const showAvatar = !nextMessage || 
                           nextMessage.sender_id !== message.sender_id ||
                           new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 300000; // 5 minutes

          return (
            <MessageBubble
              key={`msg_${message.message_id}_${index}`}
              message={message}
              onReply={setReplyToMessage}
              onReaction={onReaction}
              onRemoveReaction={onRemoveReaction}
              showAvatar={showAvatar}
              isGroupChat={conversation.conversation_type === 'group'}
              currentUserId={currentUserId}
              onUserClick={(userId) => {
                // Only show profile for other users, not current user
                if (userId !== currentUserId) {
                  const participant = conversation.participants?.find(p => p.user_id === userId);
                  if (participant) {
                    const user = createUserForProfile({
                      user_id: participant.user_id,
                      username: (participant as any).username,
                      name: (participant as any).full_name || participant.display_name,
                      display_name: participant.display_name,
                      full_name: (participant as any).full_name,
                      avatar: (participant as any).avatar,
                    });
                    openProfile(user);
                  }
                }
              }}
            />
          );
        })}

        {/* Elegant Load More Button */}
        {hasMoreMessages && (
          <div className="load-more text-center py-4">
            <button
              type="button"
              onClick={onLoadMoreMessages}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 font-medium text-sm"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                'Load more messages'
              )}
            </button>
          </div>
        )}
      </div>

      {/* Elegant Reply Indicator */}
      {replyToMessage && (
        <div className="reply-preview flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-l-4 border-l-blue-500">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700">
              Replying to <strong className="text-gray-900">{replyToMessage.sender?.name || `User ${replyToMessage.sender_id}`}</strong>
            </p>
            <p className="text-sm text-gray-800 truncate mt-1">
              {replyToMessage.message_type === 'image' ? '📷 Image' :
               replyToMessage.message_type === 'file' ? '📎 File' :
               replyToMessage.content}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReplyToMessage(null)}
            className="p-2 hover:bg-white/50 rounded-full transition-all duration-200 hover:scale-110"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>
      )}

      {/* Elegant Message Input */}
      <form 
        className="message-input p-6 border-t border-gray-200 bg-gradient-to-r from-white to-gray-50" 
        onSubmit={(e) => { 
          e.preventDefault(); 
          handleSendMessage();
        }}
      >
        <div className="flex items-end space-x-4">
          {/* Stylish File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white hover:bg-blue-50 rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md hover:scale-105 flex-shrink-0"
            title="Attach file"
          >
            <Paperclip size={20} className="text-blue-600" />
          </button>

          {/* Enhanced Message Textarea */}
          <div className="flex-1 relative">
            <div className="bg-white rounded-2xl border-2 border-gray-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200 shadow-sm">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full p-4 pr-14 border-0 rounded-2xl resize-none focus:outline-none bg-transparent max-h-32 text-gray-800 placeholder-gray-500"
                rows={1}
                disabled={false}
              />
              
              {/* Emoji Picker Button */}
              <div className="absolute right-3 bottom-3">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                  title="Add emoji"
                >
                  <Smile size={20} className="text-gray-500 hover:text-yellow-500" />
                </button>

                {/* Enhanced Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-14 right-0 bg-white shadow-xl rounded-2xl p-4 border border-gray-200 z-20">
                    <div className="grid grid-cols-5 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          type="button"
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="p-3 hover:bg-gray-100 rounded-xl text-2xl transition-all duration-200 hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Artistic Send Button */}
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-sm flex-shrink-0"
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={showProfileModal}
          onClose={closeProfile}
          onStartConversation={(user) => {
            if (onCreateDirectConversation) {
              onCreateDirectConversation(user, `Hi ${user.name}!`);
            }
          }}
          currentUserId={currentUserId}
          showActions={true}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
      />

      {/* Enhanced Drag Overlay */}
      {dragOver && (
        <div className="drag-overlay absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-12 rounded-3xl shadow-2xl text-center border border-blue-200 transform scale-110 transition-all duration-300">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Paperclip size={32} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Drop files here</h3>
            <p className="text-gray-600">Release to send your files instantly</p>
          </div>
        </div>
      )}

      <style>{`
        .chat-window {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          overflow-anchor: none;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
          display: flex;
          flex-direction: column-reverse;
          justify-content: flex-start;
          min-height: 0;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: #f7fafc;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }
        
        .drag-over {
          border: 2px dashed #3b82f6;
        }
        
        @media (max-width: 768px) {
          .chat-header {
            padding: 1rem;
          }
          
          .messages-container {
            padding: 1rem;
          }
          
          .message-input {
            padding: 1rem;
          }
          
          .chat-window {
            min-height: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;