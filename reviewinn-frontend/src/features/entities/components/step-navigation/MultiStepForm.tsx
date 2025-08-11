/**
 * Multi-Step Form Component
 * Complete multi-step form with navigation, validation, and persistence
 */

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { StepProvider, useStepNavigation } from './StepProvider';
import { StepIndicator } from './StepIndicator';
import { StepContainer } from './StepContainer';
import type { MultiStepFormProps } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';
import { Button } from '../../../../shared/ui';
import ErrorBoundary from '../../../../shared/components/ErrorBoundary';

const MultiStepFormContent: React.FC<{
  onComplete: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  showProgress?: boolean;
  allowStepNavigation?: boolean;
  theme?: string;
}> = ({ 
  onComplete, 
  onCancel, 
  showProgress = true, 
  allowStepNavigation = true,
  theme = 'default'
}) => {
  const {
    steps,
    currentStepId,
    currentStepIndex,
    completedSteps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    formData,
    errors,
    goNext,
    goPrevious,
    goToStep,
    validateCurrentStep,
    validateAllSteps
  } = useStepNavigation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward' | 'none'>('none');

  const currentStep = steps[currentStepIndex];

  const getThemeClasses = () => {
    switch (theme) {
      case 'professional':
        return {
          container: 'bg-gradient-to-br from-purple-50 to-indigo-50',
          header: 'bg-gradient-to-r from-purple-600 to-indigo-600',
          button: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
        };
      case 'company':
        return {
          container: 'bg-gradient-to-br from-emerald-50 to-teal-50',
          header: 'bg-gradient-to-r from-emerald-600 to-teal-600',
          button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
        };
      case 'location':
        return {
          container: 'bg-gradient-to-br from-rose-50 to-pink-50',
          header: 'bg-gradient-to-r from-rose-600 to-pink-600',
          button: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700'
        };
      case 'product':
        return {
          container: 'bg-gradient-to-br from-amber-50 to-orange-50',
          header: 'bg-gradient-to-r from-amber-600 to-orange-600',
          button: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
        };
      default:
        return {
          container: 'bg-gradient-to-br from-gray-50 to-white',
          header: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          button: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        };
    }
  };

  const themeClasses = getThemeClasses();

  const handleNext = async () => {
    setAnimationDirection('forward');
    await goNext();
  };

  const handlePrevious = async () => {
    setAnimationDirection('backward');
    await goPrevious();
  };

  const handleStepClick = async (stepId: string) => {
    const targetIndex = steps.findIndex(step => step.id === stepId);
    const direction = targetIndex > currentStepIndex ? 'forward' : 'backward';
    setAnimationDirection(direction);
    await goToStep(stepId);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const isValid = await validateAllSteps();
      if (!isValid) {
        throw new Error('Please fix validation errors before submitting');
      }
      
      await onComplete(formData);
    } catch (error) {
      console.error('Form completion error:', error);
      // You might want to show an error toast here
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentStep) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Steps Available</h2>
          <p className="text-gray-600">No form steps have been configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen py-8", themeClasses.container)}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Indicator */}
        {showProgress && (
          <div className="mb-8">
            <StepIndicator
              steps={steps}
              currentStepId={currentStepId}
              completedSteps={completedSteps}
              onStepClick={allowStepNavigation ? handleStepClick : undefined}
              variant="numbers"
              showProgress={true}
              showLabels={true}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Step Content */}
          <div className="p-8 relative min-h-96">
            <StepContainer
              step={currentStep}
              isActive={true}
              animationDirection={animationDirection}
            >
              <currentStep.component />
            </StepContainer>
          </div>

          {/* Navigation */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                {!isFirstStep && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious || isSubmitting}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Previous
                  </Button>
                )}
                
                {onCancel && (
                  <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    leftIcon={<X className="w-4 h-4" />}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStep.canSkip && !isLastStep && (
                  <Button
                    variant="ghost"
                    onClick={() => goNext()}
                    disabled={isSubmitting}
                  >
                    Skip
                  </Button>
                )}

                {!isLastStep ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext || isSubmitting}
                    className={cn("text-white border-0", themeClasses.button)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    className={cn("text-white border-0", themeClasses.button)}
                    rightIcon={isSubmitting ? undefined : <Check className="w-4 h-4" />}
                  >
                    {isSubmitting ? 'Completing...' : 'Complete'}
                  </Button>
                )}
              </div>
            </div>

            {/* Validation Errors Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MultiStepForm: React.FC<MultiStepFormProps> = ({
  steps,
  initialData,
  onComplete,
  onCancel,
  onStepChange,
  showProgress = true,
  allowStepNavigation = true,
  validateOnStepChange = true,
  persistData = false,
  storageKey = 'multi-step-form',
  className,
  theme = 'default'
}) => {
  return (
    <ErrorBoundary>
      <div className={cn("w-full", className)}>
        <StepProvider
          steps={steps}
          initialData={initialData}
          onStepChange={onStepChange}
          validateOnStepChange={validateOnStepChange}
          persistData={persistData}
          storageKey={storageKey}
        >
          <MultiStepFormContent
            onComplete={onComplete}
            onCancel={onCancel}
            showProgress={showProgress}
            allowStepNavigation={allowStepNavigation}
            theme={theme}
          />
        </StepProvider>
      </div>
    </ErrorBoundary>
  );
};