/**
 * Conditional Field Component
 * Renders fields based on conditional logic
 */

import React from 'react';
import { FormField } from './FormField';
import type { FormFieldProps, ConditionalConfig } from './types';

interface ConditionalFieldProps extends FormFieldProps {
  showIf?: ConditionalConfig[];
  hideIf?: ConditionalConfig[];
  formData: Record<string, any>;
}

export const ConditionalField: React.FC<ConditionalFieldProps> = ({
  showIf,
  hideIf,
  formData,
  ...fieldProps
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
    if (hideIf) {
      const shouldHide = hideIf.some(condition => evaluateCondition(condition));
      if (shouldHide) return false;
    }

    // Check showIf conditions
    if (showIf) {
      return showIf.every(condition => evaluateCondition(condition));
    }

    return true;
  };

  if (!shouldShow()) {
    return null;
  }

  return <FormField {...fieldProps} formData={formData} />;
};