import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, 
  MessageCircle, 
  Smile, 
  Paperclip, 
  Image as ImageIcon,
  Zap
} from 'lucide-react';
import type { UserProfile } from '../../../types';
import { professionalMessagingService } from '../../../api/services/professionalMessagingService';
import { useToast } from '../../../shared/components/ToastProvider';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  userProfile
}) => {
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickMessages] = useState([
    "Hi! I'd love to connect with you 👋",
    "Thanks for your amazing review! 🌟",
    "Would you like to collaborate? 🤝",
    "Your insights are really valuable! 💡",
    "Let's discuss this further 💬"
  ]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Manage body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'relative';
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [isOpen]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      showToast({
        type: 'error',
        title: 'Empty Message',
        message: 'Please enter a message before sending.',
        icon: '📝'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create or find conversation with the user
      const conversation = await professionalMessagingService.createOrGetDirectConversation(userProfile.id);
      
      // Send the message
      await professionalMessagingService.sendMessage(conversation.conversation_id, {
        content: message.trim(),
        message_type: 'text'
      });
      
      showToast({
        type: 'success',
        title: 'Message Sent! 🚀',
        message: `Your message has been sent to ${userProfile.name}.`,
        icon: '✅'
      });
      
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      showToast({
        type: 'error',
        title: 'Failed to Send',
        message: 'Could not send your message. Please try again.',
        icon: '⚠️'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickMessage = (quickMsg: string) => {
    setMessage(quickMsg);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  // Calculate the current viewport center dynamically
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(600, viewportHeight * 0.9);
  const modalWidth = Math.min(672, viewportWidth * 0.9); // Match middle panel max-w-2xl
  
  const centerTop = scrollTop + (viewportHeight / 2) - (modalHeight / 2);
  const centerLeft = scrollLeft + (viewportWidth / 2) - (modalWidth / 2);

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: Math.max(document.documentElement.scrollHeight, viewportHeight),
        zIndex: 99999,
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div style={{
        position: 'absolute',
        top: `${centerTop}px`,
        left: `${centerLeft}px`,
        width: `${modalWidth}px`,
        maxHeight: `${modalHeight}px`,
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid #eee', 
          padding: '20px 24px 12px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              padding: '8px', 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MessageCircle style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 20, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Send Message
              </span>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, margin: '4px 0 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Message {userProfile.name}
              </p>
            </div>
          </div>
          <button
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: 28, 
              fontWeight: 700, 
              background: 'none', 
              border: 'none', 
              borderRadius: 999, 
              width: 36, 
              height: 36, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onClick={onClose}
            aria-label="Close"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* User Preview */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            marginBottom: '8px'
          }}>
            <img
              src={userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name)}&background=random`}
              alt={userProfile.name}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 700, 
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {userProfile.name}
              </h3>
              {userProfile.username && (
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '14px', 
                  color: 'rgba(255, 255, 255, 0.9)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  @{userProfile.username}
                </p>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%',
                boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.3)'
              }} />
              <span style={{ 
                color: 'white', 
                fontSize: '12px', 
                fontWeight: 600,
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                Online
              </span>
            </div>
          </div>

          {/* Quick Messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: 600, 
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Zap style={{ width: '18px', height: '18px', color: '#f59e0b' }} />
              Quick Messages
            </h4>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr', 
              gap: '8px' 
            }}>
              {quickMessages.map((quickMsg, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(quickMsg)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {quickMsg}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ 
              margin: 0, 
              fontSize: '16px', 
              fontWeight: 600, 
              color: '#374151',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MessageCircle style={{ width: '18px', height: '18px' }} />
              Your Message
            </h4>
            
            <div style={{
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden',
              transition: 'border-color 0.2s ease'
            }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message here... (Ctrl+Enter to send)"
                rows={4}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: 'none',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  backgroundColor: '#fafafa'
                }}
                onFocus={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = '#667eea';
                }}
                onBlur={(e) => {
                  e.currentTarget.parentElement!.style.borderColor = '#e5e7eb';
                }}
              />
              
              {/* Message Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.color = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    <Smile style={{ width: '18px', height: '18px' }} />
                  </button>
                  <button
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.color = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    <Paperclip style={{ width: '18px', height: '18px' }} />
                  </button>
                  <button
                    style={{
                      padding: '8px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#6b7280',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.color = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    <ImageIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                </div>
                
                <span style={{ 
                  fontSize: '12px', 
                  color: '#9ca3af' 
                }}>
                  {message.length}/1000
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSubmitting}
            style={{
              padding: '12px 24px',
              background: message.trim() 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: message.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: message.trim() ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Sending...
              </>
            ) : (
              <>
                <Send style={{ width: '16px', height: '16px' }} />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default MessageModal;