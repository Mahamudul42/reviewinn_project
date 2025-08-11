/**
 * Form Section Component
 * Groups related fields together with optional collapsible functionality
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FormField } from './FormField';
import type { FormSectionProps, ConditionalConfig } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';

export const FormSection: React.FC<FormSectionProps> = ({
  config,
  values,
  errors,
  onChange,
  onBlur,
  onFocus,
  disabled,
  readonly
}) => {
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded !== false);

  const evaluateCondition = (condition: ConditionalConfig): boolean => {
    const fieldValue = values[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not-equals':
        return fieldValue !== condition.value;
      case 'contains':
        return Array.isArray(fieldValue) 
          ? fieldValue.includes(condition.value)
          : String(fieldValue).includes(String(condition.value));
      case 'not-contains':
        return Array.isArray(fieldValue) 
          ? !fieldValue.includes(condition.value)
          : !String(fieldValue).includes(String(condition.value));
      case 'greater':
        return Number(fieldValue) > Number(condition.value);
      case 'less':
        return Number(fieldValue) < Number(condition.value);
      default:
        return true;
    }
  };

  const shouldShow = (): boolean => {
    // Check hideIf conditions
    if (config.hideIf) {
      const shouldHide = config.hideIf.some(condition => evaluateCondition(condition));
      if (shouldHide) return false;
    }

    // Check showIf conditions
    if (config.showIf) {
      return config.showIf.every(condition => evaluateCondition(condition));
    }

    return true;
  };

  if (!shouldShow()) {
    return null;
  }

  const visibleFields = config.fields.filter(field => {
    // Apply same conditional logic to fields
    if (field.hideIf) {
      const shouldHide = field.hideIf.some(condition => evaluateCondition(condition));
      if (shouldHide) return false;
    }

    if (field.showIf) {
      return field.showIf.every(condition => evaluateCondition(condition));
    }

    return true;
  });

  if (visibleFields.length === 0) {
    return null;
  }

  const handleToggle = () => {
    if (config.collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={cn("border border-gray-200 rounded-xl bg-white", config.className)}>
      {/* Section Header */}
      <div
        className={cn(
          "flex items-center gap-3 p-6 border-b border-gray-100",
          config.collapsible && "cursor-pointer hover:bg-gray-50",
          !isExpanded && config.collapsible && "border-b-0"
        )}
        onClick={handleToggle}
      >
        {config.collapsible && (
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}
        
        {config.icon && (
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <config.icon className="w-5 h-5 text-blue-600" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
          {config.description && (
            <p className="text-sm text-gray-600 mt-1">{config.description}</p>
          )}
        </div>
        
        {/* Field count indicator */}
        <div className="flex-shrink-0">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {visibleFields.length} field{visibleFields.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {visibleFields.map((field) => (
              <div
                key={field.id}
                className={cn(
                  // Full width for certain field types
                  (field.type === 'textarea' || 
                   field.type === 'file' || 
                   field.type === 'image' ||
                   field.type === 'custom') && "md:col-span-2"
                )}
              >
                <FormField
                  config={field}
                  value={values[field.id]}
                  error={errors[field.id]}
                  onChange={(value) => onChange(field.id, value)}
                  onBlur={onBlur ? (value) => onBlur(field.id, value) : undefined}
                  onFocus={onFocus ? (value) => onFocus(field.id, value) : undefined}
                  formData={values}
                  disabled={disabled || field.disabled}
                  readonly={readonly || field.readonly}
                />
              </div>
            ))}
          </div>
          
          {/* Section-specific help text or additional content */}
          {config.description && isExpanded && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                {config.icon && <config.icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />}
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Section Information</p>
                  <p>{config.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};