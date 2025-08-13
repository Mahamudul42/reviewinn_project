/**
 * Entity Creation Context
 * Manages state and actions for the multi-step entity creation process
 */

import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UnifiedCategory, EntityContext, EntityFormData } from '../../../types/index';
import { entityService } from '../../../api/services/entityService';
import { EntityCategory } from '../../../types/index';
import { convertToLegacyCategory } from '../../../shared/utils/categoryDisplayUtils';

export type EntityCreationStep = 'basic-info' | 'image' | 'category' | 'entity-info' | 'roles' | 'review' | 'success';
export type EntityType = 'professional' | 'company' | 'location' | 'product' | 'custom';

export interface EntityRole {
  id: string;
  category: UnifiedCategory;
  context: EntityContext;
  description?: string;
  image?: string;
}

export interface EntityCreationState {
  currentStep: EntityCreationStep;
  basicInfo: {
    name: string;
    description: string;
  };
  dynamicFields: Record<string, string>;
  entityImage: string | null;
  selectedCategory: UnifiedCategory | null;
  primaryRole: EntityRole | null;
  additionalRoles: EntityRole[];
  isSubmitting: boolean;
  error: string | null;
}

export interface EntityCreationContextType {
  // State
  state: EntityCreationState;
  
  // Helper functions
  getEntityType: () => EntityType;
  shouldShowAdditionalRoles: () => boolean;
  
  // Step management
  activeSteps: Array<{
    id: EntityCreationStep;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }>;
  currentStepIndex: number;
  progressPercentage: number;
  
  // Navigation
  goToStep: (step: EntityCreationStep) => void;
  goToNextStep: () => void;
  goBack: () => void;
  
  // Event handlers
  handleBasicInfoChange: (field: 'name' | 'description', value: string) => void;
  handleDynamicFieldChange: (field: string, value: string) => void;
  handleImageUpload: (imageUrl: string) => void;
  handleCategorySelect: (category: UnifiedCategory) => void;
  handleAddRole: (category: UnifiedCategory, context: EntityContext) => void;
  handleRemoveRole: (roleId: string) => void;
  handleFinalSubmit: () => Promise<void>;
  
  // UI state
  showCategoryModal: boolean;
  setShowCategoryModal: (show: boolean) => void;
}

const EntityCreationContext = createContext<EntityCreationContextType | null>(null);

export const useEntityCreation = () => {
  const context = useContext(EntityCreationContext);
  if (!context) {
    throw new Error('useEntityCreation must be used within EntityCreationProvider');
  }
  return context;
};

interface EntityCreationProviderProps {
  children: React.ReactNode;
}

export const EntityCreationProvider: React.FC<EntityCreationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  
  const [state, setState] = useState<EntityCreationState>({
    currentStep: 'basic-info',
    basicInfo: {
      name: '',
      description: '',
    },
    dynamicFields: {},
    entityImage: null,
    selectedCategory: null,
    primaryRole: null,
    additionalRoles: [],
    isSubmitting: false,
    error: null,
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Helper function to determine entity type from selected category (synchronized with DynamicEntityForm)
  const getEntityType = useCallback((): EntityType => {
    if (!state.selectedCategory) return 'professional';
    
    const selectedCategory = state.selectedCategory;
    
    // Method 1: Check path field for exact matches (most reliable)
    if (selectedCategory.path) {
      const path = selectedCategory.path.toLowerCase();
      
      console.log('🔍 EntityCreationContext - Path detection:', path);
      
      // Check for custom category first
      if (path.includes('other.custom') || path === 'other.custom') {
        console.log('✅ Detected as custom from path');
        return 'custom';
      }
      
      // Check root categories by path prefix
      if (path.startsWith('professionals') || path === 'professionals') {
        console.log('✅ Detected as professional from path');
        return 'professional';
      }
      if (path.startsWith('companiesinstitutes') || path === 'companiesinstitutes') {
        console.log('✅ Detected as company from path');
        return 'company';
      }
      if (path.startsWith('places') || path === 'places') {
        console.log('✅ Detected as location from path');
        return 'location';
      }
      if (path.startsWith('products') || path === 'products') {
        console.log('✅ Detected as product from path');
        return 'product';
      }
      if (path.startsWith('other') || path === 'other') {
        console.log('✅ Detected as custom from other path');
        return 'custom';
      }
    }
    
    // Method 2: Check if it's a root category by slug
    if (selectedCategory.is_root || selectedCategory.level <= 1) {
      const rootSlug = selectedCategory.slug.toLowerCase();
      console.log('🔍 EntityCreationContext - Root slug detection:', rootSlug);
      
      if (rootSlug === 'professionals') return 'professional';
      if (rootSlug === 'companiesinstitutes') return 'company';
      if (rootSlug === 'places') return 'location';
      if (rootSlug === 'products') return 'product';
      if (rootSlug === 'other') return 'custom';
      
      // Fallback slug patterns for backwards compatibility
      if (rootSlug.includes('professional') || rootSlug.includes('person') || rootSlug.includes('people')) return 'professional';
      if (rootSlug.includes('compan') || rootSlug.includes('business') || rootSlug.includes('organization')) return 'company';
      if (rootSlug.includes('location') || rootSlug.includes('place') || rootSlug.includes('venue')) return 'location';
      if (rootSlug.includes('product') || rootSlug.includes('service') || rootSlug.includes('item')) return 'product';
    }
    
    // Method 3: Check path_text (from search API)
    const pathText = (selectedCategory as any).path_text;
    if (pathText) {
      const pathLower = pathText.toLowerCase();
      console.log('🔍 EntityCreationContext - Path text detection:', pathText);
      
      if (pathLower.includes('other') && pathLower.includes('custom')) return 'custom';
      if (pathLower.includes('professional') || pathLower.includes('person') || pathLower.includes('people')) return 'professional';
      if (pathLower.includes('compan') || pathLower.includes('business') || pathLower.includes('organization')) return 'company';
      if (pathLower.includes('location') || pathLower.includes('place') || pathLower.includes('venue')) return 'location';
      if (pathLower.includes('product') || pathLower.includes('service') || pathLower.includes('item')) return 'product';
    }
    
    // Method 4: Check individual slug patterns
    const categorySlug = selectedCategory.slug.toLowerCase();
    if (categorySlug === 'custom') return 'custom';
    if (categorySlug.includes('company') || categorySlug.includes('institution') || categorySlug.includes('business')) return 'company';
    if (categorySlug.includes('location') || categorySlug.includes('place') || categorySlug.includes('venue')) return 'location';
    if (categorySlug.includes('product') || categorySlug.includes('service') || categorySlug.includes('item')) return 'product';
    
    console.log('🔍 EntityCreationContext - Fallback to professional for:', selectedCategory);
    return 'professional';
  }, [state.selectedCategory]);

  // Helper function to determine if additional roles should be shown
  const shouldShowAdditionalRoles = useCallback((): boolean => {
    const entityType = getEntityType();
    // Only show additional roles for professionals and companies
    return entityType === 'professional' || entityType === 'company';
  }, [getEntityType]);

  // Step definitions
  const STEPS = useMemo(() => [
    {
      id: 'basic-info' as EntityCreationStep,
      title: 'Basic Details',
      description: 'Name & description',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ),
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 'image' as EntityCreationStep,
      title: 'Entity Image',
      description: 'Upload photo',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        </svg>
      ),
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'category' as EntityCreationStep,
      title: 'Category',
      description: 'Select type',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      ),
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'entity-info' as EntityCreationStep,
      title: 'Information',
      description: 'Specific details',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/>
        </svg>
      ),
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'roles' as EntityCreationStep,
      title: 'Additional Roles',
      description: 'Optional extras',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.01 2.01 0 0 0 18.05 7h-.67c-.73 0-1.38.41-1.71 1.06l-1.13 2.26L16 8.8l1.54 1.25 1.33-2.67c.19-.38.58-.63 1.02-.63h.11zm-3.5 0H14v-6.5h2.5V22z"/>
        </svg>
      ),
      color: 'from-rose-500 to-pink-600',
    },
    {
      id: 'review' as EntityCreationStep,
      title: 'Review',
      description: 'Confirm & submit',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      ),
      color: 'from-indigo-500 to-purple-600',
    },
  ], []);

  // Step management with dynamic step filtering
  const activeSteps = useMemo(() => {
    // Filter out roles step for products and locations
    if (!shouldShowAdditionalRoles() && state.selectedCategory) {
      return STEPS.filter(step => step.id !== 'roles');
    }
    return STEPS;
  }, [shouldShowAdditionalRoles, state.selectedCategory, STEPS]);

  const currentStepIndex = useMemo(() => 
    activeSteps.findIndex(step => step.id === state.currentStep), 
    [activeSteps, state.currentStep]
  );

  const progressPercentage = useMemo(() => 
    ((currentStepIndex + 1) / activeSteps.length) * 100, 
    [currentStepIndex, activeSteps.length]
  );

  // Navigation handlers
  const goToStep = useCallback((step: EntityCreationStep) => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const goToNextStep = useCallback(() => {
    const stepOrder: EntityCreationStep[] = ['basic-info', 'image', 'category', 'entity-info', 'roles', 'review'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    
    // Skip roles step for products and locations
    if (state.currentStep === 'entity-info' && !shouldShowAdditionalRoles()) {
      goToStep('review');
      return;
    }
    
    if (currentIndex < stepOrder.length - 1) {
      goToStep(stepOrder[currentIndex + 1]);
    }
  }, [state.currentStep, goToStep, shouldShowAdditionalRoles]);

  const goBack = useCallback(() => {
    const stepOrder: EntityCreationStep[] = ['basic-info', 'image', 'category', 'entity-info', 'roles', 'review'];
    const currentIndex = stepOrder.indexOf(state.currentStep);
    
    // Skip roles step when going back for products and locations
    if (state.currentStep === 'review' && !shouldShowAdditionalRoles()) {
      goToStep('entity-info');
      return;
    }
    
    if (currentIndex > 0) {
      goToStep(stepOrder[currentIndex - 1]);
    } else {
      navigate('/');
    }
  }, [state.currentStep, goToStep, navigate, shouldShowAdditionalRoles]);

  // Event handlers
  const handleBasicInfoChange = useCallback((field: 'name' | 'description', value: string) => {
    setState(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        [field]: value,
      },
      error: null,
    }));
  }, []);

  const handleDynamicFieldChange = useCallback((field: string, value: string) => {
    setState(prev => ({
      ...prev,
      dynamicFields: {
        ...prev.dynamicFields,
        [field]: value,
      },
      // Update name in basicInfo if it's the name field
      ...(field === 'name' ? {
        basicInfo: {
          ...prev.basicInfo,
          name: value,
        }
      } : {}),
      error: null,
    }));
  }, []);

  const handleImageUpload = useCallback((imageUrl: string) => {
    console.log('🖼️ Image uploaded, URL received:', imageUrl);
    setState(prev => ({
      ...prev,
      entityImage: imageUrl,
      error: null,
    }));
  }, []);

  const handleCategorySelect = useCallback((category: UnifiedCategory) => {
    setState(prev => ({
      ...prev,
      selectedCategory: category,
      error: null,
    }));
    setShowCategoryModal(false);
  }, []);

  const handleAddRole = useCallback((category: UnifiedCategory, context: EntityContext) => {
    const newRole: EntityRole = {
      id: Date.now().toString(),
      category,
      context,
    };

    setState(prev => {
      if (!prev.primaryRole) {
        return {
          ...prev,
          primaryRole: newRole,
          error: null,
        };
      } else {
        return {
          ...prev,
          additionalRoles: [...prev.additionalRoles, newRole],
          error: null,
        };
      }
    });
  }, []);

  const handleRemoveRole = useCallback((roleId: string) => {
    setState(prev => ({
      ...prev,
      additionalRoles: prev.additionalRoles.filter(role => role.id !== roleId),
      error: null,
    }));
  }, []);

  // Final submission handler
  const handleFinalSubmit = useCallback(async () => {
    if (!state.selectedCategory || !state.basicInfo.name || !state.basicInfo.description) {
      setState(prev => ({ ...prev, error: 'Missing required information: name, description, and category are required' }));
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // Helper function to find root category ID for the new core_entities structure
      const getRootCategoryId = (category: UnifiedCategory): number => {
        // Traverse up the category hierarchy to find the root
        if (category.level === 1) {
          return category.id; // This is already the root category
        }
        
        // For level 2+ categories, extract the root ID from the path
        if (category.path) {
          const pathParts = category.path.split('.');
          return parseInt(pathParts[0]); // First part is always the root ID
        }
        
        // Fallback - the backend should handle finding the correct root
        return category.id;
      };

      // Map frontend category selection to backend format for core_entities table
      const entityData: EntityFormData = {
        name: state.basicInfo.name,
        description: state.basicInfo.description,
        
        // Legacy format for backward compatibility
        category: convertToLegacyCategory(state.selectedCategory.slug),
        subcategory: state.selectedCategory.name,
        
        // New core_entities table fields
        unified_category_id: state.selectedCategory.id,
        root_category_id: getRootCategoryId(state.selectedCategory),
        final_category_id: state.selectedCategory.id,
        
        // Image and metadata
        avatar: state.entityImage || undefined,
        context: state.primaryRole?.context || undefined,
        additionalContexts: state.additionalRoles.map(role => role.context),
        fields: state.dynamicFields || {},
        customFields: {},
      };

      console.log('🖼️ Entity creation data for core_entities:', {
        avatar: entityData.avatar,
        entityImage: state.entityImage,
        rootCategoryId: entityData.root_category_id,
        finalCategoryId: entityData.final_category_id,
        fullEntityData: entityData
      });

      const entity = await entityService.createEntity(entityData);
      
      setState(prev => ({ ...prev, currentStep: 'success', isSubmitting: false }));
      
      // Redirect after success - use entity_id for the new table structure
      setTimeout(() => {
        const entityId = entity.entity_id || entity.id;
        navigate(`/entity/${entityId}`);
      }, 2000);

    } catch (error) {
      console.error('Entity creation failed:', error);
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Failed to create entity',
      }));
    }
  }, [state.selectedCategory, state.basicInfo, state.primaryRole, state.additionalRoles, state.entityImage, state.dynamicFields, navigate]);

  const contextValue: EntityCreationContextType = {
    // State
    state,
    
    // Helper functions
    getEntityType,
    shouldShowAdditionalRoles,
    
    // Step management
    activeSteps,
    currentStepIndex,
    progressPercentage,
    
    // Navigation
    goToStep,
    goToNextStep,
    goBack,
    
    // Event handlers
    handleBasicInfoChange,
    handleDynamicFieldChange,
    handleImageUpload,
    handleCategorySelect,
    handleAddRole,
    handleRemoveRole,
    handleFinalSubmit,
    
    // UI state
    showCategoryModal,
    setShowCategoryModal,
  };

  return (
    <EntityCreationContext.Provider value={contextValue}>
      {children}
    </EntityCreationContext.Provider>
  );
};