import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import type { Review } from '../../../../types';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  onBlock: () => Promise<void>;
}

const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isOpen,
  onClose,
  review,
  onBlock
}) => {
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

  const handleBlock = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await onBlock();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const userName = review.reviewerName || 'this user';

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
        padding: '20px',
        boxSizing: 'border-box',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        maxWidth: 500,
        width: '100%',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'auto',
        position: 'relative',
        zIndex: 100000,
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Block User</h2>
              <p className="text-sm text-gray-600">This action cannot be undone easily</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-blue-600">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">Author of this review</p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">
              Are you sure you want to block {userName}?
            </h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>When you block this user:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You won't see their reviews or comments</li>
                <li>They won't be able to see your profile or reviews</li>
                <li>They cannot send you messages or follow you</li>
                <li>Their existing reviews will be hidden from your feed</li>
              </ul>
              <p className="mt-3 font-medium text-gray-700">
                You can unblock them later from your settings if you change your mind.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Blocking...' : `Block ${userName}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BlockUserModal;