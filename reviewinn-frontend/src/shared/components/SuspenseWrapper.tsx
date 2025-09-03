import React, { Suspense, ReactNode } from 'react';
import LoadingSpinner from '../atoms/LoadingSpinner';
import LoadingSkeleton from '../atoms/LoadingSkeleton';
import ErrorBoundary from './ErrorBoundary';
import NetworkErrorBoundary from './NetworkErrorBoundary';

interface SuspenseWrapperProps {
  children: ReactNode;
  
  // Loading fallback options
  fallback?: ReactNode;
  fallbackType?: 'spinner' | 'skeleton';
  skeletonVariant?: 'card' | 'text' | 'circle' | 'rectangle' | 'review' | 'list';
  skeletonCount?: number;
  loadingText?: string;
  
  // Error boundary options
  enableErrorBoundary?: boolean;
  enableNetworkErrorBoundary?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  
  // Layout options
  className?: string;
  minHeight?: string;
}

const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  fallbackType = 'skeleton',
  skeletonVariant = 'card',
  skeletonCount = 3,
  loadingText = 'Loading content...',
  enableErrorBoundary = true,
  enableNetworkErrorBoundary = true,
  onError,
  className = '',
  minHeight = '200px'
}) => {
  // Create default fallback if none provided
  const defaultFallback = fallback || (
    <div className={`p-4 ${className}`} style={{ minHeight }}>
      {fallbackType === 'spinner' ? (
        <LoadingSpinner text={loadingText} />
      ) : (
        <div className="space-y-6">
          <LoadingSkeleton 
            variant={skeletonVariant} 
            count={skeletonCount} 
          />
        </div>
      )}
    </div>
  );

  // Wrap with error boundaries if enabled
  let wrappedChildren = (
    <Suspense fallback={defaultFallback}>
      {children}
    </Suspense>
  );

  if (enableNetworkErrorBoundary) {
    wrappedChildren = (
      <NetworkErrorBoundary onError={onError}>
        {wrappedChildren}
      </NetworkErrorBoundary>
    );
  }

  if (enableErrorBoundary) {
    wrappedChildren = (
      <ErrorBoundary onError={onError} showDetails={import.meta.env.DEV}>
        {wrappedChildren}
      </ErrorBoundary>
    );
  }

  return wrappedChildren;
};

export default SuspenseWrapper;