/**
 * Additional Roles Step Component
 * Optional step for adding multiple roles (professionals and companies only)
 */

import React from 'react';
import { useEntityCreation } from '../../contexts/EntityCreationContext';
import { Button } from '../../../../shared/ui';
import MultipleRolesManager from '../MultipleRolesManager';

export const AdditionalRolesStep: React.FC = () => {
  const {
    state,
    handleAddRole,
    handleRemoveRole,
    goToNextStep,
  } = useEntityCreation();

  if (!state.selectedCategory) {
    return null;
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">
          Additional Roles
          <span className="text-sm font-normal text-neutral-500 ml-2">(Optional)</span>
        </h2>
        <p className="text-neutral-600 max-w-lg mx-auto">
          You've already provided the main information for {state.basicInfo.name}. 
          Want to add any additional roles or positions? This step is completely optional.
        </p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 About Additional Roles</h4>
        <p className="text-sm text-blue-800">
          Add extra roles if this entity has multiple positions, works at different organizations, 
          or offers various services beyond what you've already described.
        </p>
      </div>
      
      <MultipleRolesManager
        entityName={state.basicInfo.name}
        primaryCategory={state.selectedCategory}
        primaryRole={state.primaryRole}
        additionalRoles={state.additionalRoles}
        onAddRole={handleAddRole}
        onRemoveRole={handleRemoveRole}
      />
      
      <div className="flex justify-between mt-8">
        <Button 
          variant="secondary" 
          onClick={goToNextStep}
          className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 hover:border-purple-300"
        >
          Skip Additional Roles
        </Button>
        <Button
          variant="purple"
          onClick={goToNextStep}
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
};