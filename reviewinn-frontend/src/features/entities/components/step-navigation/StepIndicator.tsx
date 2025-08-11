/**
 * Step Indicator Component
 * Visual indicator showing progress through multi-step form
 */

import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import type { StepIndicatorProps } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStepId,
  completedSteps,
  onStepClick,
  variant = 'numbers',
  orientation = 'horizontal',
  showLabels = true,
  showProgress = true,
  className
}) => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  const progressPercentage = ((currentIndex + 1) / steps.length) * 100;

  const getStepStatus = (stepId: string, index: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStepId) return 'current';
    if (index < currentIndex) return 'incomplete';
    return 'upcoming';
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          container: 'bg-green-100 border-green-500 text-green-700',
          icon: 'text-green-600',
          label: 'text-green-700 font-medium'
        };
      case 'current':
        return {
          container: 'bg-blue-100 border-blue-500 text-blue-700 ring-2 ring-blue-200',
          icon: 'text-blue-600',
          label: 'text-blue-700 font-bold'
        };
      case 'incomplete':
        return {
          container: 'bg-amber-100 border-amber-500 text-amber-700',
          icon: 'text-amber-600',
          label: 'text-amber-700'
        };
      default:
        return {
          container: 'bg-gray-100 border-gray-300 text-gray-500',
          icon: 'text-gray-400',
          label: 'text-gray-500'
        };
    }
  };

  const renderStepIcon = (step: any, status: string, index: number) => {
    const classes = getStepClasses(status);

    switch (variant) {
      case 'dots':
        return (
          <div className={cn(
            "w-3 h-3 rounded-full border-2 transition-all duration-200",
            classes.container
          )} />
        );

      case 'icons':
        return (
          <div className={cn(
            "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200",
            classes.container
          )}>
            {status === 'completed' ? (
              <Check className="w-5 h-5" />
            ) : status === 'incomplete' ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <step.icon className="w-5 h-5" />
            )}
          </div>
        );

      case 'minimal':
        return (
          <div className={cn(
            "w-2 h-8 rounded-full transition-all duration-200",
            status === 'completed' && "bg-green-500",
            status === 'current' && "bg-blue-500",
            status === 'incomplete' && "bg-amber-500",
            status === 'upcoming' && "bg-gray-300"
          )} />
        );

      default: // numbers
        return (
          <div className={cn(
            "w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-200",
            classes.container
          )}>
            {status === 'completed' ? (
              <Check className="w-5 h-5" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        );
    }
  };

  const renderStep = (step: any, index: number) => {
    const status = getStepStatus(step.id, index);
    const classes = getStepClasses(status);
    const isClickable = onStepClick && (status === 'completed' || status === 'current');

    return (
      <div
        key={step.id}
        className={cn(
          "flex items-center gap-3 transition-all duration-200",
          orientation === 'vertical' ? "flex-col text-center" : "flex-row",
          isClickable && "cursor-pointer hover:opacity-75",
          variant === 'minimal' && "flex-col items-center"
        )}
        onClick={isClickable ? () => onStepClick(step.id) : undefined}
      >
        {renderStepIcon(step, status, index)}

        {showLabels && variant !== 'minimal' && (
          <div className={cn(
            "flex-1",
            orientation === 'vertical' && "text-center"
          )}>
            <p className={cn("text-sm font-medium", classes.label)}>
              {step.title}
            </p>
            {step.description && (
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
            )}
            {step.estimatedTime && status === 'current' && (
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  ~{step.estimatedTime} min
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderConnector = (index: number) => {
    if (index === steps.length - 1) return null;

    const isCompleted = index < currentIndex;
    const isCurrent = index === currentIndex - 1;

    return (
      <div className={cn(
        "transition-all duration-200",
        orientation === 'horizontal' 
          ? "flex-1 h-0.5 mx-4" 
          : "w-0.5 h-8 my-2 mx-auto",
        isCompleted && "bg-green-500",
        isCurrent && "bg-blue-500",
        !isCompleted && !isCurrent && "bg-gray-300"
      )} />
    );
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Progress Bar */}
      {showProgress && variant !== 'minimal' && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
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

      {/* Steps */}
      <div className={cn(
        "flex transition-all duration-200",
        orientation === 'horizontal' 
          ? "items-center justify-between" 
          : "flex-col items-start",
        variant === 'minimal' && "justify-center gap-4"
      )}>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {renderStep(step, index)}
            {orientation === 'horizontal' && renderConnector(index)}
          </React.Fragment>
        ))}
      </div>

      {/* Current Step Info */}
      {variant === 'minimal' && showLabels && (
        <div className="mt-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {steps[currentIndex]?.title}
          </h3>
          {steps[currentIndex]?.description && (
            <p className="text-sm text-gray-600 mt-1">
              {steps[currentIndex].description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};