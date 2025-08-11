/**
 * Step Navigation Component
 * Navigation controls for multi-step forms
 */

import React from 'react';
import { ArrowLeft, ArrowRight, Check, Skip } from 'lucide-react';
import type { StepNavigationProps } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';
import { Button } from '../../../../shared/ui';

export const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  currentStepId,
  completedSteps,
  onStepChange,
  canGoNext,
  canGoPrevious,
  showProgress = true,
  className,
  variant = 'horizontal',
  showEstimatedTime = false
}) => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  const currentStep = steps[currentIndex];
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious && currentIndex > 0) {
      onStepChange(steps[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (canGoNext && currentIndex < steps.length - 1) {
      onStepChange(steps[currentIndex + 1].id);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentIndex + 1} of {steps.length}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Step Info */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {currentStep?.title}
        </h2>
        {currentStep?.description && (
          <p className="text-gray-600">{currentStep.description}</p>
        )}
        {showEstimatedTime && currentStep?.estimatedTime && (
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Estimated time: {currentStep.estimatedTime} minutes</span>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className={cn(
        "flex items-center justify-between",
        variant === 'vertical' && "flex-col gap-4",
        variant === 'compact' && "gap-2"
      )}>
        {/* Previous Button */}
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              size={variant === 'compact' ? 'sm' : 'md'}
            >
              Previous
            </Button>
          )}
        </div>

        {/* Step Indicators */}
        {variant === 'horizontal' && (
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = step.id === currentStepId;
              const isClickable = isCompleted || isCurrent;

              return (
                <button
                  key={step.id}
                  onClick={isClickable ? () => onStepChange(step.id) : undefined}
                  disabled={!isClickable}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-200",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-blue-500 border-blue-500 text-white",
                    !isCompleted && !isCurrent && "bg-gray-100 border-gray-300 text-gray-500",
                    isClickable && "cursor-pointer hover:scale-110"
                  )}
                  title={step.title}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Next/Complete Button */}
        <div className="flex items-center gap-2">
          {currentStep?.canSkip && !isLastStep && (
            <Button
              variant="ghost"
              onClick={handleNext}
              leftIcon={<Skip className="w-4 h-4" />}
              size={variant === 'compact' ? 'sm' : 'md'}
            >
              Skip
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={!canGoNext}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            size={variant === 'compact' ? 'sm' : 'md'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLastStep ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>

      {/* Step Status */}
      {variant !== 'compact' && (
        <div className="mt-6 text-center text-sm text-gray-500">
          {completedSteps.length > 0 && (
            <span>{completedSteps.length} of {steps.length} steps completed</span>
          )}
        </div>
      )}
    </div>
  );
};