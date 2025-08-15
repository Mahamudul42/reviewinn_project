import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bookmark, BookmarkCheck, Star, Clock } from 'lucide-react';
import type { Review } from '../../../../types';

interface SaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  isCurrentlySaved: boolean;
  onSave: (collectionName?: string, tags?: string[]) => Promise<void>;
}

const COLLECTION_SUGGESTIONS = [
  { name: 'Favorites', icon: '⭐', description: 'Your favorite reviews' },
  { name: 'To Read Later', icon: '🔖', description: 'Reviews to revisit' },
  { name: 'Research', icon: '🔍', description: 'For research purposes' },
  { name: 'Recommendations', icon: '👍', description: 'Great recommendations' },
];

const TAG_SUGGESTIONS = [
  'helpful', 'detailed', 'honest', 'funny', 'informative', 'critical', 'positive', 'negative'
];

const SaveReviewModal: React.FC<SaveReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  isCurrentlySaved,
  onSave
}) => {
  const [selectedCollection, setSelectedCollection] = useState('Favorites');
  const [customCollection, setCustomCollection] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
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

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const collectionName = customCollection.trim() || selectedCollection;
      const tags = [...selectedTags];
      
      if (customTag.trim()) {
        tags.push(customTag.trim());
      }

      await onSave(collectionName, tags);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      await onSave(); // No parameters means unsave
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsave review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedCollection('Favorites');
      setCustomCollection('');
      setSelectedTags([]);
      setCustomTag('');
      setError('');
      onClose();
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
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
        maxWidth: 600,
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
              {isCurrentlySaved ? (
                <BookmarkCheck className="w-5 h-5 text-blue-600" />
              ) : (
                <Bookmark className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isCurrentlySaved ? 'Manage Saved Review' : 'Save Review'}
              </h2>
              <p className="text-sm text-gray-600">
                {isCurrentlySaved ? 'Update your save settings' : 'Organize your saved content'}
              </p>
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
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {review.reviewerName?.charAt(0) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {review.reviewerName || 'Anonymous'}
                  </p>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(review.overall_rating || 0)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {review.content}
                </p>
              </div>
            </div>
          </div>

          {!isCurrentlySaved ? (
            <>
              {/* Collection Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Save to Collection
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {COLLECTION_SUGGESTIONS.map((collection) => (
                    <label
                      key={collection.name}
                      className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="collection"
                        value={collection.name}
                        checked={selectedCollection === collection.name}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                        disabled={isSubmitting}
                      />
                      <span className="text-lg">{collection.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {collection.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {collection.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Or create a new collection..."
                    value={customCollection}
                    onChange={(e) => setCustomCollection(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tags (Optional)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      disabled={isSubmitting}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors disabled:opacity-50 ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom tag..."
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    disabled={isSubmitting}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    disabled={isSubmitting || !customTag.trim()}
                    className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          disabled={isSubmitting}
                          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <BookmarkCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Review Already Saved</h3>
              <p className="text-gray-600">
                This review is in your saved collection. You can remove it from your saved items.
              </p>
            </div>
          )}

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
            {isCurrentlySaved ? (
              <button
                onClick={handleUnsave}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Removing...' : 'Remove from Saved'}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save Review'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SaveReviewModal;