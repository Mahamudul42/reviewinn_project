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

  if (!isOpen) return null;

  // Calculate the current viewport center dynamically
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(600, viewportHeight * 0.9);
  const modalWidth = Math.min(500, viewportWidth * 0.9);
  
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
        zIndex: 999999,
        background: 'rgba(0,0,0,0.6)',
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div
        style={{
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
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)', 
          padding: '24px 24px 16px 24px',
          minHeight: '64px'
        }}>
          <div style={{ fontWeight: 600, fontSize: 18, color: '#1f2937', lineHeight: 1.4 }}>
            Report Review
          </div>
          <button
            style={{ 
              color: '#6b7280', 
              background: 'none', 
              border: 'none', 
              borderRadius: '6px', 
              width: 32, 
              height: 32, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              fontSize: '20px',
              fontWeight: 400
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
            onClick={handleClose}
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
        }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#666', fontSize: 14, margin: '0 0 20px 0' }}>
              Help us understand what's wrong with this review. Your report will be reviewed by our moderation team.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                Reason for reporting *
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white'
                }}
                disabled={isSubmitting}
              >
                <option value="">Select a reason...</option>
                <option value="spam">Spam or fake review</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="harassment">Harassment or hate speech</option>
                <option value="false">False or misleading information</option>
                <option value="duplicate">Duplicate review</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details about why you're reporting this review..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'vertical',
                  backgroundColor: isSubmitting ? '#f9fafb' : 'white'
                }}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '14px', color: '#991b1b' }}>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px 24px 24px',
          borderTop: '1px solid rgba(0, 0, 0, 0.1)',
          backgroundColor: '#f9fafb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              opacity: isSubmitting ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: (!selectedReason || isSubmitting) ? '#9ca3af' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: (!selectedReason || isSubmitting) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportReviewModal;