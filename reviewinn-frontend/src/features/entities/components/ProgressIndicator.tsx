/**
 * Progress Indicator Component
 * Shows current step progress and navigation
 */

import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useEntityCreation } from '../contexts/EntityCreationContext';
import { cn } from '../../../shared/design-system/utils/cn';
import { Card } from '../../../shared/ui';

export const ProgressIndicator: React.FC = () => {
  const {
    activeSteps,
    currentStepIndex,
    progressPercentage,
    goToStep,
  } = useEntityCreation();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary-500" />
          <div>
            <h3 className="font-semibold text-neutral-900">
              Step {currentStepIndex + 1} of {activeSteps.length}
            </h3>
            <p className="text-sm text-neutral-600">
              {activeSteps[currentStepIndex]?.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-900">
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-neutral-200 rounded-full h-2 mb-6">
        <div 
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {activeSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center"
            >
              <button
                onClick={() => index <= currentStepIndex && goToStep(step.id)}
                disabled={index > currentStepIndex}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                  isCompleted && 'bg-primary-500 text-white',
                  isCurrent && 'bg-primary-500 text-white ring-4 ring-primary-200',
                  !isCompleted && !isCurrent && 'bg-neutral-200 text-neutral-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </button>
              <span className={cn(
                'text-xs font-medium mt-2',
                (isCompleted || isCurrent) ? 'text-neutral-900' : 'text-neutral-400'
              )}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};