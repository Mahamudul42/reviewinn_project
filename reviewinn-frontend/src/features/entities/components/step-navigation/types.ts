/**
 * Step Navigation Types
 * Type definitions for the step navigation system
 */

import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

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
  canSkip?: boolean;
  estimatedTime?: number; // in minutes
}

export interface ConditionalConfig {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater' | 'less';
  value: any;
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
  variant?: 'horizontal' | 'vertical' | 'compact';
  showEstimatedTime?: boolean;
}

export interface StepIndicatorProps {
  steps: StepConfig[];
  currentStepId: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
  variant?: 'dots' | 'numbers' | 'icons' | 'minimal';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showProgress?: boolean;
  className?: string;
}

export interface StepContainerProps {
  children: ReactNode;
  step: StepConfig;
  isActive: boolean;
  className?: string;
  animationDirection?: 'forward' | 'backward' | 'none';
}

export interface StepContextType {
  steps: StepConfig[];
  currentStepId: string;
  currentStepIndex: number;
  completedSteps: string[];
  skippedSteps: string[];
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  formData: Record<string, any>;
  errors: Record<string, string>;
  
  // Navigation methods
  goToStep: (stepId: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  skipStep: (stepId?: string) => void;
  markStepComplete: (stepId: string) => void;
  markStepIncomplete: (stepId: string) => void;
  
  // Data methods
  updateFormData: (data: Record<string, any>) => void;
  updateFieldValue: (field: string, value: any) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  
  // Validation
  validateCurrentStep: () => Promise<boolean>;
  validateStep: (stepId: string) => Promise<boolean>;
  validateAllSteps: () => Promise<boolean>;
}

export interface MultiStepFormProps {
  steps: StepConfig[];
  initialData?: Record<string, any>;
  onComplete: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  onStepChange?: (stepId: string, stepIndex: number) => void;
  showProgress?: boolean;
  allowStepNavigation?: boolean;
  validateOnStepChange?: boolean;
  persistData?: boolean;
  storageKey?: string;
  className?: string;
  theme?: 'default' | 'professional' | 'company' | 'location' | 'product';
}