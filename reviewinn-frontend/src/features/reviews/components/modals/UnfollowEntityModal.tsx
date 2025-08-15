import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UserMinus, Heart, Bell, TrendingUp } from 'lucide-react';
import type { Entity } from '../../../../types';

interface UnfollowEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity;
  onUnfollow: () => Promise<void>;
}

const UnfollowEntityModal: React.FC<UnfollowEntityModalProps> = ({
  isOpen,
  onClose,
  entity,
  onUnfollow
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

  const handleUnfollow = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await onUnfollow();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unfollow entity');
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

  // Calculate the current viewport center dynamically
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const modalHeight = Math.min(400, viewportHeight * 0.9);
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
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
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
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        border: '1px solid rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <UserMinus className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Unfollow Entity</h2>
              <p className="text-sm text-gray-600">Stop receiving updates</p>
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
          {/* Entity Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
              {entity.imageUrl || entity.avatar ? (
                <img
                  src={entity.imageUrl || entity.avatar}
                  alt={entity.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-white">
                  {entity.name?.charAt(0) || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{entity.name}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                {entity.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {entity.averageRating && (
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    {entity.averageRating.toFixed(1)}
                  </span>
                )}
                {entity.reviewCount && (
                  <span>{entity.reviewCount} reviews</span>
                )}
                {entity.isVerified && (
                  <span className="text-blue-600">✓ Verified</span>
                )}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">
              Are you sure you want to unfollow {entity.name}?
            </h3>
            
            <div className="text-sm text-gray-600 space-y-3">
              <p>When you unfollow this entity, you will:</p>
              
              <div className="space-y-2 ml-2">
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Stop receiving notifications about new reviews and updates</span>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>No longer see this entity prioritized in your feed</span>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span>Remove this entity from your followed list</span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 mt-4">
                <p className="text-sm text-blue-800 font-medium">
                  💡 You can follow this entity again anytime from their profile page.
                </p>
              </div>
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
              Keep Following
            </button>
            <button
              onClick={handleUnfollow}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Unfollowing...' : 'Unfollow'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UnfollowEntityModal;