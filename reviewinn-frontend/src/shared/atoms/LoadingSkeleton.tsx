import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'circle' | 'rectangle' | 'review' | 'list';
  count?: number;
  className?: string;
  animate?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangle',
  count = 1,
  className = '',
  animate = true
}) => {
  const baseClasses = `bg-gray-200 ${animate ? 'animate-pulse' : ''} ${className}`;

  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`${baseClasses} p-6 rounded-xl space-y-4`}>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/6"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
            <div className="flex space-x-4">
              <div className="h-8 bg-gray-300 rounded w-20"></div>
              <div className="h-8 bg-gray-300 rounded w-24"></div>
              <div className="h-8 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className={`${baseClasses} p-6 rounded-xl space-y-6`}>
            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-32"></div>
                <div className="h-3 bg-gray-300 rounded w-24"></div>
              </div>
            </div>
            
            {/* Entity info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-12 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-300 rounded w-48"></div>
                <div className="h-3 bg-gray-300 rounded w-32"></div>
              </div>
            </div>
            
            {/* Rating */}
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-5 h-5 bg-gray-300 rounded"></div>
              ))}
            </div>
            
            {/* Content */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-11/12"></div>
              <div className="h-4 bg-gray-300 rounded w-4/5"></div>
            </div>
            
            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="flex space-x-6">
                <div className="h-6 bg-gray-300 rounded w-16"></div>
                <div className="h-6 bg-gray-300 rounded w-20"></div>
                <div className="h-6 bg-gray-300 rounded w-14"></div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <div className={`h-4 ${baseClasses} rounded`}></div>
            <div className={`h-4 ${baseClasses} rounded w-5/6`}></div>
            <div className={`h-4 ${baseClasses} rounded w-4/6`}></div>
          </div>
        );

      case 'circle':
        return <div className={`w-12 h-12 ${baseClasses} rounded-full`}></div>;

      case 'list':
        return (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className={`w-10 h-10 ${baseClasses} rounded-full`}></div>
                <div className="flex-1 space-y-2">
                  <div className={`h-4 ${baseClasses} rounded w-3/4`}></div>
                  <div className={`h-3 ${baseClasses} rounded w-1/2`}></div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <div className={`h-4 ${baseClasses} rounded`}></div>;
    }
  };

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;