import React, { useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { EntityCategory } from '../../../types';
import type { SubcategoryConfig, EntityFormData, EntityContext } from '../../../types';
import FormCustomField from '../../../shared/molecules/FormCustomField';
import FormButton from '../../../shared/atoms/FormButton';
import FormSectionTitle from '../../../shared/atoms/FormSectionTitle';
import FormInput from '../../../shared/atoms/FormInput';
import FormTextarea from '../../../shared/atoms/FormTextarea';

interface EntityFormProps {
  category: EntityCategory;
  subcategory: SubcategoryConfig;
  onBack: () => void;
  onSubmit: (data: EntityFormData) => void;
  initialData?: Partial<EntityFormData>;
}

const EntityForm: React.FC<EntityFormProps> = ({
  category,
  subcategory,
  onBack,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState<EntityFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category,
    subcategory: subcategory.id,
    context: initialData?.context || {
      role: '',
      organization: '',
      department: '',
      location: '',
      isCurrent: true
    },
    additionalContexts: initialData?.additionalContexts || [],
    fields: initialData?.fields || {},
    customFields: initialData?.customFields || {}
  });

  const addContext = () => {
    const newContext: EntityContext = {
      role: '',
      organization: '',
      department: '',
      location: ''
    };
    
    setFormData(prev => ({
      ...prev,
      additionalContexts: [...(prev.additionalContexts || []), newContext]
    }));
  };

  const removeContext = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalContexts: prev.additionalContexts?.filter((_, i) => i !== index) || []
    }));
  };

  const updateContext = (index: number, field: keyof EntityContext, value: string) => {
    setFormData(prev => ({
      ...prev,
      additionalContexts: prev.additionalContexts?.map((context, i) => 
        i === index ? { ...context, [field]: value } : context
      ) || []
    }));
  };

  const isFormValid = () => {
    const requiredFields = subcategory.fields.filter((f: any) => f.required);
    const hasRequiredFields = requiredFields.every((field: any) => 
      formData.fields[field.id] && formData.fields[field.id].toString().trim() !== ''
    );
    
    const hasName = formData.name.trim() !== '';
    const hasDescription = formData.description.trim() !== '';
    
    // For professionals, require at least one context
    const hasValidContexts = formData.category !== EntityCategory.PROFESSIONALS || 
      (formData.context && formData.context.role && formData.context.organization) ||
      (formData.additionalContexts && formData.additionalContexts.length > 0);
    
    return hasName && hasDescription && hasRequiredFields && hasValidContexts;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Selection</span>
        </button>
        
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-900">Entity Details</h2>
          <p className="text-gray-600">{subcategory.label}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <FormSectionTitle>Basic Information</FormSectionTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Entity name"
              required
            />
            
            <FormTextarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the entity"
              rows={3}
              required
            />
          </div>
        </div>

        {/* Primary Context (for professionals) */}
        {category === EntityCategory.PROFESSIONALS && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <FormSectionTitle>Primary Professional Context</FormSectionTitle>
            <p className="text-sm text-gray-600 mb-4">
              This will be the main context for this professional. You can add additional contexts below.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                type="text"
                value={formData.context?.role || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  context: { 
                    ...prev.context!, 
                    role: e.target.value 
                  }
                }))}
                placeholder="Role (e.g., Software Engineer)"
                required
              />
              
              <FormInput
                type="text"
                value={formData.context?.organization || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  context: { 
                    ...prev.context!, 
                    organization: e.target.value 
                  }
                }))}
                placeholder="Organization (e.g., Google)"
                required
              />
              
              <FormInput
                type="text"
                value={formData.context?.department || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  context: { 
                    ...prev.context!, 
                    department: e.target.value 
                  }
                }))}
                placeholder="Department (optional)"
              />
              
              <FormInput
                type="text"
                value={formData.context?.location || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  context: { 
                    ...prev.context!, 
                    location: e.target.value 
                  }
                }))}
                placeholder="Location (optional)"
              />
            </div>
          </div>
        )}

        {/* Additional Contexts */}
        {category === EntityCategory.PROFESSIONALS && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <FormSectionTitle>Additional Professional Contexts</FormSectionTitle>
            <p className="text-sm text-gray-600 mb-4">
              Add other professional roles or positions for this person.
            </p>
            
            {formData.additionalContexts?.map((context, index) => (
              <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Context {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeContext(index)}
                    className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    type="text"
                    value={context.role || ''}
                    onChange={(e) => updateContext(index, 'role', e.target.value)}
                    placeholder="Role"
                    required
                  />
                  
                  <FormInput
                    type="text"
                    value={context.organization || ''}
                    onChange={(e) => updateContext(index, 'organization', e.target.value)}
                    placeholder="Organization"
                    required
                  />
                  
                  <FormInput
                    type="text"
                    value={context.department || ''}
                    onChange={(e) => updateContext(index, 'department', e.target.value)}
                    placeholder="Department (optional)"
                  />
                  
                  <FormInput
                    type="text"
                    value={context.location || ''}
                    onChange={(e) => updateContext(index, 'location', e.target.value)}
                    placeholder="Location (optional)"
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addContext}
              className="flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Add Another Context
            </button>
          </div>
        )}

        {/* Custom Fields */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <FormSectionTitle>Additional Information</FormSectionTitle>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subcategory.fields.map((field: any) => (
              <FormCustomField
                key={field.id}
                label={field.name}
                type={field.type}
                required={field.required}
                value={formData.customFields[field.id] || ''}
                options={field.options}
                placeholder={field.placeholder}
                onChange={(value) => setFormData(prev => ({
                  ...prev,
                  customFields: { ...prev.customFields, [field.id]: value }
                }))}
              />
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <FormButton
            type="button"
            variant="secondary"
            onClick={onBack}
          >
            Cancel
          </FormButton>
          
          <FormButton
            type="submit"
            disabled={!isFormValid()}
          >
            Continue to Review
          </FormButton>
        </div>
      </form>
    </div>
  );
};

export default EntityForm;
