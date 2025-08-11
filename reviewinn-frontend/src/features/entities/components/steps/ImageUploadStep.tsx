/**
 * Image Upload Step Component
 * Handles entity image upload with professional cropping
 */

import React from 'react';
import { useEntityCreation } from '../../contexts/EntityCreationContext';
import { Button } from '../../../../shared/ui';
import EntityImageUpload from '../EntityImageUpload';

export const ImageUploadStep: React.FC = () => {
  const {
    state,
    handleImageUpload,
    goToNextStep,
  } = useEntityCreation();

  return (
    <div>
      <h2 className="text-xl font-semibold text-neutral-900 mb-2">
        Entity Image
      </h2>
      <p className="text-neutral-600 mb-6">
        Upload an image for {state.basicInfo.name} (optional).
      </p>
      <EntityImageUpload
        onImageUpload={handleImageUpload}
        currentImage={state.entityImage}
        entityName={state.basicInfo.name}
        entityType={state.selectedCategory?.slug || 'professional'}
      />
      <div className="flex justify-between mt-6">
        <Button variant="purple" onClick={goToNextStep}>
          Skip for Now
        </Button>
        <Button
          variant="purple"
          onClick={goToNextStep}
          disabled={!state.entityImage}
        >
          Continue with Image
        </Button>
      </div>
    </div>
  );
};