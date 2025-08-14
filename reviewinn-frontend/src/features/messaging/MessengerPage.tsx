import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ConversationList from './components/ConversationList';
import ChatWindow from './components/ChatWindow';
import NewChatModal from './components/NewChatModal';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { professionalMessagingService } from '../../api/services/professionalMessagingService';
import type { ProfessionalConversation, ProfessionalMessage, ProfessionalUser } from '../../api/services/professionalMessagingService';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { useToast } from '../../shared/components/ToastProvider';

const MessengerPage: React.FC = () => {
  // Always call hooks in the same order - no conditional hooks!
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { user: currentUserBase, isLoading: authLoading } = useUnifiedAuth();
  
  // State - all hooks called unconditionally
  const [conversations, setConversations] = useState<ProfessionalConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ProfessionalConversation | null>(null);
  const [messages, setMessages] = useState<ProfessionalMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [processedMessages, setProcessedMessages] = useState<Set<number>>(new Set());

  // Derive currentUser - use useMemo to avoid recreation on every render
  const currentUser = useMemo((): ProfessionalUser | null => {
    return currentUserBase ? { 
      user_id: parseInt(currentUserBase.id),
      username: currentUserBase.username || '',
      name: currentUserBase.name || currentUserBase.username || '',
      avatar: currentUserBase.avatar,
      is_online: true,
      status: 'online'
    } : null;
  }, [currentUserBase]);

  // Business logic functions - define these first
  const loadConversations = useCallback(async () => {
    console.log('=== loadConversations called ===');
    try {
      if (conversations.length === 0) {
        setLoading(true);
        console.log('Setting loading to true - no conversations yet');
      }
      console.log('Making getConversations API call...');
      const response = await professionalMessagingService.getConversations();
      console.log('getConversations response:', response);
      
      if (response && response.conversations) {
        console.log('Response conversations:', response.conversations);
        setConversations(prevConversations => {
          // Always update after creating a new conversation to ensure latest data
          console.log('Conversations updated from', prevConversations.length, 'to', response.conversations.length);
          return response.conversations;
        });
      } else {
        console.log('getConversations failed or no data:', response);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
      console.log('loadConversations finished');
    }
  }, [conversations.length, showError]);

  const loadMessages = useCallback(async (conversationId: number, offset: number = 0, limit?: number) => {
    try {
      setMessagesLoading(offset === 0);
      
      const messageLimit = limit || (offset === 0 ? 15 : 20);
      console.log(`Loading ${messageLimit} messages with offset ${offset}`);
      
      const response = await professionalMessagingService.getMessages(conversationId, { 
        limit: messageLimit, 
        beforeMessageId: offset > 0 ? messages[messages.length - 1]?.message_id : undefined 
      });
      
      if (response.success && response.data) {
        const messages = response.data.messages || [];
        if (offset === 0) {
          console.log(`Initial load: got ${messages.length} messages`);
          setMessages(messages);
          setIsInitialLoad(true);
          setTimeout(() => setIsInitialLoad(false), 100);
        } else {
          console.log(`Loading more: got ${messages.length} additional messages`);
          setMessages(prev => [...prev, ...messages]);
        }
        
        setHasMoreMessages(response.data.has_more || false);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      showError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }, [showError]);

  // WebSocket message handlers - now we can safely reference functions above
  const handleMarkAsRead = useCallback(async (messageId?: number) => {
    if (!activeConversation) return;

    try {
      await professionalMessagingService.markConversationRead(activeConversation.conversation_id, messageId);
      
      // We'll get sendMessage from the WebSocket hook below
      // For now, just update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === activeConversation.conversation_id
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [activeConversation]);

  const handleNewMessageFromWS = useCallback((message: any, conversationId?: number) => {
    console.log('🔥 HandleNewMessage called with:', message);
    
    // Always update conversation list when any new message arrives
    loadConversations();
    
    const messageConversationId = conversationId || message.conversation_id;
    
    // Add message to current conversation if it matches
    if (activeConversation && messageConversationId === activeConversation.conversation_id) {
      console.log('✅ Message is for current active conversation');
      
      // Only add if it's not from current user (to avoid duplicates with optimistic updates)
      if (message.sender_id !== currentUser?.user_id) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m.message_id === message.message_id);
          
          if (exists || processedMessages.has(message.message_id)) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }
          
          // Add to processed messages set
          setProcessedMessages(prevSet => new Set([...prevSet, message.message_id]));
          
          console.log('🎉 Adding new WebSocket message to chat window');
          return [message, ...prev]; // Add to beginning for column-reverse layout
        });
        
        // Mark as read since user is viewing the conversation
        handleMarkAsRead(message.message_id);
      }
    }
  }, [currentUser, activeConversation, processedMessages, loadConversations, handleMarkAsRead]);

  const handleTypingUpdateFromWS = useCallback((message: any) => {
    if (activeConversation && message.conversation_id === activeConversation.conversation_id) {
      setTypingUsers(prev => {
        if (message.is_typing) {
          return prev.includes(message.username) ? prev : [...prev, message.username];
        } else {
          return prev.filter(user => user !== message.username);
        }
      });

      // Clear typing indicator after timeout
      if (message.is_typing) {
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(user => user !== message.username));
        }, 3000);
      }
    }
  }, [activeConversation]);

  const handleMessageStatusUpdateFromWS = useCallback((message: any) => {
    if (activeConversation && message.conversation_id === activeConversation.conversation_id) {
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === message.message_id
            ? { ...msg, status: message.status }
            : msg
        )
      );
    }
  }, [activeConversation]);

  const handleReactionUpdateFromWS = useCallback((message: any) => {
    if (activeConversation && message.conversation_id === activeConversation.conversation_id) {
      console.log('🎭 Handling reaction update:', message);
      
      setMessages(prev => 
        prev.map(msg => {
          if (msg.message_id === message.message_id) {
            const reactions = { ...msg.reactions };
            
            if (message.type === 'add_reaction') {
              reactions[message.user_id.toString()] = message.emoji;
            } else if (message.type === 'remove_reaction') {
              delete reactions[message.user_id.toString()];
            }
            
            return { ...msg, reactions };
          }
          return msg;
        })
      );
    }
  }, [activeConversation]);

  // Main WebSocket message handler
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('🟢 WebSocket message received:', message);
    
    switch (message.type) {
      case 'new_message':
        handleNewMessageFromWS(message.message, message.conversation_id);
        break;
      case 'typing':
        handleTypingUpdateFromWS(message);
        break;
      case 'message_status':
        handleMessageStatusUpdateFromWS(message);
        break;
      case 'add_reaction':
      case 'remove_reaction':
      case 'reaction':
        handleReactionUpdateFromWS(message);
        break;
      case 'user_online':
        console.log('User came online:', message.user_id);
        break;
      case 'user_offline':
        console.log('User went offline:', message.user_id);
        break;
      case 'connection':
        console.log('✅ WebSocket connection confirmed:', message.status);
        break;
      default:
        console.log('❓ Unknown WebSocket message type:', message.type);
    }
  }, [handleNewMessageFromWS, handleTypingUpdateFromWS, handleMessageStatusUpdateFromWS, handleReactionUpdateFromWS]);

  // WebSocket hook - always called, never conditional
  const { isConnected, isConnecting, hasAttemptedConnection, sendMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('✅ Connected to messenger WebSocket');
    },
    onDisconnect: () => {
      console.log('🔌 Disconnected from messenger WebSocket');
    },
    onError: (error) => {
      console.log('⚠️ WebSocket connection failed:', error);
      // Don't show error to user as messenger still works without WebSocket
    }
  });

  // Update handleMarkAsRead to include sendMessage now that it's available
  const handleMarkAsReadWithWS = useCallback(async (messageId?: number) => {
    if (!activeConversation) return;

    try {
      await professionalMessagingService.markConversationRead(activeConversation.conversation_id, messageId);
      
      sendMessage({
        type: 'mark_read',
        conversation_id: activeConversation.conversation_id,
        message_id: messageId
      });

      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === activeConversation.conversation_id
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [activeConversation, sendMessage]);

  const handleConversationSelect = useCallback((conversation: ProfessionalConversation) => {
    if (activeConversation?.conversation_id === conversation.conversation_id) {
      return;
    }
    
    setActiveConversation(conversation);
    setMessages([]);
    setTypingUsers([]);
    setIsInitialLoad(true);
    setProcessedMessages(new Set());
    loadMessages(conversation.conversation_id);
    
    const currentConversationId = searchParams.get('conversation');
    if (currentConversationId !== conversation.conversation_id.toString()) {
      setSearchParams({ conversation: conversation.conversation_id.toString() });
    }
  }, [activeConversation, searchParams, setSearchParams, loadMessages]);

  const handleSendMessage = useCallback(async (content: string, replyToMessageId?: number) => {
    if (!activeConversation || !currentUser) return;

    const tempId = Date.now();

    // Optimistic update
    const optimisticMessage: ProfessionalMessage = {
      message_id: tempId,
      conversation_id: activeConversation.conversation_id,
      sender_id: currentUser.user_id,
      content,
      message_type: 'text' as const,
      reply_to_message_id: replyToMessageId,
      is_edited: false,
      is_deleted: false,
      is_pinned: false,
      is_forwarded: false,
      is_system: false,
      has_mentions: false,
      has_attachments: false,
      has_reactions: false,
      delivery_status: 'sending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: currentUser,
      attachments: [],
      reactions: [],
      mentions: []
    };

    setMessages(prev => [optimisticMessage, ...prev]);

    try {
      const response = await professionalMessagingService.sendMessage(activeConversation.conversation_id, {
        content,
        reply_to_message_id: replyToMessageId
      });

      // Replace optimistic message with real message
      if (response.success && response.data) {
        setMessages(prev => 
          prev.map(msg => 
            msg.message_id === tempId 
              ? { ...msg, message_id: response.data!.message_id, delivery_status: 'delivered' as const }
              : msg
          )
        );
      }

      // Send via WebSocket for real-time delivery (if connected)
      if (isConnected) {
        sendMessage({
          type: 'send_message',
          conversation_id: activeConversation.conversation_id,
          content,
          reply_to_message_id: replyToMessageId,
          temp_id: tempId
        });
      } else {
        console.log('📤 Message sent via API (WebSocket not connected)');
      }

      setTimeout(() => loadConversations(), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      showError('Failed to send message');
      setMessages(prev => prev.filter(msg => msg.message_id !== tempId));
    }
  }, [activeConversation, currentUser, messages, sendMessage, loadConversations, showError]);

  const handleSendFile = useCallback(async (file: File, content?: string) => {
    if (!activeConversation) return;

    try {
      await professionalMessagingService.sendMessage(activeConversation.conversation_id, {
        content: content || 'File attachment',
        message_type: 'file'
      }, [file]);
      loadMessages(activeConversation.conversation_id);
      loadConversations();
      showSuccess('File sent successfully');
    } catch (error) {
      console.error('Failed to send file:', error);
      showError('Failed to send file');
    }
  }, [activeConversation, loadMessages, loadConversations, showSuccess, showError]);

  const handleReaction = useCallback(async (messageId: number, emoji: string) => {
    if (!activeConversation || !currentUser) return;

    // Optimistic update
    setMessages(prev => prev.map(msg => {
      if (msg.message_id === messageId) {
        const newReactions = { ...msg.reactions };
        newReactions[currentUser.user_id.toString()] = emoji;
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));

    try {
      await professionalMessagingService.addReaction(messageId, emoji);
      
      sendMessage({
        type: 'add_reaction',
        message_id: messageId,
        conversation_id: activeConversation.conversation_id,
        user_id: currentUser.user_id,
        emoji
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
      showError('Failed to add reaction');
      
      // Revert optimistic update
      setMessages(prev => prev.map(msg => {
        if (msg.message_id === messageId) {
          const newReactions = { ...msg.reactions };
          delete newReactions[currentUser.user_id.toString()];
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));
    }
  }, [activeConversation, currentUser, sendMessage, showError]);

  const handleRemoveReaction = useCallback(async (messageId: number) => {
    if (!activeConversation || !currentUser) return;

    const oldReaction = messages.find(msg => msg.message_id === messageId)?.reactions?.[currentUser.user_id.toString()];

    // Optimistic update
    setMessages(prev => prev.map(msg => {
      if (msg.message_id === messageId) {
        const newReactions = { ...msg.reactions };
        delete newReactions[currentUser.user_id.toString()];
        return { ...msg, reactions: newReactions };
      }
      return msg;
    }));

    try {
      await professionalMessagingService.removeReaction(messageId, oldReaction || 'like');
      
      sendMessage({
        type: 'remove_reaction',
        message_id: messageId,
        conversation_id: activeConversation.conversation_id,
        user_id: currentUser.user_id
      });
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      showError('Failed to remove reaction');
      
      // Revert optimistic update
      if (oldReaction) {
        setMessages(prev => prev.map(msg => {
          if (msg.message_id === messageId) {
            const newReactions = { ...msg.reactions };
            newReactions[currentUser.user_id.toString()] = oldReaction;
            return { ...msg, reactions: newReactions };
          }
          return msg;
        }));
      }
    }
  }, [activeConversation, currentUser, messages, sendMessage, showError]);

  const handleLoadMoreMessages = useCallback(() => {
    if (activeConversation && !messagesLoading) {
      loadMessages(activeConversation.conversation_id, messages.length, 20);
    }
  }, [activeConversation, messagesLoading, loadMessages, messages.length]);

  const handleCreateDirectConversation = useCallback(async (user: ProfessionalUser, initialMessage: string) => {
    console.log('=== STARTING handleCreateDirectConversation ===');
    console.log('User:', user);
    console.log('Initial message:', initialMessage);
    
    try {
      console.log('Step 1: Creating conversation...');
      const response = await professionalMessagingService.createConversation({
        participant_ids: [user.user_id],
        conversation_type: 'direct'
      });
      console.log('Conversation response:', response);

      if (response && response.conversation_id) {
        console.log('Step 2: Sending initial message...');
        const messageResponse = await professionalMessagingService.sendMessage(response.conversation_id, {
          content: initialMessage
        });
        console.log('Message response:', messageResponse);
        
        console.log('Step 3: Loading conversations...');
        await loadConversations();
        
        console.log('Step 4: Closing modal...');
        setShowNewChatModal(false);
        
        setTimeout(() => {
          const newConversation = conversations.find(c => c.conversation_id === response.conversation_id);
          if (newConversation) {
            handleConversationSelect(newConversation);
          }
        }, 100);
        
        console.log('Step 5: Showing success message...');
        showSuccess('Conversation started successfully');
      } else {
        console.error('Conversation creation failed:', response);
        showError('Failed to create conversation');
      }
    } catch (error) {
      console.error('Exception in handleCreateDirectConversation:', error);
      showError('Failed to create conversation');
    }
    
    console.log('=== FINISHED handleCreateDirectConversation ===');
  }, [loadConversations, conversations, handleConversationSelect, showSuccess, showError]);

  const handleCreateGroupConversation = useCallback(async (participants: ProfessionalUser[], groupName: string, groupDescription?: string) => {
    try {
      const response = await professionalMessagingService.createConversation({
        participant_ids: participants.map(p => p.user_id),
        conversation_type: 'group',
        title: groupName,
        description: groupDescription
      });

      if (response.success && response.data) {
        await loadConversations();
        setShowNewGroupModal(false);
        
        setTimeout(() => {
          const newConversation = conversations.find(c => c.conversation_id === response.data!.conversation_id);
          if (newConversation) {
            handleConversationSelect(newConversation);
          }
        }, 100);
      }

      showSuccess('Group created successfully');
    } catch (error) {
      console.error('Failed to create group:', error);
      showError('Failed to create group');
    }
  }, [loadConversations, conversations, handleConversationSelect, showSuccess, showError]);

  // Effects - all called unconditionally
  
  // Auth redirect effect
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      console.warn('User not authenticated, messenger access denied');
      navigate('/login', { state: { from: '/messages' } });
    }
  }, [currentUser, authLoading, navigate]);

  // Load conversations on mount
  useEffect(() => {
    if (currentUser) {
      loadConversations();
    }
  }, [currentUser, loadConversations]);

  // Auto-join conversation rooms when connected
  useEffect(() => {
    if (isConnected && conversations.length > 0) {
      console.log('Auto-joining conversation rooms');
      setTimeout(() => {
        conversations.forEach(conversation => {
          sendMessage({
            type: 'join_conversation',
            conversation_id: conversation.conversation_id
          });
        });
      }, 200);
    }
  }, [isConnected, conversations.length, sendMessage]);

  // Handle conversation ID from URL params
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && conversations.length > 0) {
      const targetId = parseInt(conversationId);
      if (!activeConversation || activeConversation.conversation_id !== targetId) {
        const conversation = conversations.find(c => c.conversation_id === targetId);
        if (conversation) {
          setActiveConversation(conversation);
          setMessages([]);
          setTypingUsers([]);
          setIsInitialLoad(true);
          loadMessages(conversation.conversation_id);
        }
      }
    }
  }, [searchParams, conversations.length, activeConversation, loadMessages]);

  // Join active conversation room
  useEffect(() => {
    if (activeConversation && isConnected) {
      const timer = setTimeout(() => {
        sendMessage({
          type: 'join_conversation',
          conversation_id: activeConversation.conversation_id
        });
      }, 100);

      return () => {
        clearTimeout(timer);
        sendMessage({
          type: 'leave_conversation',
          conversation_id: activeConversation.conversation_id
        });
      };
    }
  }, [activeConversation, isConnected, sendMessage]);

  // Render logic - no early returns, handle all states in render
  const renderContent = () => {
    // Show loading if auth is loading
    if (authLoading) {
      return (
        <ThreePanelLayout
          pageTitle="💬 Messenger"
          leftPanelTitle="🌟 Community Highlights"
          rightPanelTitle="💡 Active Contacts"
          centerPanelWidth="800px"
          headerGradient="from-indigo-600 via-purple-600 to-pink-800"
          centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200"
          variant="full-width"
        >
          <div className="h-full bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading messenger...</p>
            </div>
          </div>
        </ThreePanelLayout>
      );
    }

    // Show login prompt if not authenticated
    if (!currentUser) {
      return (
        <ThreePanelLayout
          pageTitle="💬 Messenger"
          leftPanelTitle="🌟 Community Highlights"
          rightPanelTitle="💡 Active Contacts"
          centerPanelWidth="800px"
          headerGradient="from-indigo-600 via-purple-600 to-pink-800"
          centerPanelClassName="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
          variant="full-width"
        >
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Please Login</h2>
              <p className="text-gray-600 mb-4">You need to be logged in to access messages.</p>
              <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Home
              </button>
            </div>
          </div>
        </ThreePanelLayout>
      );
    }

    // Main messenger interface
    return (
      <ThreePanelLayout
        pageTitle="💬 Messenger"
        leftPanelTitle="🌟 Community Highlights"
        rightPanelTitle="💡 Active Contacts"
        centerPanelWidth="800px"
        headerGradient="from-indigo-600 via-purple-600 to-pink-800"
        centerPanelClassName="bg-transparent"
        variant="full-width"
        showPageHeader={false}
      >
        {/* Connection Status - Properly positioned */}
        {hasAttemptedConnection && isConnecting && (
          <div className="absolute top-6 right-6 z-30 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm opacity-90">
            🔄 Connecting...
          </div>
        )}
        {hasAttemptedConnection && !isConnected && !isConnecting && (
          <div className="absolute top-6 right-6 z-30 bg-gray-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm opacity-80">
            📱 Offline mode
          </div>
        )}

        {/* Messenger Modal-like Container */}
        <div className="relative w-full" style={{ height: 'calc(100vh - 250px)' }}>
          <div className="h-full bg-white rounded-2xl shadow-2xl border-2 border-gray-300 overflow-hidden backdrop-blur-md">
            {/* Messenger Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Messenger</h1>
                    <p className="text-blue-100 text-sm">Stay connected with your network</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  {isConnected && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Live</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Chat Interface */}
            <div className="h-full flex" style={{ height: 'calc(100% - 80px)' }}>
              {/* Conversation Sidebar */}
              <div className="w-80 border-r border-gray-200 bg-gray-50">
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversation?.conversation_id}
                  onConversationSelect={handleConversationSelect}
                  onNewChat={() => setShowNewChatModal(true)}
                  onNewGroup={() => setShowNewGroupModal(true)}
                  loading={loading}
                  currentUserId={currentUser?.user_id}
                />
              </div>

              {/* Chat Window Area */}
              <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-white to-gray-50">
                {activeConversation ? (
                  <ChatWindow
                    conversation={activeConversation}
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onSendFile={handleSendFile}
                    onReaction={handleReaction}
                    onRemoveReaction={handleRemoveReaction}
                    onMarkAsRead={handleMarkAsReadWithWS}
                    onLoadMoreMessages={handleLoadMoreMessages}
                    typingUsers={typingUsers}
                    isConnected={isConnected}
                    loading={messagesLoading}
                    hasMoreMessages={hasMoreMessages}
                    isInitialLoad={isInitialLoad}
                    currentUserId={currentUser?.user_id}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-8">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Messenger</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">Select a conversation from the sidebar to start messaging, or create a new conversation to connect with your network.</p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => setShowNewChatModal(true)}
                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Start New Chat
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Overlays */}
          {showNewChatModal && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4">
                <NewChatModal
                  onClose={() => setShowNewChatModal(false)}
                  onCreateConversation={handleCreateDirectConversation as any}
                  isGroup={false}
                />
              </div>
            </div>
          )}

          {showNewGroupModal && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4">
                <NewChatModal
                  onClose={() => setShowNewGroupModal(false)}
                  onCreateConversation={handleCreateGroupConversation as any}
                  isGroup={true}
                />
              </div>
            </div>
          )}
        </div>
      </ThreePanelLayout>
    );
  };

  return renderContent();
};

export default MessengerPage;