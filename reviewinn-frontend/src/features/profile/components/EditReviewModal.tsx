import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/design-system/components/Modal';
import { Button } from '../../../shared/design-system/components/Button';
import { Input } from '../../../shared/design-system/components/Input';
import { 
  Star, 
  FileText, 
  Plus,
  Minus,
  Save,
  X,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import type { Review } from '../../../types';

interface EditReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review;
  onSave: (updatedReview: Partial<Review>) => Promise<void>;
}

const EditReviewModal: React.FC<EditReviewModalProps> = ({
  isOpen,
  onClose,
  review,
  onSave
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    overallRating: 5,
    pros: [] as string[],
    cons: [] as string[],
    isAnonymous: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');

  useEffect(() => {
    if (review && isOpen) {
      setFormData({
        title: review.title || '',
        content: review.content || '',
        overallRating: review.overallRating || 5,
        pros: review.pros || [],
        cons: review.cons || [],
        isAnonymous: review.isAnonymous || false
      });
    }
  }, [review, isOpen]);

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      overallRating: rating
    }));
  };

  const addPro = () => {
    if (newPro.trim()) {
      setFormData(prev => ({
        ...prev,
        pros: [...prev.pros, newPro.trim()]
      }));
      setNewPro('');
    }
  };

  const addCon = () => {
    if (newCon.trim()) {
      setFormData(prev => ({
        ...prev,
        cons: [...prev.cons, newCon.trim()]
      }));
      setNewCon('');
    }
  };

  const removePro = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pros: prev.pros.filter((_, i) => i !== index)
    }));
  };

  const removeCon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cons: prev.cons.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Filter out unchanged fields
      const updatedFields: Partial<Review> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (JSON.stringify(value) !== JSON.stringify(review[key as keyof Review])) {
          (updatedFields as any)[key] = value;
        }
      });

      await onSave(updatedFields);
      onClose();
    } catch (error) {
      console.error('Error saving review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Edit Review"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6 p-6">
        {/* Rating Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Overall Rating
          </label>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleRatingChange(rating)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    rating <= formData.overallRating
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-lg font-semibold text-gray-700">
              {formData.overallRating}/5
            </span>
          </div>
        </div>

        {/* Title and Content */}
        <div className="space-y-4">
          <Input
            label="Review Title"
            value={formData.title}
            onChange={handleInputChange('title')}
            placeholder="Enter a title for your review"
            leftIcon={<FileText className="w-4 h-4" />}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Content
            </label>
            <textarea
              value={formData.content}
              onChange={handleInputChange('content')}
              placeholder="Share your detailed experience..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={2000}
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.content.length}/2000 characters
            </p>
          </div>
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pros */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <ThumbsUp className="w-4 h-4 inline mr-2 text-green-500" />
              Pros
            </label>
            <div className="space-y-2 mb-3">
              {formData.pros.map((pro, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                    {pro}
                  </div>
                  <button
                    onClick={() => removePro(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newPro}
                onChange={(e) => setNewPro(e.target.value)}
                placeholder="Add a pro..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addPro()}
              />
              <button
                onClick={addPro}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <ThumbsDown className="w-4 h-4 inline mr-2 text-red-500" />
              Cons
            </label>
            <div className="space-y-2 mb-3">
              {formData.cons.map((con, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="flex-1 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                    {con}
                  </div>
                  <button
                    onClick={() => removeCon(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newCon}
                onChange={(e) => setNewCon(e.target.value)}
                placeholder="Add a con..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addCon()}
              />
              <button
                onClick={addCon}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Anonymous Option */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.isAnonymous}
            onChange={handleInputChange('isAnonymous')}
            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-700">
            Post this review anonymously
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditReviewModal;