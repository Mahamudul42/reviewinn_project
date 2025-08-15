import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bell, BellOff, MessageCircle, ThumbsUp, Eye } from 'lucide-react';
import type { Review, Entity } from '../../../../types';

interface NotificationToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  entity?: Entity;
  onToggleNotifications: (settings: NotificationSettings) => Promise<void>;
}

interface NotificationSettings {
  newComments: boolean;
  newReactions: boolean;
  reviewUpdates: boolean;
  entityUpdates: boolean;
}

const NotificationToggleModal: React.FC<NotificationToggleModalProps> = ({
  isOpen,
  onClose,
  review,
  entity,
  onToggleNotifications
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    newComments: true,
    newReactions: true,
    reviewUpdates: false,
    entityUpdates: false,
  });
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

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await onToggleNotifications(settings);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification settings');
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

  const hasAnyEnabled = Object.values(settings).some(Boolean);

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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {hasAnyEnabled ? (
                <Bell className="w-5 h-5 text-blue-600" />
              ) : (
                <BellOff className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
              <p className="text-sm text-gray-600">Choose what to be notified about</p>
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
          {/* Review Preview */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">
                  {review.reviewerName?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Review by {review.reviewerName || 'Anonymous'}
                </p>
                {entity && (
                  <p className="text-sm text-gray-600">
                    About {entity.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notification Options */}
          <div className="space-y-4 mb-6">
            <h3 className="text-sm font-medium text-gray-900">Get notified when:</h3>
            
            {/* New Comments */}
            <div className="flex items-start gap-3">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={settings.newComments}
                  onChange={() => handleToggle('newComments')}
                  disabled={isSubmitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-900 cursor-pointer">
                    New comments are added
                  </label>
                  <p className="text-xs text-gray-600">
                    Get notified when someone comments on this review
                  </p>
                </div>
              </div>
            </div>

            {/* New Reactions */}
            <div className="flex items-start gap-3">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={settings.newReactions}
                  onChange={() => handleToggle('newReactions')}
                  disabled={isSubmitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-start gap-3">
                <ThumbsUp className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-900 cursor-pointer">
                    New reactions are added
                  </label>
                  <p className="text-xs text-gray-600">
                    Get notified when someone reacts to this review
                  </p>
                </div>
              </div>
            </div>

            {/* Review Updates */}
            <div className="flex items-start gap-3">
              <div className="flex items-center h-6">
                <input
                  type="checkbox"
                  checked={settings.reviewUpdates}
                  onChange={() => handleToggle('reviewUpdates')}
                  disabled={isSubmitting}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <label className="text-sm font-medium text-gray-900 cursor-pointer">
                    Review is updated
                  </label>
                  <p className="text-xs text-gray-600">
                    Get notified if the author updates this review
                  </p>
                </div>
              </div>
            </div>

            {/* Entity Updates */}
            {entity && (
              <div className="flex items-start gap-3">
                <div className="flex items-center h-6">
                  <input
                    type="checkbox"
                    checked={settings.entityUpdates}
                    onChange={() => handleToggle('entityUpdates')}
                    disabled={isSubmitting}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded text-xs flex items-center justify-center mt-0.5">
                    {entity.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900 cursor-pointer">
                      New reviews for {entity.name}
                    </label>
                    <p className="text-xs text-gray-600">
                      Get notified when new reviews are posted for this entity
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2">
              {hasAnyEnabled ? (
                <Bell className="w-4 h-4 text-blue-600" />
              ) : (
                <BellOff className="w-4 h-4 text-gray-600" />
              )}
              <p className="text-sm font-medium text-gray-900">
                {hasAnyEnabled 
                  ? `You'll receive ${Object.values(settings).filter(Boolean).length} type(s) of notifications`
                  : 'No notifications will be sent'
                }
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
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationToggleModal;