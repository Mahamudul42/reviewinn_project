import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import type { Review, ReviewFormData } from '../../../types';
import { reviewService } from '../../../api/services/reviewService';
import { useToast } from '../../../shared/components/ToastProvider';

interface ReviewEditModalProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedReview: Review) => void;
}

const ReviewEditModal: React.FC<ReviewEditModalProps> = ({
  review,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<Partial<ReviewFormData>>({
    title: review.title || '',
    comment: review.content || '',
    overallRating: review.overallRating || 5,
    ratings: review.ratings || {},
    pros: review.pros || [],
    cons: review.cons || [],
    images: review.images || [],
    isAnonymous: review.isAnonymous || false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setFormData({
        title: review.title || '',
        comment: review.content || '',
        overallRating: review.overallRating || 5,
        ratings: review.ratings || {},
        pros: review.pros || [],
        cons: review.cons || [],
        images: review.images || [],
        isAnonymous: review.isAnonymous || false,
      });
      setError(null);
    }
  }, [isOpen, review]);

  const handleInputChange = (field: keyof ReviewFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError(null);
  };

  const handleArrayAdd = (field: 'pros' | 'cons', value: string) => {
    if (!value.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
  };

  const handleArrayRemove = (field: 'pros' | 'cons', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.comment?.trim()) {
      setError('Review content is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const updatedReview = await reviewService.updateReview(review.id, formData);
      
      showToast({
        type: 'success',
        title: 'Review Updated Successfully',
        message: 'Your review has been updated.',
        icon: Edit3
      });

      onSuccess(updatedReview);
      onClose();
      
    } catch (error: any) {
      console.error('Error updating review:', error);
      
      let errorMessage = 'Failed to update review';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to edit this review';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      showToast({
        type: 'error',
        title: 'Update Failed',
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
        alignItems: 'center',
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
        maxWidth: 800,
        width: '100%',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
              backgroundColor: '#3b82f6', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Edit3 style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 20, color: '#222' }}>Edit Review</span>
              <p style={{ color: '#666', fontSize: 14, margin: '4px 0 0 0' }}>
                Update your review details
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

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          {/* Title */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Review Title *
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: isLoading ? '#f9fafb' : 'white'
              }}
              placeholder="Enter review title..."
              disabled={isLoading}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Content */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Review Content *
            </label>
            <textarea
              value={formData.comment || ''}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={6}
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
              placeholder="Write your review..."
              disabled={isLoading}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Overall Rating */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Overall Rating
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleInputChange('overallRating', star)}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    padding: '4px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '24px',
                      color: star <= (formData.overallRating || 0) ? '#fbbf24' : '#d1d5db'
                    }}
                  >
                    ★
                  </span>
                </button>
              ))}
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                {formData.overallRating || 0}/5
              </span>
            </div>
          </div>

          {/* Pros */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Pros
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(formData.pros || []).map((pro, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', flex: 1, padding: '8px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
                    {pro}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('pros', index)}
                    disabled={isLoading}
                    style={{
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <input
                type="text"
                placeholder="Add a pro (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleArrayAdd('pros', e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                disabled={isLoading}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Cons */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#374151',
              marginBottom: '8px'
            }}>
              Cons
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(formData.cons || []).map((con, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', flex: 1, padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                    {con}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleArrayRemove('cons', index)}
                    disabled={isLoading}
                    style={{
                      color: '#ef4444',
                      background: 'none',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <input
                type="text"
                placeholder="Add a con (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleArrayAdd('cons', e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                disabled={isLoading}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Anonymous Option */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.isAnonymous || false}
                onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                disabled={isLoading}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#3b82f6'
                }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                Post as anonymous
              </span>
            </label>
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
              type="submit"
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  Updating...
                </>
              ) : (
                <>
                  <Edit3 style={{ width: '16px', height: '16px' }} />
                  Update Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ReviewEditModal;