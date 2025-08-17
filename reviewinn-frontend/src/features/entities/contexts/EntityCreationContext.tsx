/**
 * Entity Creation Context
 * Manages state and actions for the multi-step entity creation process
 */

import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UnifiedCategory, EntityContext, EntityFormData } from '../../../types/index';
import { entityService } from '../../../api/services/entityService';

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
    
    
    // Method 1: Check path_text field first (from search API results)
    const pathText = (selectedCategory as { path_text?: string }).path_text;
    if (pathText) {
      const pathLower = pathText.toLowerCase();
      
      // Check for root category patterns in path_text
      if (pathLower.startsWith('products') || pathLower.includes('products >')) {
        return 'product';
      }
      if (pathLower.startsWith('professionals') || pathLower.includes('professionals >')) {
        return 'professional';
      }
      if (pathLower.startsWith('companies') || pathLower.includes('companies') || pathLower.includes('institutes')) {
        return 'company';
      }
      if (pathLower.startsWith('places') || pathLower.includes('places >')) {
        return 'location';
      }
      if (pathLower.startsWith('other') || pathLower.includes('other >') || pathLower.includes('custom')) {
        return 'custom';
      }
    }
    
    // Method 2: Check path field for exact matches (from main API)
    if (selectedCategory.path) {
      const path = selectedCategory.path.toLowerCase();
      
      // Check for custom category first
      if (path.includes('other.custom') || path === 'other.custom' || path.startsWith('303')) {
        return 'custom';
      }
      
      // Check root categories by path prefix (using numeric IDs from your database)
      if (path.startsWith('1.') || path === '1') { // Professionals root ID = 1
        return 'professional';
      }
      if (path.startsWith('115.') || path === '115') { // Companies/Institutes root ID = 115
        return 'company';
      }
      if (path.startsWith('186.') || path === '186') { // Places root ID = 186
        return 'location';
      }
      if (path.startsWith('235.') || path === '235') { // Products root ID = 235
        return 'product';
      }
      if (path.startsWith('303.') || path === '303') { // Other root ID = 303
        return 'custom';
      }
    }
    
    // Method 3: Check if it's a root category by slug and level
    if (selectedCategory.is_root || selectedCategory.level <= 1) {
      const rootSlug = selectedCategory.slug.toLowerCase();
      
      if (rootSlug === 'professionals') return 'professional';
      if (rootSlug === 'companies_institutes' || rootSlug === 'companiesinstitutes') return 'company';
      if (rootSlug === 'places') return 'location';
      if (rootSlug === 'products') return 'product';
      if (rootSlug === 'other') return 'custom';
    }
    
    // Method 4: Check individual slug patterns
    const categorySlug = selectedCategory.slug.toLowerCase();
    
    if (categorySlug === 'custom') return 'custom';
    if (categorySlug.includes('company') || categorySlug.includes('institution') || categorySlug.includes('business')) return 'company';
    if (categorySlug.includes('location') || categorySlug.includes('place') || categorySlug.includes('venue')) return 'location';
    if (categorySlug.includes('product') || categorySlug.includes('service') || categorySlug.includes('item') || 
        categorySlug.includes('smartphone') || categorySlug.includes('electronics') || categorySlug.includes('fashion') ||
        categorySlug.includes('food') || categorySlug.includes('beverage') || categorySlug.includes('automotive')) return 'product';
    
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
      // Helper function to find root category object for JSONB storage
      const findRootCategory = (category: UnifiedCategory): UnifiedCategory => {
        // If already at level 1, this is the root category
        if (category.level === 1) {
          return category;
        }
        
        // For deeper levels, create a minimal root category object
        // In a real implementation, you might want to fetch this from your category hierarchy
        const rootCategoryId = category.path ? parseInt(category.path.split('.')[0]) : category.id;
        
        // Map root category IDs to their actual names and details
        const getRootCategoryData = (id: number) => {
          switch (id) {
            case 1:
              return {
                name: 'Professionals',
                slug: 'professionals',
                icon: '👨‍💼',
                color: 'green'
              };
            case 115:
              return {
                name: 'Companies & Institutes',
                slug: 'companies-institutes',
                icon: '🏢',
                color: 'blue'
              };
            case 186:
              return {
                name: 'Places',
                slug: 'places',
                icon: '📍',
                color: 'red'
              };
            case 235:
              return {
                name: 'Products',
                slug: 'products',
                icon: '📦',
                color: 'orange'
              };
            case 303:
              return {
                name: 'Other',
                slug: 'other',
                icon: '🔖',
                color: 'purple'
              };
            default:
              return {
                name: 'Unknown Category',
                slug: 'unknown-category',
                icon: '📂',
                color: 'gray'
              };
          }
        };
        
        const rootData = getRootCategoryData(rootCategoryId);
        
        // Create a minimal root category object with proper name mapping
        return {
          id: rootCategoryId,
          name: rootData.name,
          slug: rootData.slug,
          level: 1,
          icon: rootData.icon,
          color: rootData.color,
          description: 'Root level category',
          is_active: true,
          parent_id: null,
          path: rootCategoryId.toString(),
          sort_order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      };

      // Map frontend category selection to backend format for core_entities table (JSONB-only approach)
      const rootCategory = findRootCategory(state.selectedCategory);
      
      const entityData: EntityFormData = {
        name: state.basicInfo.name,
        description: state.basicInfo.description,
        
        // JSONB-only category approach (source of truth)
        root_category: rootCategory, // Full UnifiedCategory object with {id, name, slug, icon, color, level}
        final_category: state.selectedCategory, // Full UnifiedCategory object with {id, name, slug, icon, color, level}
        
        // Image and metadata
        avatar: state.entityImage || undefined,
        context: state.primaryRole?.context || undefined,
        additionalContexts: state.additionalRoles.map(role => role.context),
        fields: state.dynamicFields || {},
        customFields: {},
      };


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

export const useEntityCreation = () => {
  const context = useContext(EntityCreationContext);
  if (!context) {
    throw new Error('useEntityCreation must be used within EntityCreationProvider');
  }
  return context;
};