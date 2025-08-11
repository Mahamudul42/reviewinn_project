/**
 * Step Container Component
 * Wrapper for individual step content with animations
 */

import React from 'react';
import type { StepContainerProps } from './types';
import { cn } from '../../../../shared/design-system/utils/cn';

export const StepContainer: React.FC<StepContainerProps> = ({
  children,
  step,
  isActive,
  className,
  animationDirection = 'none'
}) => {
  const getAnimationClasses = () => {
    if (!isActive) return 'opacity-0 pointer-events-none absolute';
    
    switch (animationDirection) {
      case 'forward':
        return 'animate-slide-in-right opacity-100';
      case 'backward':
        return 'animate-slide-in-left opacity-100';
      default:
        return 'animate-fade-in opacity-100';
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out w-full",
        getAnimationClasses(),
        className
      )}
      role="tabpanel"
      aria-labelledby={`step-${step.id}`}
      aria-hidden={!isActive}
    >
      {/* Step Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <step.icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{step.title}</h2>
            {step.description && (
              <p className="text-gray-600 mt-1">{step.description}</p>
            )}
          </div>
        </div>
        
        {step.estimatedTime && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Estimated time: {step.estimatedTime} minutes</span>
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
};