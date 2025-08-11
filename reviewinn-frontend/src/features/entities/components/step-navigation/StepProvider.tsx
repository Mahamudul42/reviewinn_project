/**
 * Step Provider
 * Context provider for managing multi-step form state and navigation
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { StepConfig, StepContextType, ConditionalConfig } from './types';

const StepContext = createContext<StepContextType | null>(null);

export const useStepNavigation = () => {
  const context = useContext(StepContext);
  if (!context) {
    throw new Error('useStepNavigation must be used within StepProvider');
  }
  return context;
};

interface StepProviderProps {
  children: React.ReactNode;
  steps: StepConfig[];
  initialData?: Record<string, any>;
  onStepChange?: (stepId: string, stepIndex: number) => void;
  validateOnStepChange?: boolean;
  persistData?: boolean;
  storageKey?: string;
}

export const StepProvider: React.FC<StepProviderProps> = ({
  children,
  steps,
  initialData = {},
  onStepChange,
  validateOnStepChange = true,
  persistData = false,
  storageKey = 'step-form-data'
}) => {
  // Load persisted data if enabled
  const loadPersistedData = useCallback(() => {
    if (persistData && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
    return {};
  }, [persistData, storageKey]);

  const [currentStepId, setCurrentStepId] = useState(() => steps[0]?.id || '');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [skippedSteps, setSkippedSteps] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>(() => ({
    ...initialData,
    ...loadPersistedData()
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Persist data when it changes
  useEffect(() => {
    if (persistData && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formData));
      } catch (error) {
        console.warn('Failed to persist form data:', error);
      }
    }
  }, [formData, persistData, storageKey]);

  const evaluateCondition = useCallback((condition: ConditionalConfig): boolean => {
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
  }, [formData]);

  // Filter visible steps based on conditional logic
  const visibleSteps = useMemo(() => {
    return steps.filter(step => {
      if (step.hideIf && step.hideIf.some(condition => evaluateCondition(condition))) {
        return false;
      }
      if (step.showIf && !step.showIf.every(condition => evaluateCondition(condition))) {
        return false;
      }
      return true;
    });
  }, [steps, evaluateCondition]);

  const currentStepIndex = useMemo(() => 
    visibleSteps.findIndex(step => step.id === currentStepId),
    [visibleSteps, currentStepId]
  );

  const currentStep = useMemo(() => 
    visibleSteps[currentStepIndex],
    [visibleSteps, currentStepIndex]
  );

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;

  // Validation logic
  const validateFields = useCallback(async (fieldIds: string[]): Promise<boolean> => {
    // This is a simplified validation - in a real implementation,
    // you'd integrate with your validation system
    const stepErrors: Record<string, string> = {};
    
    for (const fieldId of fieldIds) {
      const value = formData[fieldId];
      
      // Basic required field validation
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        stepErrors[fieldId] = `${fieldId} is required`;
      }
    }
    
    setErrors(prev => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  }, [formData]);

  const validateStep = useCallback(async (stepId: string): Promise<boolean> => {
    const step = visibleSteps.find(s => s.id === stepId);
    if (!step || !step.validationFields) return true;
    
    return await validateFields(step.validationFields);
  }, [visibleSteps, validateFields]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    return await validateStep(currentStepId);
  }, [validateStep, currentStepId]);

  const validateAllSteps = useCallback(async (): Promise<boolean> => {
    let allValid = true;
    
    for (const step of visibleSteps) {
      if (step.validationFields) {
        const isValid = await validateStep(step.id);
        if (!isValid) allValid = false;
      }
    }
    
    return allValid;
  }, [visibleSteps, validateStep]);

  // Determine if we can navigate
  const canGoNext = useMemo(() => {
    if (isLastStep) return false;
    
    const nextStepIndex = currentStepIndex + 1;
    return nextStepIndex < visibleSteps.length;
  }, [isLastStep, currentStepIndex, visibleSteps]);

  const canGoPrevious = useMemo(() => {
    return currentStepIndex > 0;
  }, [currentStepIndex]);

  // Navigation methods
  const goToStep = useCallback(async (stepId: string) => {
    const targetStep = visibleSteps.find(step => step.id === stepId);
    if (!targetStep) return;

    const targetIndex = visibleSteps.findIndex(step => step.id === stepId);
    
    // If moving forward and validation is required, validate current step
    if (validateOnStepChange && targetIndex > currentStepIndex) {
      const isValid = await validateCurrentStep();
      if (!isValid) return;
    }

    setCurrentStepId(stepId);
    onStepChange?.(stepId, targetIndex);
  }, [visibleSteps, validateOnStepChange, currentStepIndex, validateCurrentStep, onStepChange]);

  const goNext = useCallback(async () => {
    if (!canGoNext) return;

    if (validateOnStepChange) {
      const isValid = await validateCurrentStep();
      if (!isValid) return;
    }

    // Mark current step as completed
    if (!completedSteps.includes(currentStepId)) {
      setCompletedSteps(prev => [...prev, currentStepId]);
    }

    const nextStepId = visibleSteps[currentStepIndex + 1]?.id;
    if (nextStepId) {
      await goToStep(nextStepId);
    }
  }, [canGoNext, validateOnStepChange, validateCurrentStep, completedSteps, currentStepId, visibleSteps, currentStepIndex, goToStep]);

  const goPrevious = useCallback(async () => {
    if (!canGoPrevious) return;

    const previousStepId = visibleSteps[currentStepIndex - 1]?.id;
    if (previousStepId) {
      await goToStep(previousStepId);
    }
  }, [canGoPrevious, visibleSteps, currentStepIndex, goToStep]);

  const skipStep = useCallback((stepId?: string) => {
    const targetStepId = stepId || currentStepId;
    
    if (!skippedSteps.includes(targetStepId)) {
      setSkippedSteps(prev => [...prev, targetStepId]);
    }

    if (stepId === currentStepId || !stepId) {
      goNext();
    }
  }, [currentStepId, skippedSteps, goNext]);

  const markStepComplete = useCallback((stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
    // Remove from skipped if it was skipped
    setSkippedSteps(prev => prev.filter(id => id !== stepId));
  }, [completedSteps]);

  const markStepIncomplete = useCallback((stepId: string) => {
    setCompletedSteps(prev => prev.filter(id => id !== stepId));
  }, []);

  // Data management methods
  const updateFormData = useCallback((data: Record<string, any>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  const updateFieldValue = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const contextValue: StepContextType = {
    steps: visibleSteps,
    currentStepId,
    currentStepIndex,
    completedSteps,
    skippedSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    formData,
    errors,
    
    // Navigation methods
    goToStep,
    goNext,
    goPrevious,
    skipStep,
    markStepComplete,
    markStepIncomplete,
    
    // Data methods
    updateFormData,
    updateFieldValue,
    setErrors,
    clearError,
    
    // Validation
    validateCurrentStep,
    validateStep,
    validateAllSteps
  };

  return (
    <StepContext.Provider value={contextValue}>
      {children}
    </StepContext.Provider>
  );
};