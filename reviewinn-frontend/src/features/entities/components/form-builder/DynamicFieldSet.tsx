/**
 * Dynamic Field Set Component
 * Allows adding/removing multiple instances of a field group
 */

import React from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { FormField } from './FormField';
import type { FieldConfig } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';
import { Button } from '../../../../shared/ui';

interface DynamicFieldSetProps {
  fields: FieldConfig[];
  values: any[];
  onChange: (values: any[]) => void;
  errors?: Record<string, string>[];
  min?: number;
  max?: number;
  disabled?: boolean;
  readonly?: boolean;
  addButtonText?: string;
  removeButtonText?: string;
  title?: string;
  description?: string;
  formData?: Record<string, any>;
}

export const DynamicFieldSet: React.FC<DynamicFieldSetProps> = ({
  fields,
  values = [],
  onChange,
  errors = [],
  min = 0,
  max = 10,
  disabled = false,
  readonly = false,
  addButtonText = 'Add Item',
  removeButtonText = 'Remove',
  title,
  description,
  formData = {}
}) => {
  const addItem = () => {
    if (values.length >= max || disabled || readonly) return;
    
    const newItem: any = {};
    fields.forEach(field => {
      newItem[field.id] = field.defaultValue || '';
    });
    
    onChange([...values, newItem]);
  };

  const removeItem = (index: number) => {
    if (values.length <= min || disabled || readonly) return;
    
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  const updateItem = (index: number, fieldId: string, value: any) => {
    if (disabled || readonly) return;
    
    const newValues = [...values];
    newValues[index] = {
      ...newValues[index],
      [fieldId]: value
    };
    onChange(newValues);
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled || readonly) return;
    
    const newValues = [...values];
    const [movedItem] = newValues.splice(fromIndex, 1);
    newValues.splice(toIndex, 0, movedItem);
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      )}

      {values.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">No items added yet</p>
          <Button
            type="button"
            variant="outline"
            onClick={addItem}
            disabled={disabled || readonly}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {addButtonText}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {values.map((item, index) => (
            <div
              key={index}
              className={cn(
                "relative p-6 border border-gray-200 rounded-lg bg-white",
                index % 2 === 1 && "bg-gray-50"
              )}
            >
              {/* Item Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <span className="text-sm font-medium text-gray-700">
                      Item {index + 1}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={disabled || readonly || values.length <= min}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  {removeButtonText}
                </Button>
              </div>

              {/* Item Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    className={cn(
                      (field.type === 'textarea' || 
                       field.type === 'file' || 
                       field.type === 'image') && "md:col-span-2"
                    )}
                  >
                    <FormField
                      config={field}
                      value={item[field.id]}
                      error={errors[index]?.[field.id]}
                      onChange={(value) => updateItem(index, field.id, value)}
                      formData={{ ...formData, ...item }}
                      disabled={disabled || field.disabled}
                      readonly={readonly || field.readonly}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add Button */}
          {values.length < max && (
            <div className="text-center">
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                disabled={disabled || readonly}
                leftIcon={<Plus className="w-4 h-4" />}
                className="border-dashed border-2"
              >
                {addButtonText}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Limits Info */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>
          {min > 0 && `Minimum: ${min} item${min !== 1 ? 's' : ''}`}
        </span>
        <span>
          {max < Infinity && `Maximum: ${max} item${max !== 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
};