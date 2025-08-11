import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, Loader2, AlertCircle, MessageSquare, Star, Eye } from 'lucide-react';
import type { Review } from '../../../types';
import { reviewService } from '../../../api/services/reviewService';
import { useToast } from '../../../shared/components/ToastProvider';

interface ReviewDeleteModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewDeleteModal: React.FC<ReviewDeleteModalProps> = ({
  review,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<'warning' | 'confirmation'>('warning');
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [understoodRisks, setUnderstoodRisks] = useState<boolean[]>([false, false, false]);

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('warning');
      setConfirmation('');
      setReason('');
      setError(null);
      setUnderstoodRisks([false, false, false]);
    }
  }, [isOpen]);

  const requiredConfirmation = `DELETE_REVIEW_${review.id.toUpperCase()}`;
  const isConfirmationValid = confirmation === requiredConfirmation;
  const allRisksUnderstood = understoodRisks.every(risk => risk);

  const handleRiskToggle = (index: number) => {
    setUnderstoodRisks(prev => {
      const newRisks = [...prev];
      newRisks[index] = !newRisks[index];
      return newRisks;
    });
  };

  const handleProceedToConfirmation = () => {
    if (!allRisksUnderstood) {
      setError('Please acknowledge all risks before proceeding');
      return;
    }
    setCurrentStep('confirmation');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConfirmationValid) {
      setError('Please type the exact confirmation text');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await reviewService.deleteReview(review.id);
      
      showToast({
        type: 'success',
        title: 'Review Deleted Successfully',
        message: `Your review has been permanently removed from the system.`,
        icon: Trash2
      });

      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error deleting review:', error);
      
      let errorMessage = 'Failed to delete review';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this review';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      showToast({
        type: 'error',
        title: 'Deletion Failed',
        message: errorMessage,
        icon: AlertCircle
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const risks = [
    {
      icon: AlertTriangle,
      title: 'All review data will be permanently lost',
      description: 'Title, content, ratings, pros, cons, images, and all associated metadata cannot be recovered.'
    },
    {
      icon: MessageSquare,
      title: 'Comments and reactions will be lost',
      description: `Any comments on this review and user reactions will be permanently removed from the system.`
    },
    {
      icon: Star,
      title: 'This action cannot be undone',
      description: 'There is no way to restore the review once it has been deleted from the system.'
    }
  ];

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        minWidth: 500,
        maxWidth: 600,
        width: '100%',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'hidden',
        position: 'fixed',
        top: '50vh',
        left: '50vw',
        transform: 'translate(-50%, -50%)',
        zIndex: 100000,
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid #eee', 
          padding: '20px 24px 12px 24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              padding: '8px', 
              backgroundColor: '#dc2626', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>Delete Review</span>
              <p style={{ color: '#666', fontSize: 14, margin: '4px 0 0 0' }}>
                {currentStep === 'warning' ? 'Please review the consequences' : 'Final confirmation required'}
              </p>
            </div>
          </div>
          <button
            style={{ 
              color: '#888', 
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
              justifyContent: 'center' 
            }}
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600
            }}>
              1
            </div>
            <div style={{
              flex: 1,
              height: '2px',
              backgroundColor: currentStep === 'confirmation' ? '#dc2626' : '#e5e7eb',
              transition: 'background-color 0.3s'
            }} />
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: currentStep === 'confirmation' ? '#dc2626' : '#e5e7eb',
              color: currentStep === 'confirmation' ? 'white' : '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.3s'
            }}>
              2
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px'
        }}>
          {/* Warning Step */}
          {currentStep === 'warning' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Review Information */}
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#991b1b',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Trash2 style={{ width: '18px', height: '18px' }} />
                  Review to be deleted
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, color: '#7f1d1d' }}>Title:</span>
                    <span style={{ color: '#991b1b', fontWeight: 600 }}>{review.title || 'Untitled'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, color: '#7f1d1d' }}>Rating:</span>
                    <span style={{ color: '#991b1b' }}>{review.overallRating}/5.0 ⭐</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, color: '#7f1d1d' }}>Entity:</span>
                    <span style={{ color: '#991b1b' }}>{review.entity?.name || 'Unknown'}</span>
                  </div>
                  {review.view_count && review.view_count > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 500, color: '#7f1d1d' }}>Views:</span>
                      <span style={{ color: '#991b1b', fontWeight: 600 }}>{review.view_count} views</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500, color: '#7f1d1d' }}>Created:</span>
                    <span style={{ color: '#991b1b' }}>
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risks Checklist */}
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#374151',
                  margin: '0 0 16px 0'
                }}>
                  Please acknowledge the following consequences:
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {risks.map((risk, index) => {
                    const Icon = risk.icon;
                    return (
                      <label
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: understoodRisks[index] ? '#fef3f2' : '#ffffff',
                          borderColor: understoodRisks[index] ? '#fca5a5' : '#e5e7eb',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={understoodRisks[index]}
                          onChange={() => handleRiskToggle(index)}
                          style={{
                            width: '18px',
                            height: '18px',
                            marginTop: '2px',
                            accentColor: '#dc2626'
                          }}
                          disabled={isLoading}
                        />
                        <Icon style={{
                          width: '20px',
                          height: '20px',
                          color: understoodRisks[index] ? '#dc2626' : '#9ca3af',
                          marginTop: '2px',
                          flexShrink: 0
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontWeight: 600,
                            color: understoodRisks[index] ? '#991b1b' : '#374151',
                            fontSize: '14px',
                            marginBottom: '4px'
                          }}>
                            {risk.title}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: understoodRisks[index] ? '#7f1d1d' : '#6b7280',
                            lineHeight: '1.4'
                          }}>
                            {risk.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#991b1b' }}>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'end', 
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedToConfirmation}
                  disabled={!allRisksUnderstood || isLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: allRisksUnderstood ? '#dc2626' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: allRisksUnderstood ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  I Understand, Proceed
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirmation' && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Final Warning */}
              <div style={{
                backgroundColor: '#fef2f2',
                border: '2px solid #dc2626',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <AlertTriangle style={{
                  width: '48px',
                  height: '48px',
                  color: '#dc2626',
                  margin: '0 auto 12px auto'
                }} />
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#991b1b',
                  margin: '0 0 8px 0'
                }}>
                  Final Warning
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#7f1d1d',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  You are about to permanently delete your review <strong>"{review.title || 'Untitled'}"</strong>.
                  This action cannot be undone and will remove all data forever.
                </p>
              </div>

              {/* Confirmation Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Type the following text exactly to confirm deletion:
                </label>
                <div style={{
                  backgroundColor: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px',
                  fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: '13px',
                  color: '#374151',
                  wordBreak: 'break-all'
                }}>
                  {requiredConfirmation}
                </div>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => {
                    setConfirmation(e.target.value);
                    if (error) setError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: error ? '2px solid #dc2626' : '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    transition: 'border-color 0.2s',
                    backgroundColor: isLoading ? '#f9fafb' : 'white'
                  }}
                  placeholder="Type the confirmation text here..."
                  disabled={isLoading}
                />
                {isConfirmationValid && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    </div>
                    <span style={{ fontSize: '13px', color: '#166534', fontWeight: 500 }}>
                      Confirmation text matches
                    </span>
                  </div>
                )}
              </div>

              {/* Reason Input */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Reason for deletion (optional but recommended):
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                    backgroundColor: isLoading ? '#f9fafb' : 'white'
                  }}
                  placeholder="Why are you deleting this review? (helps with audit trails)"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', color: '#991b1b' }}>{error}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'end', 
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep('warning')}
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !isConfirmationValid}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (isLoading || !isConfirmationValid) ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: (isLoading || !isConfirmationValid) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReviewDeleteModal;