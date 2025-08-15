import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Review } from '../../../../types';

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  onReport: (reason: string, description: string) => Promise<void>;
}

const REPORT_REASONS = [
  { value: 'inappropriate', label: 'Inappropriate Content', description: 'Contains offensive or inappropriate material' },
  { value: 'spam', label: 'Spam', description: 'This review appears to be spam or promotional content' },
  { value: 'fake', label: 'Fake Review', description: 'This review appears to be fake or fraudulent' },
  { value: 'harassment', label: 'Harassment', description: 'Contains harassment or bullying content' },
  { value: 'copyright', label: 'Copyright Violation', description: 'Contains copyrighted material used without permission' },
  { value: 'other', label: 'Other', description: 'Other reason not listed above' }
];

const ReportReviewModal: React.FC<ReportReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  onReport
}) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      setError('Please select a reason for reporting');
      return;
    }

    if (selectedReason === 'other' && !description.trim()) {
      setError('Please provide a description for the report');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reportReason = REPORT_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
      await onReport(reportReason, description);
      
      // Reset form and close modal
      setSelectedReason('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  console.log('🔍 ReportReviewModal render - isOpen:', isOpen);
  
  if (!isOpen) return null;

  console.log('🔍 ReportReviewModal: About to render portal');

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255,0,0,0.8)',
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div
        style={{
          background: 'yellow',
          border: '5px solid blue',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          minWidth: 400,
          maxWidth: 500,
          width: '100%',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'visible',
          position: 'relative',
          zIndex: 1000000,
        }}
      >
        {console.log('🔍 ReportReviewModal: Rendering modal content')}
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '20px 24px 12px 24px' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 20, color: '#222', margin: 0 }}>Report Review</h2>
            <p style={{ color: '#666', fontSize: 14, margin: '8px 0 0 0' }}>Help us keep the community safe</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
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
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px' }}>
          <form onSubmit={handleSubmit}>
          {/* Review Preview */}
          <div style={{ backgroundColor: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#dbeafe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#2563eb' }}>
                  {review.reviewerName?.charAt(0) || '?'}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  {review.reviewerName || 'Anonymous'}
                </p>
                <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {review.content}
                </p>
              </div>
            </div>
          </div>

          {/* Reason Selection */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 12 }}>
              Why are you reporting this review? *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REPORT_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    style={{ marginTop: 4 }}
                    disabled={isSubmitting}
                  />
                  <div>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{reason.label}</div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>{reason.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
              Additional Details {selectedReason === 'other' && '*'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Please provide additional context or details about your report..."
              rows={4}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, outline: 'none', opacity: isSubmitting ? 0.5 : 1 }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ef4444';
                e.target.style.boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
              <p style={{ fontSize: 14, color: '#dc2626' }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{ 
                flex: 1, 
                padding: '8px 16px', 
                fontSize: 14, 
                fontWeight: 500, 
                color: '#374151', 
                backgroundColor: 'white', 
                border: '1px solid #d1d5db', 
                borderRadius: 6, 
                cursor: 'pointer',
                opacity: isSubmitting ? 0.5 : 1,
                transition: 'background-color 0.2s' 
              }}
              onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'white')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedReason}
              style={{ 
                flex: 1, 
                padding: '8px 16px', 
                fontSize: 14, 
                fontWeight: 500, 
                color: 'white', 
                backgroundColor: '#dc2626', 
                border: 'none', 
                borderRadius: 6, 
                cursor: 'pointer',
                opacity: (isSubmitting || !selectedReason) ? 0.5 : 1,
                transition: 'background-color 0.2s' 
              }}
              onMouseEnter={(e) => !isSubmitting && selectedReason && (e.currentTarget.style.backgroundColor = '#b91c1c')}
              onMouseLeave={(e) => !isSubmitting && selectedReason && (e.currentTarget.style.backgroundColor = '#dc2626')}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportReviewModal;