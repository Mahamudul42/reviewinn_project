import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Reply, MoreHorizontal, Download } from 'lucide-react';
import type { MsgMessage } from '../../../api/services/msgService';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';

interface MessageBubbleProps {
  message: any; // Changed from MsgMessage to any for compatibility
  onReply?: (message: any) => void;
  onReaction?: (messageId: number, emoji: string) => void;
  onRemoveReaction?: (messageId: number) => void;
  showAvatar?: boolean;
  isGroupChat?: boolean;
  currentUserId?: number;
  onUserClick?: (userId: number) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onReply,
  onReaction,
  onRemoveReaction,
  showAvatar = true,
  isGroupChat = false,
  currentUserId,
  onUserClick,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0, right: 'auto', arrowLeft: 16 });
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const messageActionsRef = useRef<HTMLDivElement>(null);

  const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Calculate optimal position for reaction picker
  const calculatePickerPosition = () => {
    if (!messageActionsRef.current) return;

    const actionsRect = messageActionsRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Picker dimensions (more accurate)
    const pickerWidth = 312; // 6 reactions * 48px + padding + spacing
    const pickerHeight = 72; // Reaction buttons + padding + arrow
    const arrowHeight = 8;
    const margin = 16;

    let top = actionsRect.bottom + arrowHeight + 4;
    let left = 0;

    // Determine horizontal position based on message alignment and available space
    const isOwnMessage = message.sender.user_id === currentUserId;
    if (isOwnMessage) {
      // For own messages, prefer positioning to the left of the picker
      left = actionsRect.right - pickerWidth;
      
      // Ensure picker doesn't go off the left edge
      if (left < margin) {
        left = margin;
      }
      
      // If still not enough space, center it relative to the actions
      if (left + pickerWidth > viewport.width - margin) {
        left = Math.max(margin, actionsRect.left + actionsRect.width / 2 - pickerWidth / 2);
      }
    } else {
      // For other messages, prefer positioning aligned with actions
      left = actionsRect.left;
      
      // Ensure picker doesn't go off the right edge
      if (left + pickerWidth > viewport.width - margin) {
        left = viewport.width - pickerWidth - margin;
      }
      
      // Ensure picker doesn't go off the left edge
      if (left < margin) {
        left = margin;
      }
    }

    // Vertical position logic
    const spaceBelow = viewport.height - actionsRect.bottom;
    const spaceAbove = actionsRect.top;
    
    if (spaceBelow >= pickerHeight + margin) {
      // Place below if there's enough space
      top = actionsRect.bottom + arrowHeight + 4;
    } else if (spaceAbove >= pickerHeight + margin) {
      // Place above if there's enough space
      top = actionsRect.top - pickerHeight - arrowHeight - 4;
    } else {
      // Not enough space either way, place in the best available position
      if (spaceBelow > spaceAbove) {
        top = Math.max(margin, viewport.height - pickerHeight - margin);
      } else {
        top = margin;
      }
    }

    // Calculate arrow position relative to the actions button
    const arrowLeft = Math.max(16, Math.min(
      pickerWidth - 32,
      actionsRect.left + actionsRect.width / 2 - left
    ));

    setPickerPosition({ top, left, right: 'auto', arrowLeft });
  };

  // Update position when showing reactions
  useEffect(() => {
    if (showReactions) {
      calculatePickerPosition();
      // Recalculate on window resize
      const handleResize = () => calculatePickerPosition();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showReactions, currentUserId, message.sender.user_id]);

  // Close reaction picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactions(false);
      }
    };

    if (showReactions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showReactions]);

  const handleReactionClick = (emoji: string) => {
    if (!currentUserId) return;
    
    // Check if current user already reacted with this emoji
    const userHasReacted = message.reactions && message.reactions.some(r => r.user.user_id === currentUserId && r.reaction_type === emoji);

    if (userHasReacted) {
      onRemoveReaction?.(message.message_id);
    } else {
      onReaction?.(message.message_id, emoji);
    }
    setShowReactions(false);
  };

  const getReactionCounts = () => {
    const counts: Record<string, number> = {};
    
    // Handle reactions as object (new format) or array (legacy format)
    if (message.reactions) {
      if (Array.isArray(message.reactions)) {
        // Legacy array format
        message.reactions.forEach((reaction) => {
          counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
        });
      } else {
        // New object format: { user_id: reaction_type }
        Object.entries(message.reactions).forEach(([userId, reactionType]) => {
          if (typeof reactionType === 'string') {
            counts[reactionType] = (counts[reactionType] || 0) + 1;
          }
        });
      }
    }
    
    return counts;
  };

  const reactionCounts = getReactionCounts();

  const handleFileDownload = () => {
    const attachment = message.attachments?.[0];
    if (attachment?.file_url) {
      const link = document.createElement('a');
      link.href = attachment.file_url;
      link.download = attachment.file_name || 'file';
      link.click();
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'image':
        const imageAttachment = message.attachments?.find(att => att.file_type?.startsWith('image/'));
        return (
          <div className="message-image">
            <img 
              src={imageAttachment?.file_url} 
              alt={imageAttachment?.file_name}
              className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(imageAttachment?.file_url, '_blank')}
            />
            {message.content && message.content !== imageAttachment?.file_name && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'file':
      case 'attachment':
        const fileAttachment = message.attachments?.[0];
        return (
          <div className="message-file flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-sm">{fileAttachment?.file_name || 'File'}</p>
              <p className="text-xs text-gray-500">
                {fileAttachment?.file_size ? `${(fileAttachment.file_size / 1024).toFixed(1)} KB` : 'File'}
              </p>
            </div>
            <button
              onClick={handleFileDownload}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Download size={16} />
            </button>
          </div>
        );
      
      default:
        return <p className="message-text">{message.content}</p>;
    }
  };

  const isOwnMessage = message.sender.user_id === currentUserId;

  return (
    <div className={`message-bubble-container ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      <div className="flex items-end space-x-2 mb-1">
        {!isOwnMessage && showAvatar && (
          <img
            src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${message.sender?.name || 'User'}&size=24`}
            alt={message.sender?.name || 'User'}
            className="w-6 h-6 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
            onClick={() => {
              if (message.sender_id !== currentUserId) {
                onUserClick?.(message.sender_id);
              }
            }}
          />
        )}
        
        <div className={`message-bubble max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-auto' : ''}`}>
          {/* Sender name for group chats */}
          {!isOwnMessage && isGroupChat && (
            <p 
              className="text-xs text-gray-600 mb-1 px-3 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => {
              if (message.sender_id !== currentUserId) {
                onUserClick?.(message.sender_id);
              }
            }}
            >
              {message.sender?.name || 'User'}
            </p>
          )}

          {/* Reply indicator */}
          {message.reply_to_message_id && (
            <div className="reply-indicator px-3 py-2 bg-gray-100 border-l-4 border-blue-500 mb-2 rounded-t-lg">
              <p className="text-xs text-gray-600">Replying to message</p>
              <p className="text-sm text-gray-800 truncate">Message ID: {message.reply_to_message_id}</p>
            </div>
          )}

          {/* Message content */}
          <div className={`message-content p-3 rounded-lg relative group ${
            isOwnMessage 
              ? 'bg-blue-500 text-white rounded-br-sm' 
              : 'bg-gray-200 text-gray-800 rounded-bl-sm'
          }`}>
            {renderMessageContent()}

            {/* Message actions */}
            <div 
              ref={messageActionsRef}
              className={`message-actions absolute top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                isOwnMessage ? 'left-2' : 'right-2'
              }`}
            >
              <div className={`flex items-center space-x-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border border-gray-200 ${
                isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className={`p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 hover:scale-110 ${
                    showReactions ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                  }`}
                  title="Add reaction"
                >
                  <span className="text-sm">😊</span>
                </button>
                
                <button
                  onClick={() => onReply?.(message)}
                  className="p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 hover:scale-110 text-gray-600"
                  title="Reply"
                >
                  <Reply size={14} />
                </button>
                
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-full transition-all duration-200 hover:bg-gray-100 hover:scale-110 text-gray-600"
                  title="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>

            </div>
          </div>

          {/* Reactions */}
          {Object.keys(reactionCounts).length > 0 && (
            <div className="reactions flex flex-wrap gap-1 mt-2 px-1 animate-in fade-in duration-300">
              {Object.entries(reactionCounts).map(([emoji, count]) => {
                const userHasThisReaction = currentUserId && message.reactions && message.reactions.some(r => r.user.user_id === currentUserId && r.reaction_type === emoji);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className={`reaction-count flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      userHasThisReaction 
                        ? 'bg-blue-100 border border-blue-300 text-blue-700 shadow-sm animate-in zoom-in duration-200' 
                        : 'bg-gray-100 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    <span className="text-sm">{emoji}</span>
                    <span className="font-medium">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isOwnMessage && showAvatar && (
          <img
            src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${message.sender?.name || 'User'}&size=24`}
            alt={message.sender?.name || 'User'}
            className="w-6 h-6 rounded-full flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
            onClick={() => {
              if (message.sender_id !== currentUserId) {
                onUserClick?.(message.sender_id);
              }
            }}
          />
        )}
      </div>

      {/* Message metadata */}
      <div className={`message-metadata flex items-center space-x-2 text-xs text-gray-500 ${
        isOwnMessage ? 'justify-end' : 'justify-start'
      } ${showAvatar && !isOwnMessage ? 'ml-10' : ''}`}>
        <span>{formatTimeAgo(message.created_at)}</span>
        
        {isOwnMessage && (
          <span className="status text-gray-400">
            ✓
          </span>
        )}
      </div>

      {/* Portal-based Reaction Picker */}
      {showReactions && createPortal(
        <div 
          ref={reactionPickerRef}
          className="fixed z-50 bg-white shadow-2xl rounded-2xl p-3 border border-gray-200 animate-in fade-in zoom-in duration-200 backdrop-blur-sm"
          style={{
            top: `${pickerPosition.top}px`,
            left: `${pickerPosition.left}px`,
            right: pickerPosition.right,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex space-x-2">
            {reactions.map((emoji) => {
              const userHasThisReaction = currentUserId && message.reactions && message.reactions.some(r => r.user.user_id === currentUserId && r.reaction_type === emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`p-3 rounded-full text-2xl transition-all duration-300 transform hover:scale-125 active:scale-95 hover:rotate-12 ${
                    userHasThisReaction
                      ? 'bg-blue-100 border-2 border-blue-300 shadow-lg ring-2 ring-blue-200 scale-110'
                      : 'hover:bg-gray-100 border-2 border-transparent hover:shadow-lg hover:shadow-gray-200/50'
                  }`}
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          
          {/* Picker arrow */}
          <div 
            className="absolute w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent"
            style={{ 
              top: '-8px',
              left: `${pickerPosition.arrowLeft}px`,
              borderBottomColor: 'rgba(255, 255, 255, 0.95)',
              filter: 'drop-shadow(0 -4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default MessageBubble;