/**
 * Review Step Component
 * Final review and submission of entity data
 */

import React from 'react';
import { Check } from 'lucide-react';
import { useEntityCreation } from '../../contexts/EntityCreationContext';
import { Button } from '../../../../shared/ui';

export const ReviewStep: React.FC = () => {
  const {
    state,
    handleFinalSubmit,
    goBack,
  } = useEntityCreation();

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
        Review & Submit
      </h2>
      <p className="text-neutral-600 mb-6">
        Please review your information before submitting.
      </p>
      
      <div className="space-y-6">
        {/* Entity Summary */}
        <div className="bg-neutral-50 rounded-xl p-6">
          <h3 className="font-semibold text-neutral-900 mb-4">
            Entity Summary
          </h3>
          <dl className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <dt className="text-sm font-medium text-neutral-600">Name</dt>
                <dd className="text-neutral-900 text-lg font-medium">{state.basicInfo.name}</dd>
              </div>
              {state.entityImage && (
                <div className="flex-shrink-0">
                  <div className="relative">
                    <img 
                      src={state.entityImage} 
                      alt={state.basicInfo.name}
                      className="w-16 h-16 rounded-lg object-cover border border-neutral-200 shadow-sm"
                      style={{ maxWidth: '64px', maxHeight: '64px' }}
                    />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-600">Category</dt>
              <dd className="text-neutral-900">{state.selectedCategory?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-600">Description</dt>
              <dd className="text-neutral-900">{state.basicInfo.description}</dd>
            </div>
          </dl>
        </div>

        {/* Roles Summary */}
        {state.primaryRole && (
          <div className="bg-neutral-50 rounded-xl p-6">
            <h3 className="font-semibold text-neutral-900 mb-4">
              Professional Roles ({1 + state.additionalRoles.length})
            </h3>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-primary-100 text-primary-700 px-2 py-1 rounded">
                    PRIMARY
                  </span>
                  <span className="font-medium text-neutral-900">
                    {state.primaryRole.context.role} at {state.primaryRole.context.organization}
                  </span>
                </div>
                <p className="text-sm text-neutral-600">{state.primaryRole.category.name}</p>
              </div>
              {state.additionalRoles.map((role, index) => (
                <div key={role.id} className="bg-white rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
                      ROLE {index + 2}
                    </span>
                    <span className="font-medium text-neutral-900">
                      {role.context.role} at {role.context.organization}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">{role.category.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={state.isSubmitting}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 hover:border-purple-300"
          >
            Back to Edit
          </Button>
          <Button
            variant="purple"
            onClick={handleFinalSubmit}
            isLoading={state.isSubmitting}
            disabled={state.isSubmitting}
            className="flex-1"
          >
            {state.isSubmitting ? 'Creating Entity...' : 'Create Entity'}
          </Button>
        </div>
      </div>
    </div>
  );
};