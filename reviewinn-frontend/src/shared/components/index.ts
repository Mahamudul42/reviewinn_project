// Shared Components Library
// Centralized exports for all reusable shared components

export { default as ErrorBoundary } from './ErrorBoundary';
export { default as GatedContent } from './GatedContent';
export { default as AdaptiveGatedContent } from './AdaptiveGatedContent';
export { default as UnifiedEntityCard } from './UnifiedEntityCard';
export { default as CategorySelector } from './CategorySelector';
export { default as FloatingAuthPrompt } from './FloatingAuthPrompt';
export { default as GatingErrorBoundary } from './GatingErrorBoundary';
export { default as AuthGuard } from './AuthGuard';
export { default as ProtectedRoute } from './ProtectedRoute';

// Legacy exports (to be removed after migration)
export { default as CategoryCard } from './CategoryCard';
export { default as SubcategoryCard } from './SubcategoryCard';

// Legal & Policy Components
export { default as LegalInformationCard } from './LegalInformationCard';
export { default as PlatformPoliciesCard } from './PlatformPoliciesCard';