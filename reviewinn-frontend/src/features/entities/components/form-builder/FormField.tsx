/**
 * Form Field Component
 * Wrapper for individual form fields with validation and conditional rendering
 */

import React from 'react';
import { FieldRenderer } from './FieldRenderer';
import type { FormFieldProps, ConditionalConfig } from './types';

interface FormFieldWrapperProps extends FormFieldProps {
  formData: Record<string, any>;
}

export const FormField: React.FC<FormFieldWrapperProps> = ({
  config,
  value,
  error,
  onChange,
  onBlur,
  onFocus,
  formData,
  disabled,
  readonly
}) => {
  const evaluateCondition = (condition: ConditionalConfig): boolean => {
    const fieldValue = formData[condition.field];
    
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

  return (
    <FieldRenderer
      config={config}
      value={value}
      error={error}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      formData={formData}
      disabled={disabled}
      readonly={readonly}
    />
  );
};