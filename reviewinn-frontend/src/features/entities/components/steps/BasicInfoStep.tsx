/**
 * Basic Info Step Component
 * Handles entity name and description input
 */

import React from 'react';
import { useEntityCreation } from '../../contexts/EntityCreationContext';
import { Button } from '../../../../shared/ui';

export const BasicInfoStep: React.FC = () => {
  const {
    state,
    handleBasicInfoChange,
    goToNextStep,
  } = useEntityCreation();

  const isValid = state.basicInfo.name.trim().length >= 2 && state.basicInfo.description.trim().length >= 10;

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          Basic Entity Details
        </h2>
        <p className="text-neutral-600 max-w-md mx-auto">
          Let's start with the essential information about your entity
        </p>
      </div>
      
      <div className="max-w-lg mx-auto space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-neutral-700">
            Entity Name *
          </label>
          <input
            type="text"
            value={state.basicInfo.name}
            onChange={(e) => handleBasicInfoChange('name', e.target.value)}
            placeholder="Enter the entity name..."
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            autoFocus
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-neutral-700">
            Description *
          </label>
          <textarea
            value={state.basicInfo.description}
            onChange={(e) => handleBasicInfoChange('description', e.target.value)}
            placeholder="Provide a detailed description..."
            rows={4}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
          />
          <p className="text-xs text-neutral-500">
            Tell us what makes this entity unique and important (minimum 10 characters)
          </p>
        </div>
        
        <div className="pt-4">
          <Button
            variant="purple"
            onClick={goToNextStep}
            disabled={!isValid}
            className="w-full"
          >
            Continue to Image Upload
          </Button>
        </div>
      </div>
    </div>
  );
};