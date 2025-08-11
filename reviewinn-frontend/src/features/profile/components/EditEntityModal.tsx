import React, { useState, useEffect } from 'react';
import { Modal } from '../../../shared/design-system/components/Modal';
import { Button } from '../../../shared/design-system/components/Button';
import { Input } from '../../../shared/design-system/components/Input';
import { 
  Building2, 
  Tag, 
  FileText, 
  MapPin, 
  Link as LinkIcon, 
  Image,
  Save,
  X,
  Upload,
  Globe
} from 'lucide-react';
import type { Entity, EntityCategory } from '../../../types';

interface EditEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: Entity;
  onSave: (updatedEntity: Partial<Entity>) => Promise<void>;
}

const categoryOptions = [
  { value: 'professionals', label: 'Professionals' },
  { value: 'companies', label: 'Companies' },
  { value: 'places', label: 'Places' },
  { value: 'products', label: 'Products' }
];

const EditEntityModal: React.FC<EditEntityModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '' as EntityCategory,
    subcategory: '',
    location: '',
    website: '',
    avatar: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    if (entity && isOpen) {
      setFormData({
        name: entity.name || '',
        description: entity.description || '',
        category: entity.category || 'companies',
        subcategory: entity.subcategory || '',
        location: entity.location || '',
        website: entity.website || '',
        avatar: entity.avatar || ''
      });
      setAvatarPreview(entity.avatar || '');
    }
  }, [entity, isOpen]);

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setFormData(prev => ({
          ...prev,
          avatar: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Filter out unchanged fields
      const updatedFields: Partial<Entity> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== entity[key as keyof Entity]) {
          (updatedFields as any)[key] = value;
        }
      });

      await onSave(updatedFields);
      onClose();
    } catch (error) {
      console.error('Error saving entity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Edit Entity"
      className="max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6 p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Entity avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 cursor-pointer shadow-lg transition-colors">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-600">Click to upload entity image</p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Entity Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="Enter entity name"
              leftIcon={<Building2 className="w-4 h-4" />}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-2" />
                Category
              </label>
              <select
                value={formData.category}
                onChange={handleInputChange('category')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <Input
              label="Subcategory"
              value={formData.subcategory}
              onChange={handleInputChange('subcategory')}
              placeholder="e.g., Restaurant, Software Company"
              leftIcon={<Tag className="w-4 h-4" />}
            />
          </div>
          
          <div className="space-y-4">
            <Input
              label="Location"
              value={formData.location}
              onChange={handleInputChange('location')}
              placeholder="Enter location"
              leftIcon={<MapPin className="w-4 h-4" />}
            />
            
            <Input
              label="Website"
              value={formData.website}
              onChange={handleInputChange('website')}
              placeholder="https://example.com"
              leftIcon={<Globe className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Description Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder="Describe this entity..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {formData.description.length}/1000 characters
          </p>
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
            className="px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditEntityModal;