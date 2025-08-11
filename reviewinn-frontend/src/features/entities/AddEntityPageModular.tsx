/**
 * Modular Add Entity Page
 * Clean, component-based architecture for entity creation
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EntityCreationProvider, useEntityCreation } from './contexts/EntityCreationContext';
import { ProgressIndicator } from './components/ProgressIndicator';
import { StepContainer } from './components/StepContainer';
import {
  BasicInfoStep,
  ImageUploadStep,
  CategorySelectionStep,
  EntityInfoStep,
  AdditionalRolesStep,
  ReviewStep,
  SuccessStep,
} from './components/steps';
import ErrorBoundary from '../../shared/components/ErrorBoundary';
import AddEntityPageLayout from './components/AddEntityPageLayout';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

const AddEntityContent: React.FC = () => {
  const { state, shouldShowAdditionalRoles } = useEntityCreation();

  // Success screen has its own layout
  if (state.currentStep === 'success') {
    return (
      <AddEntityPageLayout>
        <SuccessStep />
      </AddEntityPageLayout>
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
    <AddEntityPageLayout>
      {/* Add Entity Middle Panel Content */}
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Create New Entity
          </h1>
          <p className="text-neutral-600">
            Follow the steps below to add a new entity to our platform.
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator />

        {/* Step Content */}
        <StepContainer>
          {renderCurrentStep()}
        </StepContainer>
      </div>
    </AddEntityPageLayout>
  );
};

const AddEntityPageModular: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useUnifiedAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) {
      return;
    }
    
    // If not authenticated, redirect to login
    if (!currentUser) {
      navigate('/login', { state: { from: '/add-entity' } });
      return;
    }
  }, [currentUser, authLoading, navigate]);

  // Show loading if auth is still loading
  if (authLoading) {
    return (
      <AddEntityPageLayout>
        <div className="w-full">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </AddEntityPageLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!currentUser) {
    return null;
  }

  return (
    <ErrorBoundary>
      <EntityCreationProvider>
        <AddEntityContent />
      </EntityCreationProvider>
    </ErrorBoundary>
  );
};

export default AddEntityPageModular;