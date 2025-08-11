import React from 'react';
import type { FieldConfig } from '../../../types';
import DynamicFormField from './DynamicFormField';

interface SectionBasedFormProps {
  fields: FieldConfig[];
  formData: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

interface FieldSection {
  name: string;
  fields: FieldConfig[];
}

export const SectionBasedForm: React.FC<SectionBasedFormProps> = ({
  fields,
  formData,
  onFieldChange,
  errors = {},
  disabled = false
}) => {
  const sectionMap: Record<string, FieldSection> = {
    context: { name: 'Context Information', fields: [] },
    experience: { name: 'Experience Details', fields: [] },
    value: { name: 'Value & Pricing', fields: [] },
    summary: { name: 'Summary', fields: [] },
    general: { name: 'Additional Information', fields: [] }
  };

  // Group fields by section
  fields.forEach(field => {
    const sectionKey = field.section || 'general';
    if (!sectionMap[sectionKey]) {
      sectionMap[sectionKey] = { name: sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1), fields: [] };
    }
    sectionMap[sectionKey].fields.push(field);
  });

  // Filter out empty sections
  const sectionsWithFields = Object.entries(sectionMap)
    .filter(([_, section]) => section.fields.length > 0)
    .map(([key, section]) => ({ key, ...section }));

  const shouldShowField = (field: FieldConfig): boolean => {
    if (!field.conditional) return true;
    
    const { field: conditionField, value: conditionValue, operator = 'equals' } = field.conditional;
    const currentValue = formData[conditionField];
    
    switch (operator) {
      case 'equals':
        return currentValue === conditionValue;
      case 'contains':
        return Array.isArray(currentValue) 
          ? currentValue.includes(conditionValue)
          : String(currentValue || '').toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'greaterThan':
        return Number(currentValue) > Number(conditionValue);
      case 'lessThan':
        return Number(currentValue) < Number(conditionValue);
      default:
        return true;
    }
  };

  if (sectionsWithFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {sectionsWithFields.map(({ key, name, fields: sectionFields }) => (
        <div key={key} className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sectionFields
              .filter(shouldShowField)
              .map(field => (
                <div
                  key={field.id}
                  className={`${
                    field.type === 'textarea' ? 'md:col-span-2' : ''
                  }`}
                >
                  <DynamicFormField
                    field={field}
                    value={formData[field.id]}
                    onChange={(value) => onFieldChange(field.id, value)}
                    error={errors[field.id]}
                    disabled={disabled}
                  />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SectionBasedForm;