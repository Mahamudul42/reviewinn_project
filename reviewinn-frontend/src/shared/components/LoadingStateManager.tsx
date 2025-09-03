import React, { ReactNode } from 'react';
import LoadingSkeleton from '../atoms/LoadingSkeleton';
import LoadingSpinner from '../atoms/LoadingSpinner';

interface LoadingStateManagerProps {
  loading: boolean;
  error?: string | Error | null;
  isEmpty?: boolean;
  children: ReactNode;
  
  // Loading customization
  loadingVariant?: 'spinner' | 'skeleton';
  skeletonType?: 'card' | 'text' | 'circle' | 'rectangle' | 'review' | 'list';
  skeletonCount?: number;
  loadingText?: string;
  
  // Empty state customization
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  
  // Error state customization
  showError?: boolean;
  errorTitle?: string;
  onRetry?: () => void;
  
  // Layout customization
  minHeight?: string;
  className?: string;
}

const LoadingStateManager: React.FC<LoadingStateManagerProps> = ({
  loading,
  error,
  isEmpty = false,
  children,
  loadingVariant = 'skeleton',
  skeletonType = 'card',
  skeletonCount = 3,
  loadingText = 'Loading...',
  emptyTitle = 'No data found',
  emptyMessage = 'There are no items to display at the moment.',
  emptyIcon,
  emptyAction,
  showError = true,
  errorTitle = 'Something went wrong',
  onRetry,
  minHeight = '200px',
  className = ''
}) => {
  // Loading state
  if (loading) {
    return (
      <div className={`${className}`} style={{ minHeight }}>
        {loadingVariant === 'spinner' ? (
          <LoadingSpinner text={loadingText} />
        ) : (
          <div className="space-y-6">
            <LoadingSkeleton 
              variant={skeletonType} 
              count={skeletonCount} 
            />
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error && showError) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`} style={{ minHeight }}>
        <div className="text-center max-w-md">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {errorTitle}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {errorMessage}
          </p>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`} style={{ minHeight }}>
        <div className="text-center max-w-md">
          {/* Empty Icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            {emptyIcon || (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {emptyTitle}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            {emptyMessage}
          </p>
          
          {emptyAction && (
            <div className="mt-4">
              {emptyAction}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Content state
  return <>{children}</>;
};

export default LoadingStateManager;