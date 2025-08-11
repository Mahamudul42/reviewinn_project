/**
 * Form Builder Types
 * Type definitions for the modular form system
 */

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'multiselect'
  | 'number' 
  | 'email' 
  | 'url' 
  | 'tel'
  | 'date' 
  | 'datetime-local'
  | 'month'
  | 'checkbox' 
  | 'radio'
  | 'file'
  | 'image'
  | 'color'
  | 'range'
  | 'custom';

export type ValidationRuleType = 
  | 'required' 
  | 'minLength' 
  | 'maxLength' 
  | 'min' 
  | 'max' 
  | 'pattern' 
  | 'email' 
  | 'url' 
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  value?: any;
  message: string;
  validator?: (value: any, formData?: Record<string, any>) => boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: LucideIcon;
  description?: string;
}

export interface ConditionalConfig {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater' | 'less';
  value: any;
}

export interface FieldConfig {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  defaultValue?: any;
  
  // Validation
  validationRules?: ValidationRule[];
  
  // Field-specific options
  options?: SelectOption[];
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  cols?: number;
  accept?: string;
  multiple?: boolean;
  
  // Layout & styling
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  containerClassName?: string;
  icon?: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled' | 'underlined';
  
  // Conditional rendering
  showIf?: ConditionalConfig[];
  hideIf?: ConditionalConfig[];
  
  // Custom renderer
  customRenderer?: (props: any) => ReactNode;
  
  // Events
  onChange?: (value: any, formData: Record<string, any>) => void;
  onBlur?: (value: any, formData: Record<string, any>) => void;
  onFocus?: (value: any, formData: Record<string, any>) => void;
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  fields: FieldConfig[];
  showIf?: ConditionalConfig[];
  hideIf?: ConditionalConfig[];
}

export interface FormConfig {
  id: string;
  title: string;
  description?: string;
  sections: FormSectionConfig[];
  submitText?: string;
  resetText?: string;
  cancelText?: string;
  showProgress?: boolean;
  progressSteps?: string[];
  layout?: 'single-column' | 'two-column' | 'auto';
  spacing?: 'compact' | 'comfortable' | 'spacious';
  theme?: 'default' | 'professional' | 'company' | 'location' | 'product';
}

export interface FormFieldProps {
  config: FieldConfig;
  value: any;
  error?: string;
  onChange: (value: any) => void;
  onBlur?: (value: any) => void;
  onFocus?: (value: any) => void;
  formData?: Record<string, any>;
  disabled?: boolean;
  readonly?: boolean;
}

export interface FormSectionProps {
  config: FormSectionConfig;
  values: Record<string, any>;
  errors: Record<string, string>;
  onChange: (fieldId: string, value: any) => void;
  onBlur?: (fieldId: string, value: any) => void;
  onFocus?: (fieldId: string, value: any) => void;
  disabled?: boolean;
  readonly?: boolean;
}

export interface FormBuilderProps {
  config: FormConfig;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  onReset?: () => void;
  onChange?: (values: Record<string, any>) => void;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  className?: string;
}

export interface ValidationContext {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isValidating: boolean;
  validate: (field?: string) => Promise<boolean>;
  clearError: (field: string) => void;
  setError: (field: string, error: string) => void;
  validateField: (field: string, value: any, formData?: Record<string, any>) => Promise<string | null>;
}

export interface StepConfig {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  component: React.ComponentType<any>;
  validationFields?: string[];
  optional?: boolean;
  showIf?: ConditionalConfig[];
  hideIf?: ConditionalConfig[];
}

export interface StepNavigationProps {
  steps: StepConfig[];
  currentStepId: string;
  completedSteps: string[];
  onStepChange: (stepId: string) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  showProgress?: boolean;
  className?: string;
}