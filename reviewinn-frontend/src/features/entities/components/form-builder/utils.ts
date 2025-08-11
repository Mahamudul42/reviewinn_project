/**
 * Form Builder Utilities
 * Helper functions for form building and validation
 */

import type { FieldConfig, ValidationRule, FormConfig, SelectOption } from './types';

/**
 * Create a field configuration with common defaults
 */
export const createField = (
  id: string,
  type: FieldConfig['type'],
  label: string,
  overrides: Partial<FieldConfig> = {}
): FieldConfig => ({
  id,
  type,
  label,
  size: 'md',
  variant: 'default',
  ...overrides
});

/**
 * Create validation rules easily
 */
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    type: 'required',
    message
  }),
  
  minLength: (length: number, message?: string): ValidationRule => ({
    type: 'minLength',
    value: length,
    message: message || `Must be at least ${length} characters`
  }),
  
  maxLength: (length: number, message?: string): ValidationRule => ({
    type: 'maxLength',
    value: length,
    message: message || `Cannot exceed ${length} characters`
  }),
  
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    type: 'email',
    message
  }),
  
  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    type: 'url',
    message
  }),
  
  min: (value: number, message?: string): ValidationRule => ({
    type: 'min',
    value,
    message: message || `Must be at least ${value}`
  }),
  
  max: (value: number, message?: string): ValidationRule => ({
    type: 'max',
    value,
    message: message || `Cannot be more than ${value}`
  }),
  
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    type: 'pattern',
    value: regex,
    message
  }),
  
  custom: (validator: (value: any, formData?: Record<string, any>) => boolean, message: string): ValidationRule => ({
    type: 'custom',
    validator,
    message
  })
};

/**
 * Create select options from simple arrays
 */
export const createOptions = (
  items: string[] | Array<{ value: string | number; label: string; [key: string]: any }>
): SelectOption[] => {
  return items.map(item => {
    if (typeof item === 'string') {
      return { value: item, label: item };
    }
    return item as SelectOption;
  });
};

/**
 * Predefined common field configurations
 */
export const commonFields = {
  name: (required = true): FieldConfig => createField('name', 'text', 'Name', {
    placeholder: 'Enter name',
    required,
    validationRules: required ? [
      validationRules.required(),
      validationRules.minLength(2),
      validationRules.maxLength(100)
    ] : []
  }),
  
  email: (required = true): FieldConfig => createField('email', 'email', 'Email Address', {
    placeholder: 'Enter email address',
    required,
    validationRules: required ? [
      validationRules.required(),
      validationRules.email()
    ] : [validationRules.email()]
  }),
  
  phone: (required = false): FieldConfig => createField('phone', 'tel', 'Phone Number', {
    placeholder: '+1 (555) 123-4567',
    required,
    validationRules: required ? [validationRules.required()] : []
  }),
  
  website: (required = false): FieldConfig => createField('website', 'url', 'Website', {
    placeholder: 'https://www.example.com',
    required,
    validationRules: required ? [
      validationRules.required(),
      validationRules.url()
    ] : [validationRules.url()]
  }),
  
  description: (required = true, rows = 4): FieldConfig => createField('description', 'textarea', 'Description', {
    placeholder: 'Enter description',
    required,
    rows,
    validationRules: required ? [
      validationRules.required(),
      validationRules.minLength(10),
      validationRules.maxLength(1000)
    ] : []
  }),
  
  category: (options: SelectOption[], required = true): FieldConfig => createField('category', 'select', 'Category', {
    placeholder: 'Select category',
    required,
    options,
    validationRules: required ? [validationRules.required()] : []
  })
};

/**
 * Form layout helpers
 */
export const layouts = {
  singleColumn: (spacing: 'compact' | 'comfortable' | 'spacious' = 'comfortable') => ({
    layout: 'single-column' as const,
    spacing
  }),
  
  twoColumn: (spacing: 'compact' | 'comfortable' | 'spacious' = 'comfortable') => ({
    layout: 'two-column' as const,
    spacing
  }),
  
  auto: (spacing: 'compact' | 'comfortable' | 'spacious' = 'comfortable') => ({
    layout: 'auto' as const,
    spacing
  })
};

/**
 * Theme configurations
 */
export const themes = {
  default: 'default' as const,
  professional: 'professional' as const,
  company: 'company' as const,
  location: 'location' as const,
  product: 'product' as const
};

/**
 * Validate form data against field configurations
 */
export const validateFormData = async (
  data: Record<string, any>,
  fields: FieldConfig[]
): Promise<Record<string, string>> => {
  const errors: Record<string, string> = {};
  
  for (const field of fields) {
    if (!field.validationRules) continue;
    
    const value = data[field.id];
    
    for (const rule of field.validationRules) {
      const error = await validateRule(rule, value, data);
      if (error) {
        errors[field.id] = error;
        break; // Stop at first error for this field
      }
    }
  }
  
  return errors;
};

/**
 * Validate a single rule
 */
export const validateRule = async (
  rule: ValidationRule,
  value: any,
  formData: Record<string, any>
): Promise<string | null> => {
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
      if (typeof value === 'string' && value && !rule.value.test(value)) {
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
};