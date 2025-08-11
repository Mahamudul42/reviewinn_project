/**
 * Step Container Component
 * Wraps step content with navigation and error handling
 */

import React from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useEntityCreation } from '../contexts/EntityCreationContext';
import { Card } from '../../../shared/ui';

interface StepContainerProps {
  children: React.ReactNode;
  showBackButton?: boolean;
}

export const StepContainer: React.FC<StepContainerProps> = ({ 
  children, 
  showBackButton = true 
}) => {
  const { state, goBack } = useEntityCreation();

  return (
    <>
      {/* Error Display */}
      {state.error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <Card className="p-8">
        {/* Back button */}
        {showBackButton && state.currentStep !== 'basic-info' && (
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-purple-600 hover:text-purple-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {children}
      </Card>
    </>
  );
};