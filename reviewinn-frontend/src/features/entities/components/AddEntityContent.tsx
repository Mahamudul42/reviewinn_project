/**
 * Add Entity Content - Embedded version for tab use
 * Clean, component-based architecture for entity creation without layout wrapper
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntityCreation } from '../contexts/EntityCreationContext';
import { ProgressIndicator } from './ProgressIndicator';
import { StepContainer } from './StepContainer';
import {
  BasicInfoStep,
  ImageUploadStep,
  CategorySelectionStep,
  EntityInfoStep,
  AdditionalRolesStep,
  ReviewStep,
  SuccessStep,
} from './steps';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';

const AddEntityContent: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isLoading: authLoading } = useUnifiedAuth();
  const { state, shouldShowAdditionalRoles } = useEntityCreation();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { state: { from: '/entities' } });
    }
  }, [currentUser, authLoading, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="w-full space-y-6 px-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Success screen has its own design
  if (state.currentStep === 'success') {
    return (
      <div className="w-full space-y-6 px-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
          <SuccessStep />
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'basic-info':
        return <BasicInfoStep />;
      case 'image':
        return <ImageUploadStep />;
      case 'category':
        return <CategorySelectionStep />;
      case 'entity-info':
        return <EntityInfoStep />;
      case 'roles':
        return shouldShowAdditionalRoles() ? <AdditionalRolesStep /> : <ReviewStep />;
      case 'review':
        return <ReviewStep />;
      default:
        return <BasicInfoStep />;
    }
  };

  return (
    <div className="w-full space-y-6 px-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Add New Entity</h2>
        <p className="text-gray-600">Follow the steps below to add a new entity to our platform</p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <ProgressIndicator />
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <StepContainer>
          {renderCurrentStep()}
        </StepContainer>
      </div>
    </div>
  );
};

export default AddEntityContent;