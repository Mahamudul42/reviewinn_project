import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  MapPin, 
  Building, 
  GraduationCap, 
  Heart,
  Globe,
  Lock,
  Shield
} from 'lucide-react';

import { Modal } from '../../../shared/design-system/components/Modal';
import { Button } from '../../../shared/design-system/components/Button';
import { Input } from '../../../shared/design-system/components/Input';

import { 
  Group, 
  GroupCreateRequest, 
  GroupType, 
  GroupVisibility, 
  GroupCategory 
} from '../types';
import { useGroupCreation } from '../hooks/useGroups';

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
  categories: GroupCategory[];
}

const GROUP_TYPES = [
  {
    value: GroupType.UNIVERSITY,
    label: 'University',
    description: 'Academic institutions and student communities',
    icon: GraduationCap,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    value: GroupType.COMPANY,
    label: 'Company',
    description: 'Professional organizations and workplaces',
    icon: Building,
    color: 'text-gray-600 bg-gray-50 border-gray-200'
  },
  {
    value: GroupType.LOCATION,
    label: 'Location',
    description: 'Location-based communities',
    icon: MapPin,
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  {
    value: GroupType.INTEREST_BASED,
    label: 'Interest',
    description: 'Hobby and interest communities',
    icon: Heart,
    color: 'text-pink-600 bg-pink-50 border-pink-200'
  }
];

const VISIBILITY_OPTIONS = [
  {
    value: GroupVisibility.PUBLIC,
    label: 'Public',
    description: 'Anyone can find and join this group',
    icon: Globe,
    color: 'text-green-600 bg-green-50 border-green-200'
  },
  {
    value: GroupVisibility.PRIVATE,
    label: 'Private',
    description: 'People need to request to join',
    icon: Lock,
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  },
  {
    value: GroupVisibility.INVITE_ONLY,
    label: 'Invite Only',
    description: 'Only invited members can join',
    icon: Shield,
    color: 'text-purple-600 bg-purple-50 border-purple-200'
  }
];

const GroupCreateModal: React.FC<GroupCreateModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
  categories
}) => {
  const { createGroup, loading, error } = useGroupCreation();
  
  const [formData, setFormData] = useState<GroupCreateRequest>({
    name: '',
    description: '',
    group_type: GroupType.INTEREST_BASED,
    visibility: GroupVisibility.PUBLIC,
    allow_public_reviews: true,
    require_approval_for_reviews: false,
    max_members: 1000,
    rules_and_guidelines: '',
    category_ids: []
  });

  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const handleInputChange = (field: keyof GroupCreateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => {
      const newSelection = prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
      
      handleInputChange('category_ids', newSelection);
      return newSelection;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const group = await createGroup(formData);
      onGroupCreated(group);
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const isStepValid = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return formData.name.trim().length >= 3;
      case 2:
        return true; // Type and visibility are always valid
      case 3:
        return true; // Categories are optional
      default:
        return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Group Name *
        </label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Enter a descriptive group name"
          className="w-full"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">
          {formData.name.length}/100 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe what your group is about, what you discuss, and what members can expect"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-gray-500 mt-1">
          {(formData.description || '').length}/1000 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Group Rules & Guidelines
        </label>
        <textarea
          value={formData.rules_and_guidelines || ''}
          onChange={(e) => handleInputChange('rules_and_guidelines', e.target.value)}
          placeholder="Set clear expectations for group members (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Group Type
        </label>
        <div className="grid grid-cols-1 gap-3">
          {GROUP_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.group_type === type.value;
            
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => handleInputChange('group_type', type.value)}
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg text-left transition-colors ${
                  isSelected 
                    ? `${type.color} border-current` 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 mt-0.5 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Privacy Settings
        </label>
        <div className="grid grid-cols-1 gap-3">
          {VISIBILITY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = formData.visibility === option.value;
            
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleInputChange('visibility', option.value)}
                className={`flex items-start space-x-3 p-4 border-2 rounded-lg text-left transition-colors ${
                  isSelected 
                    ? `${option.color} border-current` 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 mt-0.5 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allow_public_reviews"
            checked={formData.allow_public_reviews}
            onChange={(e) => handleInputChange('allow_public_reviews', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="allow_public_reviews" className="ml-2 block text-sm text-gray-900">
            Allow members to post public reviews
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="require_approval"
            checked={formData.require_approval_for_reviews}
            onChange={(e) => handleInputChange('require_approval_for_reviews', e.target.checked)}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <label htmlFor="require_approval" className="ml-2 block text-sm text-gray-900">
            Require approval for reviews
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Categories (Optional)
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Select categories that best describe your group to help people find it.
        </p>
        
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {categories.map((category) => {
              const isSelected = selectedCategories.includes(category.category_id);
              
              return (
                <button
                  key={category.category_id}
                  type="button"
                  onClick={() => handleCategoryToggle(category.category_id)}
                  className={`flex items-center space-x-3 p-3 border rounded-lg text-left transition-colors ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50 text-purple-700' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.icon && (
                    <span className="text-lg">{category.icon}</span>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{category.name}</div>
                    {category.description && (
                      <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No categories available.</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Members
        </label>
        <Input
          type="number"
          value={formData.max_members}
          onChange={(e) => handleInputChange('max_members', parseInt(e.target.value) || 1000)}
          min={5}
          max={10000}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Between 5 and 10,000 members
        </p>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Group" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === stepNumber 
                  ? 'bg-purple-600 text-white' 
                  : step > stepNumber 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step > stepNumber ? '✓' : stepNumber}
              </div>
              {stepNumber < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!isStepValid(step)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading || !isStepValid(step)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span>{loading ? 'Creating...' : 'Create Group'}</span>
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default GroupCreateModal;