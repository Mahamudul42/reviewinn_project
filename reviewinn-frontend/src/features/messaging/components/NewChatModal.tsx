import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Users, User as UserIcon, MessageSquare, Plus, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { userService } from '../../../api/services/userService';
import type { User } from '../../../types';
import type { ProfessionalUser } from '../../../api/services/professionalMessagingService';

interface NewChatModalProps {
  onClose: () => void;
  onCreateConversation: ((user: ProfessionalUser, initialMessage: string) => void) | ((participants: ProfessionalUser[], groupName: string, groupDescription?: string) => void);
  isGroup?: boolean;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  onClose,
  onCreateConversation,
  isGroup = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'search' | 'details'>('search');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Manage body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
    };
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery || !searchQuery.trim() || searchQuery.trim().length < 2) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery.length < 2) {
          setSearchResults([]);
          setLoading(false);
          return;
        }
        
        const response = await userService.searchUsers(trimmedQuery, { limit: 10 });
        setSearchResults(response.users || []);
      } catch (error) {
        console.error('Failed to search users:', error);
        console.error('Search query was:', `"${searchQuery}"`, 'trimmed:', `"${searchQuery.trim()}"`);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleUserSelect = (user: User) => {
    if (isGroup) {
      setSelectedUsers(prev => {
        const isSelected = prev.some(u => u.id === user.id);
        if (isSelected) {
          return prev.filter(u => u.id !== user.id);
        } else {
          return [...prev, user];
        }
      });
    } else {
      // For direct messages, proceed to details immediately
      setSelectedUsers([user]);
      setStep('details');
    }
  };

  // Convert User to ProfessionalUser
  const convertToProfessionalUser = (user: User): ProfessionalUser => ({
    user_id: parseInt(user.id),
    username: user.username || '',
    name: user.name || user.username || '',
    avatar: user.avatar,
    is_online: false,
    status: 'offline'
  });

  const handleCreateConversation = () => {
    if (isGroup) {
      if (selectedUsers.length === 0 || !groupName.trim()) return;
      
      const professionalUsers = selectedUsers.map(convertToProfessionalUser);
      (onCreateConversation as any)(professionalUsers, groupName.trim(), groupDescription.trim() || undefined);
    } else {
      if (selectedUsers.length === 0 || !initialMessage.trim()) return;
      
      const professionalUser = convertToProfessionalUser(selectedUsers[0]);
      (onCreateConversation as any)(professionalUser, initialMessage.trim());
    }
  };

  const canProceed = () => {
    if (step === 'search') {
      return isGroup ? selectedUsers.length > 0 : selectedUsers.length === 1;
    } else {
      return isGroup 
        ? groupName.trim() !== ''
        : initialMessage.trim() !== '';
    }
  };

  const handleNext = () => {
    if (step === 'search' && canProceed()) {
      setStep('details');
    } else if (step === 'details' && canProceed()) {
      handleCreateConversation();
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('search');
    }
  };

  const backdropStyles = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
    pointerEvents: 'auto' as const,
    padding: '40px 20px',
    boxSizing: 'border-box' as const,
    overflowY: 'auto' as const,
  };

  const contentStyles = {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    minWidth: '400px',
    maxWidth: '500px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    maxHeight: 'calc(100vh - 80px)',
    overflow: 'hidden',
    marginTop: '20px',
    position: 'relative' as const,
  };

  return createPortal(
    <div
      style={backdropStyles}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={contentStyles}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '28px 32px 20px 32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              {step === 'search' ? (
                isGroup ? <Users style={{ width: '24px', height: '24px', color: '#ffffff' }} /> 
                        : <MessageSquare style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              ) : (
                isGroup ? <Plus style={{ width: '24px', height: '24px', color: '#ffffff' }} />
                        : <Send style={{ width: '24px', height: '24px', color: '#ffffff' }} />
              )}
            </div>
            <div>
              <h2 style={{ 
                fontWeight: 700, 
                fontSize: 24, 
                color: '#ffffff',
                margin: 0,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}>
                {step === 'search' 
                  ? (isGroup ? 'New Group Chat' : 'New Message')
                  : (isGroup ? 'Group Details' : 'Send Message')
                }
              </h2>
              <p style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.9)', 
                margin: '4px 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles style={{ width: '14px', height: '14px' }} />
                {step === 'search' 
                  ? (isGroup ? `Search and select users • ${selectedUsers.length} selected` : 'Find someone to message')
                  : (isGroup ? 'Set up your new group' : 'Write your message')
                }
              </p>
            </div>
          </div>
          
          <button
            style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 20,
              fontWeight: 400,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
              position: 'relative'
            }}
            onClick={onClose}
            aria-label="Close"
            onMouseOver={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden', 
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          position: 'relative'
        }}>
          {/* Subtle background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23e2e8f0" fill-opacity="0.3"%3E%3Cpath d="M0 0h80v80H0z" fill="none"/%3E%3Cpath d="M20 20h40v40H20z" fill="none"/%3E%3Cpath d="M40 20v40M20 40h40" stroke="%23e2e8f0" stroke-width="0.5" stroke-opacity="0.3"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.15
          }} />

          {step === 'search' ? (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Search Section */}
              <div style={{ padding: '32px 32px 24px 32px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)' }}>
                <div style={{ 
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '16px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Search size={20} style={{ 
                    position: 'absolute', 
                    left: '16px', 
                    top: '16px', 
                    color: '#64748b',
                    zIndex: 1
                  }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search for people by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '48px',
                      paddingRight: '16px',
                      paddingTop: '16px',
                      paddingBottom: '16px',
                      border: 'none',
                      borderRadius: '16px',
                      fontSize: '16px',
                      background: 'transparent',
                      outline: 'none',
                      color: '#1e293b',
                      fontWeight: '500'
                    }}
                  />
                </div>
              </div>

              {/* Selected Users (for groups) */}
              {isGroup && selectedUsers.length > 0 && (
                <div style={{ 
                  padding: '24px 32px', 
                  borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    color: '#1e293b',
                    margin: '0 0 16px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Selected Members ({selectedUsers.length})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {selectedUsers.map((user) => (
                      <div
                        key={user.user_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: '#4338ca',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=24`}
                          alt={user.name}
                          style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                        />
                        <span>{user.name}</span>
                        <button
                          onClick={() => handleUserSelect(user)}
                          style={{
                            color: '#4338ca',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={e => {
                            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                          }}
                          onMouseOut={e => {
                            e.currentTarget.style.background = 'none';
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
                {loading ? (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '60px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid rgba(99, 102, 241, 0.1)',
                      borderTop: '3px solid #6366f1',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div style={{ padding: '24px 32px' }}>
                    {searchResults.map((user) => {
                      const isSelected = selectedUsers.some(u => u.id === user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={() => handleUserSelect(user)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            marginBottom: '12px',
                            background: isSelected 
                              ? 'rgba(99, 102, 241, 0.1)' 
                              : 'rgba(255, 255, 255, 0.9)',
                            border: isSelected 
                              ? '2px solid rgba(99, 102, 241, 0.4)' 
                              : '1px solid rgba(148, 163, 184, 0.2)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            textAlign: 'left',
                            backdropFilter: 'blur(10px)',
                            boxShadow: isSelected 
                              ? '0 8px 25px rgba(99, 102, 241, 0.15)' 
                              : '0 4px 16px rgba(0, 0, 0, 0.05)'
                          }}
                          onMouseOver={e => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                            }
                          }}
                          onMouseOut={e => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05)';
                            }
                          }}
                        >
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=48`}
                            alt={user.name}
                            style={{ 
                              width: '48px', 
                              height: '48px', 
                              borderRadius: '12px', 
                              objectFit: 'cover',
                              border: '2px solid rgba(255, 255, 255, 0.8)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ 
                              fontWeight: 600, 
                              color: '#1e293b', 
                              margin: 0,
                              fontSize: '16px',
                              lineHeight: '1.2'
                            }}>
                              {user.name}
                            </p>
                            <p style={{ 
                              fontSize: '14px', 
                              color: '#64748b', 
                              margin: '4px 0 0 0',
                              lineHeight: '1.2'
                            }}>
                              @{user.username}
                            </p>
                          </div>
                          {isGroup && isSelected && (
                            <div style={{
                              width: '24px',
                              height: '24px',
                              background: '#6366f1',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                            }}>
                              <svg style={{ width: '14px', height: '14px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : searchQuery.trim() ? (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '60px 32px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <UserIcon size={64} style={{ color: '#cbd5e1', marginBottom: '24px' }} />
                    <h3 style={{ 
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#475569',
                      margin: '0 0 8px 0'
                    }}>
                      No users found
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      Try a different search term or check the spelling
                    </p>
                  </div>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '60px 32px',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <Search size={64} style={{ color: '#cbd5e1', marginBottom: '24px' }} />
                    <h3 style={{ 
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#475569',
                      margin: '0 0 8px 0'
                    }}>
                      Search for people
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      Enter a name or username to get started
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Details Step */
            <div style={{ padding: '32px', flex: 1, overflowY: 'auto', position: 'relative' }}>
              {isGroup ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Group Name */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1e293b', 
                      marginBottom: '8px' 
                    }}>
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name..."
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '16px',
                        fontSize: '16px',
                        outline: 'none',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                      }}
                      maxLength={100}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05)';
                      }}
                    />
                  </div>

                  {/* Group Description */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1e293b', 
                      marginBottom: '8px' 
                    }}>
                      Description (optional)
                    </label>
                    <textarea
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      placeholder="What's this group about?"
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '16px',
                        fontSize: '16px',
                        outline: 'none',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        resize: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                        minHeight: '80px'
                      }}
                      rows={3}
                      maxLength={500}
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05)';
                      }}
                    />
                  </div>

                  {/* Selected Members */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1e293b', 
                      marginBottom: '16px' 
                    }}>
                      Members ({selectedUsers.length})
                    </label>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px', 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '16px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      padding: '16px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                    }}>
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            background: 'rgba(248, 250, 252, 0.8)',
                            borderRadius: '12px',
                            border: '1px solid rgba(226, 232, 240, 0.5)'
                          }}
                        >
                          <img
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=40`}
                            alt={user.name}
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '10px', 
                              objectFit: 'cover',
                              border: '2px solid rgba(255, 255, 255, 0.8)'
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <p style={{ 
                              fontSize: '15px', 
                              fontWeight: 600, 
                              color: '#1e293b', 
                              margin: 0,
                              lineHeight: '1.2'
                            }}>
                              {user.name}
                            </p>
                            <p style={{ 
                              fontSize: '13px', 
                              color: '#64748b', 
                              margin: '2px 0 0 0',
                              lineHeight: '1.2'
                            }}>
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Selected User */}
                  {selectedUsers[0] && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '20px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '16px',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                    }}>
                      <img
                        src={selectedUsers[0].avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUsers[0].name)}&size=56`}
                        alt={selectedUsers[0].name}
                        style={{ 
                          width: '56px', 
                          height: '56px', 
                          borderRadius: '14px', 
                          objectFit: 'cover',
                          border: '3px solid rgba(255, 255, 255, 0.8)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <div>
                        <p style={{ 
                          fontWeight: 700, 
                          color: '#1e293b', 
                          margin: 0,
                          fontSize: '18px',
                          lineHeight: '1.2'
                        }}>
                          {selectedUsers[0].name}
                        </p>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#64748b', 
                          margin: '4px 0 0 0',
                          lineHeight: '1.2'
                        }}>
                          @{selectedUsers[0].username}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Initial Message */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1e293b', 
                      marginBottom: '8px' 
                    }}>
                      Message *
                    </label>
                    <textarea
                      value={initialMessage}
                      onChange={(e) => setInitialMessage(e.target.value)}
                      placeholder="Write your message..."
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: '16px',
                        fontSize: '16px',
                        outline: 'none',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(10px)',
                        resize: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                        minHeight: '120px'
                      }}
                      rows={4}
                      autoFocus
                      onFocus={e => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                      }}
                      onBlur={e => {
                        e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.3)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.05)';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '24px 32px', 
          borderTop: '1px solid rgba(148, 163, 184, 0.2)', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          position: 'relative'
        }}>
          <div>
            {step === 'details' && (
              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  color: '#64748b',
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '14px',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
              >
                <ArrowLeft style={{ width: '16px', height: '16px' }} />
                Back
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                color: '#64748b',
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: '500',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                background: canProceed() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'rgba(148, 163, 184, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: canProceed() 
                  ? '0 4px 16px rgba(102, 126, 234, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={e => {
                if (canProceed()) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseOut={e => {
                if (canProceed()) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              {step === 'search' ? (
                <>
                  {isGroup ? 'Next' : 'Next'}
                  <ArrowLeft style={{ width: '16px', height: '16px', transform: 'rotate(180deg)' }} />
                </>
              ) : (
                <>
                  {isGroup ? 'Create Group' : 'Send Message'}
                  {isGroup ? <Plus style={{ width: '16px', height: '16px' }} /> : <Send style={{ width: '16px', height: '16px' }} />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NewChatModal;