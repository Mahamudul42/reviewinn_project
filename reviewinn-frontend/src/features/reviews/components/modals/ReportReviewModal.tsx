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
        <div style={{ padding: '40px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: 'red' }}>
          MODAL TEST - CAN YOU SEE THIS?
          <br />
          <button onClick={handleClose} style={{ fontSize: '18px', padding: '10px 20px', marginTop: '20px' }}>
            CLOSE MODAL
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReportReviewModal;