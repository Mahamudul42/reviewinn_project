import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, RefreshCw, X } from 'lucide-react';
import { professionalMessagingService } from '../../api/services/messaging';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import type { ProfessionalConversation } from '../../api/services/messaging';

interface SimpleMessagesDropdownProps {
  open: boolean;
  onClose: () => void;
}

// Modular data fetcher
class ConversationFetcher {
  static async fetchConversations(): Promise<ProfessionalConversation[]> {
    try {
      const result = await professionalMessagingService.conversations.getConversations({ limit: 10 });
      
      if (result?.data?.conversations && Array.isArray(result.data.conversations)) {
        return result.data.conversations;
      } else if (result?.conversations && Array.isArray(result.conversations)) {
        return result.conversations;
      } else if (Array.isArray(result)) {
        return result;
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }
}

// Modular UI components
const EmptyState: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center p-4">
      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <MessageCircle size={32} className="text-blue-500" />
      </div>
      <h3 className="font-semibold text-gray-800 mb-2">No conversations yet</h3>
      <p className="text-gray-500 text-sm mb-4 max-w-xs">Start connecting with other users by visiting the messenger page.</p>
      <div className="space-y-2">
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw size={14} className="mr-1" />
          Retry Loading
        </button>
        <Link
          to="/messenger"
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
        >
          <MessageCircle size={16} className="mr-2" />
          Start Messaging
        </Link>
      </div>
    </div>
  </div>
);

const ConversationItem: React.FC<{ 
  conversation: ProfessionalConversation; 
  currentUserId?: number;
  onClose: () => void;
}> = ({ conversation, currentUserId, onClose }) => {
  const isUnread = conversation.user_unread_count > 0;
  const unreadCount = conversation.user_unread_count || 0;
  
  const getTitle = () => {
    if (conversation.conversation_type === 'group') {
      return conversation.title || 'Group Chat';
    }
    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
    return otherParticipant?.display_name || 'Direct Message';
  };

  const getAvatar = () => {
    if (conversation.conversation_type === 'group') {
      return conversation.avatar_url || 
             `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.title || 'Group')}&background=4f46e5&color=fff&size=48`;
    }
    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
    const name = otherParticipant?.display_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=48&background=random`;
  };

  return (
    <Link
      to={`/messenger?conversation=${conversation.conversation_id}`}
      onClick={onClose}
      className={`flex items-center p-4 hover:bg-gray-50 transition-all duration-150 border-b border-gray-100 ${
        isUnread ? 'bg-blue-50/30' : 'bg-white'
      }`}
    >
      <div className="relative flex-shrink-0 mr-3">
        <div className={`w-12 h-12 rounded-full overflow-hidden ${
          isUnread ? 'ring-2 ring-blue-400 ring-offset-1' : 'ring-1 ring-gray-200'
        }`}>
          <img 
            src={getAvatar()} 
            alt={getTitle()}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-1">
          <h4 className={`truncate text-base ${
            isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'
          }`}>
            {getTitle()}
          </h4>
          
          {isUnread && unreadCount > 0 && (
            <span className="bg-blue-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1.5 font-bold shadow-sm ml-2">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        
        <p className={`text-sm truncate ${
          isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
        }`}>
          {conversation.latest_message?.content || 'Start your conversation'}
        </p>
      </div>
    </Link>
  );
};

// Main component
const SimpleMessagesDropdown: React.FC<SimpleMessagesDropdownProps> = ({ open, onClose }) => {
  const [conversations, setConversations] = useState<ProfessionalConversation[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const { user } = useUnifiedAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const result = await ConversationFetcher.fetchConversations();
    setConversations(result);
    setLastUpdateTime(new Date().toLocaleTimeString());
  };

  // Load when opened
  useEffect(() => {
    if (open && user) {
      loadConversations();
    }
  }, [open, user]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 z-50" 
      style={{right: '12px', width: '420px'}}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-0 animate-fade-in backdrop-blur-sm" style={{height: '500px', width: '100%'}}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
          <div className="flex items-center space-x-2">
            <MessageCircle size={20} className="text-blue-600" />
            <span className="font-bold text-lg text-gray-800">Recent Messages</span>
            {lastUpdateTime && (
              <span className="text-xs text-gray-500">
                Updated: {lastUpdateTime}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadConversations}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              title="Refresh messages"
            >
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-200 rounded-full transition-colors group"
            >
              <X size={18} className="text-gray-500 group-hover:text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex flex-col overflow-hidden" style={{height: '320px'}}>
          {conversations.length === 0 ? (
            <EmptyState onRefresh={loadConversations} />
          ) : (
            <div className="overflow-y-auto flex-1">
              {conversations.map((conversation) => (
                <ConversationItem
                  key={conversation.conversation_id}
                  conversation={conversation}
                  currentUserId={user?.id ? parseInt(user.id) : undefined}
                  onClose={onClose}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={() => {
              onClose();
              window.location.href = '/messenger';
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
          >
            <MessageCircle size={16} />
            Open Messenger
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleMessagesDropdown;