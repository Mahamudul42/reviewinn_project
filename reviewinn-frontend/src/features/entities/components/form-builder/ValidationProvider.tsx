/**
 * Validation Provider
 * Centralized validation logic for forms
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ValidationRule, ValidationContext, FieldConfig } from './types';

const ValidationContext = createContext<ValidationContext | null>(null);

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within ValidationProvider');
  }
  return context;
};

interface ValidationProviderProps {
  children: React.ReactNode;
  fields: FieldConfig[];
  values: Record<string, any>;
}

export const ValidationProvider: React.FC<ValidationProviderProps> = ({
  children,
  fields,
  values
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const fieldsRef = useRef(fields);
  
  // Update fields ref when fields change
  React.useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  const validateRule = useCallback((rule: ValidationRule, value: any, formData: Record<string, any>): string | null => {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          return rule.message;
        }
        break;
        
      case 'minLength':
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message;
        }
        break;
        
      case 'maxLength':
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message;
        }
        break;
        
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message;
        }
        break;
        
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message;
        }
        break;
        
      case 'pattern':
        if (typeof value === 'string' && !rule.value.test(value)) {
          return rule.message;
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value === 'string' && value && !emailRegex.test(value)) {
          return rule.message;
        }
        break;
        
      case 'url':
        try {
          if (typeof value === 'string' && value) {
            new URL(value);
          }
        } catch {
          return rule.message;
        }
        break;
        
      case 'custom':
        if (rule.validator && !rule.validator(value, formData)) {
          return rule.message;
        }
        break;
    }
    
    return null;
  }, []);

  const validateField = useCallback(async (fieldId: string, value: any, formData?: Record<string, any>): Promise<string | null> => {
    const field = fieldsRef.current.find(f => f.id === fieldId);
    if (!field || !field.validationRules) {
      return null;
    }

    const currentFormData = formData || values;
    
    for (const rule of field.validationRules) {
      const error = validateRule(rule, value, currentFormData);
      if (error) {
        return error;
      }
    }
    
    return null;
  }, [values, validateRule]);

  const validate = useCallback(async (fieldId?: string): Promise<boolean> => {
    setIsValidating(true);
    const newErrors: Record<string, string> = { ...errors };
    
    try {
      if (fieldId) {
        // Validate single field
        const error = await validateField(fieldId, values[fieldId], values);
        if (error) {
          newErrors[fieldId] = error;
        } else {
          delete newErrors[fieldId];
        }
      } else {
        // Validate all fields
        const promises = fieldsRef.current.map(async (field) => {
          const error = await validateField(field.id, values[field.id], values);
          if (error) {
            newErrors[field.id] = error;
          } else {
            delete newErrors[field.id];
          }
        });
        
        await Promise.all(promises);
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } finally {
      setIsValidating(false);
    }
  }, [errors, values, validateField]);

  const clearError = useCallback((fieldId: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  }, []);

  const setError = useCallback((fieldId: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [fieldId]: error
    }));
  }, []);

  const contextValue: ValidationContext = {
    errors,
    touched,
    isValid: Object.keys(errors).length === 0,
    isValidating,
    validate,
    clearError,
    setError,
    validateField
  };

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  );
};