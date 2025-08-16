import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Check, 
  Star, 
  Shield, 
  UserPlus,
  Heart,
  Sparkles,
  Crown,
  Send
} from 'lucide-react';
import type { UserProfile, ReviewCircle } from '../../../types';
import { circleService } from '../../../api/services/circleService';
import { useToast } from '../../../shared/components/ToastProvider';

interface AddToCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

const AddToCircleModal: React.FC<AddToCircleModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  currentUser
}) => {
  const { showToast } = useToast();
  const [userCircles, setUserCircles] = useState<ReviewCircle[]>([]);
  const [selectedCircles, setSelectedCircles] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const loadUserCircles = useCallback(async () => {
    try {
      setIsLoading(true);
      const circles = await circleService.getUserCircles(currentUser.id);
      setUserCircles(circles.items || []);
    } catch (error) {
      console.error('Error loading user circles:', error);
      showToast({
        type: 'error',
        title: 'Failed to Load Circles',
        message: 'Could not load your circles. Please try again.',
        icon: '⚠️'
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.id, showToast]);

  // Load user's circles when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      loadUserCircles();
    }
  }, [isOpen, currentUser, loadUserCircles]);

  const toggleCircleSelection = (circleId: number) => {
    setSelectedCircles(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(circleId)) {
        newSelection.delete(circleId);
      } else {
        newSelection.add(circleId);
      }
      return newSelection;
    });
  };

  const handleAddToCircles = async () => {
    if (selectedCircles.size === 0) {
      showToast({
        type: 'error',
        title: 'No Circles Selected',
        message: 'Please select at least one circle to add the user to.',
        icon: '⚠️'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Send invitations to selected circles
      const promises = Array.from(selectedCircles).map(circleId =>
        circleService.inviteUserToCircle(circleId, userProfile.id)
      );
      
      await Promise.all(promises);
      
      showToast({
        type: 'success',
        title: 'Invitations Sent! 🎉',
        message: `${userProfile.name} has been invited to ${selectedCircles.size} circle(s).`,
        icon: '✅'
      });
      
      onClose();
      setSelectedCircles(new Set());
    } catch (error) {
      console.error('Error adding to circles:', error);
      showToast({
        type: 'error',
        title: 'Invitation Failed',
        message: 'Failed to send circle invitations. Please try again.',
        icon: '⚠️'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCircleIcon = (index: number) => {
    const icons = [Shield, Star, Crown, Heart, Sparkles];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5" />;
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
              <UserPlus style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 20, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Add to Circle
              </span>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, margin: '4px 0 0 0', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                Invite {userProfile.name} to join your circles
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
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
            <div>
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
          </div>

          {/* Circles List */}
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : userCircles.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6b7280'
            }}>
              <Users style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0' }}>No Circles Yet</h3>
              <p style={{ fontSize: '14px', margin: 0 }}>Create a circle to start inviting friends!</p>
            </div>
          ) : (
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
                <Users style={{ width: '18px', height: '18px' }} />
                Select Circles ({selectedCircles.size} selected)
              </h4>
              
              {userCircles.map((circle, index) => (
                <div
                  key={circle.id}
                  onClick={() => toggleCircleSelection(circle.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: '12px',
                    border: selectedCircles.has(circle.id) 
                      ? '2px solid #667eea' 
                      : '2px solid #e5e7eb',
                    backgroundColor: selectedCircles.has(circle.id) 
                      ? 'rgba(102, 126, 234, 0.05)' 
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: selectedCircles.has(circle.id) ? 'scale(1.02)' : 'scale(1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedCircles.has(circle.id)) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedCircles.has(circle.id)) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                    backgroundImage: `linear-gradient(135deg, rgb(102 126 234), rgb(118 75 162))`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    {getCircleIcon(index)}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h5 style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: '#1f2937' 
                    }}>
                      {circle.name}
                    </h5>
                    {circle.description && (
                      <p style={{ 
                        margin: '4px 0 0 0', 
                        fontSize: '14px', 
                        color: '#6b7280' 
                      }}>
                        {circle.description}
                      </p>
                    )}
                    <p style={{ 
                      margin: '4px 0 0 0', 
                      fontSize: '12px', 
                      color: '#9ca3af' 
                    }}>
                      {circle.member_count} members
                    </p>
                  </div>
                  
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: selectedCircles.has(circle.id) ? '2px solid #667eea' : '2px solid #d1d5db',
                    backgroundColor: selectedCircles.has(circle.id) ? '#667eea' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {selectedCircles.has(circle.id) && (
                      <Check style={{ width: '14px', height: '14px', color: 'white' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
            onClick={handleAddToCircles}
            disabled={selectedCircles.size === 0 || isSubmitting}
            style={{
              padding: '12px 24px',
              background: selectedCircles.size > 0 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: selectedCircles.size > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: selectedCircles.size > 0 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
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
                Send Invitations ({selectedCircles.size})
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

export default AddToCircleModal;