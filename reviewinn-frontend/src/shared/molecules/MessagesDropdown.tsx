import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { messengerService } from '../../api/services/messengerService';
import type { Conversation } from '../../api/services/messengerService';

interface MessageItem {
  user: string;
  message: string;
  time: string;
  avatar: string;
  conversation_id?: number;
}

interface MessagesDropdownProps {
  open: boolean;
  onClose: () => void;
  messages: MessageItem[];
}

const MessagesDropdown: React.FC<MessagesDropdownProps> = ({ open, onClose }) => {
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadRecentConversations();
    }
  }, [open]);

  const loadRecentConversations = async () => {
    try {
      setLoading(true);
      const response = await messengerService.getConversations();
      // Get the 5 most recent conversations
      setRecentConversations(response.conversations.slice(0, 5));
    } catch (error) {
      console.error('Failed to load recent conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.is_group) {
      return conversation.group_name || 'Group Chat';
    }
    return conversation.other_user?.name || conversation.other_user?.username || 'Unknown User';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.is_group) {
      return conversation.group_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.group_name || 'Group')}&background=4f46e5&color=fff&size=40`;
    }
    return conversation.other_user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.other_user?.name || 'User')}&size=40`;
  };

  if (!open) return null;

  return (
    <div className="absolute right-0 mt-2 z-50" style={{right: '12px', width: '384px'}}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 animate-fade-in" style={{minHeight: '400px', width: '100%'}}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-lg text-green-800">Messages</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold" aria-label="Close">×</button>
        </div>
        
        <div className="flex flex-col gap-3 overflow-y-auto" style={{height: '280px'}}>
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading messages...</p>
              </div>
            </div>
          )}
          
          {!loading && recentConversations.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-center">
                <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No conversations yet.</p>
                <p className="text-sm">Start a conversation to see messages here.</p>
              </div>
            </div>
          )}
          
          {!loading && recentConversations.map((conversation) => (
            <Link
              key={conversation.conversation_id}
              to={`/messenger?conversation=${conversation.conversation_id}`}
              onClick={onClose}
              className="flex items-center gap-3 p-3 bg-green-50 rounded-xl shadow-sm hover:bg-green-100 transition-colors flex-shrink-0"
            >
              <img 
                src={getConversationAvatar(conversation)} 
                alt={getConversationTitle(conversation)} 
                className="w-10 h-10 rounded-full object-cover border border-green-200" 
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800 text-sm">{getConversationTitle(conversation)}</div>
                <div className="text-gray-600 text-xs truncate">
                  {conversation.last_message?.content || 'No messages yet'}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  {conversation.last_message?.created_at ? formatTime(conversation.last_message.created_at) : ''}
                </span>
                {conversation.unread_count > 0 && (
                  <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 mt-1 font-bold">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {!loading && (
          <div className="mt-4 pt-3 border-t border-gray-200 flex-shrink-0">
            <Link
              to="/messenger"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <MessageCircle size={16} />
              See All Messages
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesDropdown;
