import React, { useState, useEffect } from 'react';
import { Modal, ConfirmationModal } from '../../../shared/design-system/components/Modal';
import { colors } from '../../../shared/design-system/colors';
import { Button } from '../../../shared/design-system/components/Button';
import { Input } from '../../../shared/design-system/components/Input';
import { 
  User, 
  Mail, 
  MapPin, 
  Link as LinkIcon, 
  Image, 
  FileText,
  Save,
  X,
  Upload,
  Camera,
  Trash2
} from 'lucide-react';
import type { UserProfile } from '../../../types';
import EntityImageUpload from '../../entities/components/EntityImageUpload';
import { imgbbService, UploadType } from '../../../api/services/imgbbService';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSave: (updatedProfile: Partial<UserProfile>) => Promise<void>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSave
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    username: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    avatar: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userProfile && isOpen) {
      console.log('📝 EditProfileModal - Setting form data with userProfile:', userProfile);
      console.log('📝 EditProfileModal - firstName:', userProfile.firstName, 'lastName:', userProfile.lastName);
      
      // If firstName/lastName are not set, try to parse from name field
      let firstName = userProfile.firstName || '';
      let lastName = userProfile.lastName || '';
      
      // If firstName and lastName are empty but name exists, try to split name
      if (!firstName && !lastName && userProfile.name) {
        const nameParts = userProfile.name.trim().split(' ');
        if (nameParts.length >= 2) {
          firstName = nameParts[0];
          lastName = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
        }
      }
      
      setFormData({
        firstName,
        lastName,
        name: userProfile.name || '',
        username: userProfile.username || '',
        email: userProfile.email || '',
        bio: userProfile.bio || '',
        location: userProfile.location || '',
        website: userProfile.website || '',
        avatar: userProfile.avatar || ''
      });
    }
  }, [userProfile, isOpen]);

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      avatar: imageUrl
    }));
    setShowImageUpload(false);
  };

  const handleRemovePhoto = () => {
    setShowDeleteConfirmation(true);
  };

  const confirmRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      avatar: ''
    }));
    setShowDeleteConfirmation(false);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Display name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrors({});
      
      // Create updated profile data - include all fields to ensure consistency
      const updatedFields: Partial<UserProfile> = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        name: formData.name,
        username: formData.username || undefined,
        email: formData.email,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        website: formData.website || undefined,
        avatar: formData.avatar || undefined
      };

      // Remove undefined values
      Object.keys(updatedFields).forEach(key => {
        if (updatedFields[key as keyof typeof updatedFields] === undefined) {
          delete updatedFields[key as keyof typeof updatedFields];
        }
      });

      console.log('Saving profile data:', updatedFields);
      console.log('Form data before save:', formData);
      
      await onSave(updatedFields);
      console.log('Profile saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile. Please try again.';
      setErrors({ general: errorMessage });
      
      // Don't close the modal on error so user can see the error and retry
    } finally {
      setIsLoading(false);
    }
  };

  if (showImageUpload) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="auth"
        title="Change Profile Photo"
        className="max-h-[90vh]"
      >
        <div className="p-6">
          <EntityImageUpload
            onImageUpload={handleImageUpload}
            currentImage={formData.avatar}
            entityName={formData.firstName && formData.lastName 
              ? `${formData.firstName} ${formData.lastName}` 
              : formData.name || 'User'}
            entityType="person"
            maxFileSize={5}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
            uploadType={UploadType.USER}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowImageUpload(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="auth"
      title="Edit Profile"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-8 p-6">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative group">
            <div className="rounded-full overflow-hidden bg-gradient-to-br from-violet-100 via-blue-100 to-cyan-100 border-4 border-white shadow-2xl flex-shrink-0" style={{ width: '80px', height: '80px' }}>
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Profile photo"
                  className="object-cover"
                  style={{ width: '80px', height: '80px', maxWidth: '80px', maxHeight: '80px' }}
                />
              ) : (
                <div className="flex items-center justify-center text-gray-400" style={{ width: '80px', height: '80px' }}>
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>
            
            {/* Photo Action Buttons - Centered below photo */}
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowImageUpload(true)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full p-3 shadow-xl border-2 border-white hover:border-gray-100 transition-all duration-300 hover:scale-110"
                title="Change photo"
              >
                <Camera className="w-5 h-5 text-white drop-shadow-sm" />
              </button>
              {formData.avatar && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full p-3 shadow-xl border-2 border-white hover:border-gray-100 transition-all duration-300 hover:scale-110"
                  title="Remove photo"
                >
                  <Trash2 className="w-5 h-5 text-white drop-shadow-sm" />
                </button>
              )}
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-base font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Profile Photo</p>
            <p className="text-sm text-gray-600 font-medium">Click camera to upload a new photo</p>
          </div>
        </div>

        {/* Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              placeholder="Enter your first name"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.firstName}
            />
            
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              placeholder="Enter your last name"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.lastName}
            />
            
            <Input
              label="Display Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="How should people see your name?"
              leftIcon={<User className="w-4 h-4" />}
              required
              error={errors.name}
            />
            
            <Input
              label="Username"
              value={formData.username}
              onChange={handleInputChange('username')}
              placeholder="Choose a unique username"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.username}
            />
          </div>
          
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange('email')}
              placeholder="Enter your email address"
              leftIcon={<Mail className="w-4 h-4" />}
              required
              error={errors.email}
            />
            
            <Input
              label="Location"
              value={formData.location}
              onChange={handleInputChange('location')}
              placeholder="City, Country"
              leftIcon={<MapPin className="w-4 h-4" />}
              error={errors.location}
            />
            
            <Input
              label="Website"
              value={formData.website}
              onChange={handleInputChange('website')}
              placeholder="https://yourwebsite.com"
              leftIcon={<LinkIcon className="w-4 h-4" />}
              error={errors.website}
            />
          </div>
        </div>

        {/* Bio Section */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            <FileText className="w-4 h-4 inline mr-2" />
            About You
          </label>
          <textarea
            value={formData.bio}
            onChange={handleInputChange('bio')}
            placeholder="Tell the community about yourself, your interests, expertise, or anything you'd like to share..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none text-gray-700"
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              Share your story, expertise, or what makes you unique
            </p>
            <p className="text-sm text-gray-500">
              {formData.bio.length}/500
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-8 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl font-bold transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving Changes...' : 'Save Profile'}
          </button>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={confirmRemovePhoto}
        title="Remove Profile Photo"
        message="Are you sure you want to remove your profile photo? This action cannot be undone."
        confirmText="Remove Photo"
        cancelText="Keep Photo"
        variant="destructive"
      />
    </Modal>
  );
};

export default EditProfileModal;