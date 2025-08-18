import React, { useState } from 'react';
import { Users, Globe, Lock, Shield, Info, CheckCircle } from 'lucide-react';
import { Button } from '../../../shared/design-system/components/Button';
import ImageUpload from './ImageUpload';

interface GroupCreationFormProps {
  onSubmit: (data: GroupFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface GroupFormData {
  name: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  rules: string;
  profileImage: File | null;
  coverImage: File | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
}

const GroupCreationForm: React.FC<GroupCreationFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    rules: '',
    profileImage: null,
    coverImage: null,
    profileImageUrl: null,
    coverImageUrl: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [canSubmit, setCanSubmit] = useState(false);

  const categories = [
    { value: 'business', label: 'Business & Professional' },
    { value: 'technology', label: 'Technology & Innovation' },
    { value: 'education', label: 'Education & Learning' },
    { value: 'hobbies', label: 'Hobbies & Interests' },
    { value: 'health', label: 'Health & Fitness' },
    { value: 'food', label: 'Food & Dining' },
    { value: 'travel', label: 'Travel & Adventure' },
    { value: 'sports', label: 'Sports & Recreation' },
    { value: 'arts', label: 'Arts & Culture' },
    { value: 'lifestyle', label: 'Lifestyle & Community' },
    { value: 'other', label: 'Other' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Group name is required';
      } else if (formData.name.length < 3) {
        newErrors.name = 'Group name must be at least 3 characters';
      } else if (formData.name.length > 100) {
        newErrors.name = 'Group name must be less than 100 characters';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.length < 10) {
        newErrors.description = 'Description must be at least 10 characters';
      }

      if (!formData.category) {
        newErrors.category = 'Please select a category';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (
    type: 'profile' | 'cover',
    file: File | null,
    previewUrl: string | null
  ) => {
    if (type === 'profile') {
      setFormData(prev => ({
        ...prev,
        profileImage: file,
        profileImageUrl: previewUrl
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        coverImage: file,
        coverImageUrl: previewUrl
      }));
    }
  };

  const handleNext = () => {
    console.log('handleNext called on step:', currentStep);
    if (validateStep(currentStep)) {
      console.log('Validation passed, moving to step:', currentStep + 1);
      setCurrentStep(prev => prev + 1);
    } else {
      console.log('Validation failed on step:', currentStep);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSubmit called on step:', currentStep, 'canSubmit:', canSubmit);
    
    // Only allow submission on step 3 (final step) AND when explicitly allowed
    if (currentStep !== 3 || !canSubmit) {
      console.log('Form submission blocked - not on step 3 or not allowed to submit');
      return;
    }
    
    if (validateStep(currentStep)) {
      console.log('Form validation passed, submitting form');
      setCanSubmit(false); // Reset flag
      onSubmit(formData);
    } else {
      console.log('Form validation failed');
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Your Group</h2>
        <p className="text-gray-600 mt-2">Let's start with the basics</p>
      </div>

      {/* Group Name */}
      <div>
        <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
          Group Name *
        </label>
        <input
          type="text"
          id="groupName"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="What's your group called?"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={100}
        />
        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
        <p className="text-xs text-gray-500 mt-1">{formData.name.length}/100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what your group is about, its purpose, and what members can expect..."
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-colors ${
            errors.description ? 'border-red-300' : 'border-gray-300'
          }`}
          maxLength={1000}
        />
        {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description}</p>}
        <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
            errors.category ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customize Your Group</h2>
        <p className="text-gray-600 mt-2">Add photos and set privacy</p>
      </div>

      {/* Cover Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Cover Photo
        </label>
        <ImageUpload
          type="cover"
          currentImage={formData.coverImageUrl}
          onImageChange={(file, url) => handleImageChange('cover', file, url)}
          disabled={isLoading}
        />
      </div>

      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Group Profile Photo
        </label>
        <div className="flex items-start space-x-4">
          <ImageUpload
            type="profile"
            currentImage={formData.profileImageUrl}
            onImageChange={(file, url) => handleImageChange('profile', file, url)}
            disabled={isLoading}
          />
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-2">
              Choose a photo that represents your group. This will be visible in search results and member lists.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Privacy Settings *
        </label>
        <div className="space-y-3">
          <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="privacy"
              value="public"
              checked={formData.privacy === 'public'}
              onChange={(e) => handleInputChange('privacy', e.target.value)}
              className="mt-1 text-purple-600"
            />
            <Globe className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Public</div>
              <div className="text-sm text-gray-600">
                Anyone can find this group, see its members, and view posts
              </div>
            </div>
          </label>
          
          <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="privacy"
              value="private"
              checked={formData.privacy === 'private'}
              onChange={(e) => handleInputChange('privacy', e.target.value)}
              className="mt-1 text-purple-600"
            />
            <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Private</div>
              <div className="text-sm text-gray-600">
                Only members can see posts and the member list. People must request to join
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Group Guidelines</h2>
        <p className="text-gray-600 mt-2">Set rules to maintain a positive community</p>
      </div>

      {/* Group Rules */}
      <div>
        <label htmlFor="rules" className="block text-sm font-medium text-gray-700 mb-2">
          Group Rules & Guidelines
        </label>
        <textarea
          id="rules"
          value={formData.rules}
          onChange={(e) => handleInputChange('rules', e.target.value)}
          placeholder="Set guidelines for your group members (e.g., be respectful, stay on topic, no spam, provide helpful reviews)..."
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">{formData.rules.length}/2000 characters</p>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <h3 className="text-lg font-medium text-purple-900 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Group Preview
        </h3>
        
        <div className="bg-white rounded-lg p-4 border space-y-3">
          {/* Cover Image Preview */}
          {formData.coverImageUrl && (
            <div className="w-full h-32 rounded-lg overflow-hidden">
              <img
                src={formData.coverImageUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Group Info Preview */}
          <div className="flex items-start space-x-3">
            {formData.profileImageUrl ? (
              <img
                src={formData.profileImageUrl}
                alt="Profile preview"
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            )}
            
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{formData.name || 'Group Name'}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {formData.description || 'Group description will appear here...'}
              </p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-xs text-gray-500 flex items-center">
                  {formData.privacy === 'public' ? (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      Public Group
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Private Group
                    </>
                  )}
                </span>
                {formData.category && (
                  <span className="text-xs text-gray-500">
                    {categories.find(c => c.value === formData.category)?.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                step <= currentStep
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 mx-2 transition-all ${
                  step < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isLoading}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            {currentStep < 3 ? (
              <Button
                type="button"
                variant="purple"
                onClick={handleNext}
                disabled={isLoading}
                className="px-8"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="purple"
                disabled={isLoading}
                className="px-8"
                onClick={() => {
                  console.log('Create Group button clicked');
                  setCanSubmit(true);
                  // Use setTimeout to ensure the canSubmit flag is set before form submission
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const event = new Event('submit', { bubbles: true, cancelable: true });
                      form.dispatchEvent(event);
                    }
                  }, 0);
                }}
              >
                {isLoading ? 'Creating Group...' : 'Create Group'}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Tips Section */}
      {currentStep === 1 && (
        <div className="bg-blue-50 rounded-xl p-6 mt-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
            <Info className="w-5 h-5 mr-2" />
            Tips for Success
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Choose a clear, descriptive name that tells people what your group is about</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Write a detailed description that explains the group's purpose and benefits</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>Select the most relevant category to help people discover your group</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GroupCreationForm;