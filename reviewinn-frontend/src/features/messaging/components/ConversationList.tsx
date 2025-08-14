import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, Users, Plus } from 'lucide-react';
import type { ProfessionalConversation } from '../../../api/services/professionalMessagingService';
import { formatTimeAgo } from '../../../shared/utils/reviewUtils';

interface ConversationListProps {
  conversations: ProfessionalConversation[];
  activeConversationId?: number;
  onConversationSelect: (conversation: ProfessionalConversation) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  loading?: boolean;
  currentUserId?: number;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewChat,
  onNewGroup,
  loading = false,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState<ProfessionalConversation[]>(conversations);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv => {
      const searchTerm = searchQuery.toLowerCase();
      
      if (conv.conversation_type === 'group') {
        return conv.title?.toLowerCase().includes(searchTerm);
      } else {
        // For direct conversations, search in participant names
        const otherParticipant = conv.participants?.find(p => p.user_id !== currentUserId);
        if (otherParticipant) {
          return otherParticipant.display_name?.toLowerCase().includes(searchTerm);
        }
        return conv.title?.toLowerCase().includes(searchTerm);
      }
    });

    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const getConversationTitle = (conversation: ProfessionalConversation): string => {
    if (conversation.conversation_type === 'group') {
      return conversation.title || 'Group Chat';
    }
    
    // For direct conversations, find the other participant
    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
    if (otherParticipant) {
      return otherParticipant.display_name || `User ${otherParticipant.user_id}`;
    }
    
    return conversation.title || 'Unknown User';
  };

  const getConversationAvatar = (conversation: ProfessionalConversation): string => {
    if (conversation.conversation_type === 'group') {
      return conversation.avatar_url || 
             `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.title || 'Group')}&background=4f46e5&color=fff&size=48`;
    }
    
    // For direct conversations, use other participant's avatar
    const otherParticipant = conversation.participants?.find(p => p.user_id !== currentUserId);
    const participantName = otherParticipant?.display_name || `User ${otherParticipant?.user_id || 'Unknown'}`;
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&size=48`;
  };

  const getLastMessagePreview = (conversation: ProfessionalConversation): string => {
    if (!conversation.latest_message) return 'No messages yet';
    
    const { content, message_type, sender_id } = conversation.latest_message;
    
    // Get sender name for group conversations
    let prefix = '';
    if (conversation.conversation_type === 'group') {
      const sender = conversation.participants?.find(p => p.user_id === sender_id);
      const senderName = sender?.display_name || `User ${sender_id}`;
      prefix = `${senderName}: `;
    }
    
    switch (message_type) {
      case 'image':
        return `${prefix}📷 Photo`;
      case 'file':
        return `${prefix}📎 File`;
      default:
        return `${prefix}${content}`;
    }
  };

  if (loading) {
    return (
      <div className="conversation-list h-full flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading conversations</h3>
          <p className="text-sm text-gray-600">Please wait while we fetch your messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-list h-full flex flex-col bg-gray-50">
      {/* Compact Header */}
      <div className="conversation-header p-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Conversations
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{conversations.length} total</p>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={onNewChat}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105"
              title="New Chat"
            >
              <MessageCircle size={16} className="text-blue-600" />
            </button>
            <button
              onClick={onNewGroup}
              className="p-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-105"
              title="New Group"
            >
              <Users size={16} className="text-purple-600" />
            </button>
          </div>
        </div>

        {/* Compact Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200 text-sm text-gray-800 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Elegant Conversations */}
      <div className="conversation-scroll flex-1 overflow-y-auto px-4 py-2">
        {filteredConversations.length === 0 ? (
          <div className="empty-state p-8 text-center">
            {searchQuery ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No conversations found</h3>
                <p className="text-sm text-gray-600">Try a different search term</p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={32} className="text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-600 mb-6">Start connecting with your network</p>
                <button
                  onClick={onNewChat}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  <Plus size={18} className="mr-2" />
                  Start a conversation
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="conversation-items space-y-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.conversation_id}
                onClick={() => onConversationSelect(conversation)}
                className={`conversation-item p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white ${
                  activeConversationId === conversation.conversation_id 
                    ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                    : 'bg-white hover:shadow-sm border border-gray-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Compact Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationTitle(conversation)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {conversation.conversation_type === 'group' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                        <Users size={8} className="text-white" />
                      </div>
                    )}
                    {conversation.user_unread_count > 0 && conversation.conversation_type !== 'group' && (
                      <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {conversation.user_unread_count > 9 ? '9+' : conversation.user_unread_count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Compact Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate text-sm">
                        {getConversationTitle(conversation)}
                      </h3>
                      <div className="flex-shrink-0">
                        {conversation.latest_message && (
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(conversation.latest_message.created_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 truncate leading-relaxed">
                      {getLastMessagePreview(conversation)}
                    </p>

                    {/* Group participants - compact */}
                    {conversation.conversation_type === 'group' && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-purple-600 font-medium">
                          {conversation.participants?.length || 0} members
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* <style jsx={true}>{`
        .conversation-list {
          width: 100%;
          max-width: 350px;
        }
        
        .conversation-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e0 #f7fafc;
        }
        
        .conversation-scroll::-webkit-scrollbar {
          width: 6px;
        }
        
        .conversation-scroll::-webkit-scrollbar-track {
          background: #f7fafc;
        }
        
        .conversation-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e0;
          border-radius: 3px;
        }
        
        .conversation-item:last-child {
          border-bottom: none;
        }
        
        @media (max-width: 768px) {
          .conversation-list {
            max-width: 100%;
          }
        }
      `} */}
    </div>
  );
};

export default ConversationList;