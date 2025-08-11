/**
 * Entity Info Step Component
 * Dynamic form based on entity type (professional, company, location, product)
 */

import React from 'react';
import { useEntityCreation } from '../../contexts/EntityCreationContext';
import { Button } from '../../../../shared/ui';
import { DynamicEntityForm } from '../DynamicEntityForms';

export const EntityInfoStep: React.FC = () => {
  const {
    state,
    getEntityType,
    shouldShowAdditionalRoles,
    handleDynamicFieldChange,
    goToNextStep,
  } = useEntityCreation();

  if (!state.selectedCategory) {
    return null;
  }

  const entityType = getEntityType();

  // Debug logging for EntityInfoStep
  console.log('🔍 EntityInfoStep - Final entity type:', entityType);
  console.log('🔍 EntityInfoStep - Selected category:', state.selectedCategory?.name, '(slug:', state.selectedCategory?.slug, ')');

  const getStepTitle = () => {
    switch (entityType) {
      case 'professional': return 'Professional Details';
      case 'company': return 'Company Information';
      case 'location': return 'Location Details';
      case 'product': return 'Product Information';
      case 'custom': return 'Custom Entity Details';
      default: return 'Entity Details';
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
        {getStepTitle()}
      </h2>
      <p className="text-neutral-600 mb-6">
        Provide detailed information about this {state.selectedCategory.name || 'entity'}.
      </p>
      
      <div className="space-y-6">
        <DynamicEntityForm
          entityType={entityType}
          selectedCategory={state.selectedCategory}
          values={{ 
            name: state.basicInfo.name, 
            ...state.dynamicFields 
          }}
          onFieldChange={handleDynamicFieldChange}
        />
        <div className="flex justify-end">
          <Button
            variant="purple"
            onClick={goToNextStep}
          >
            {shouldShowAdditionalRoles() ? 'Continue to Roles' : 'Continue to Review'}
          </Button>
        </div>
      </div>
    </div>
  );
};