import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  'aria-label'?: string;
}

const starSizes = {
  sm: 16,
  md: 32,
  lg: 48,
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...',
  className = '',
  'aria-label': ariaLabel
}) => {
  const starSize = starSizes[size] || 32;
  const loadingLabel = ariaLabel || (text ? `Loading: ${text}` : 'Loading content');
  
  return (
    <div 
      className={`flex flex-col items-center justify-center py-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={loadingLabel}
    >
      <div className="flex space-x-2 mb-2" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className="animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
            width={starSize} height={starSize} viewBox="0 0 24 24" fill="#fbbf24"
            aria-hidden="true"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        ))}
      </div>
      
      {/* Screen reader text */}
      <span className="sr-only">{loadingLabel}</span>
      
      {text && (
        <p className="mt-2 text-sm text-gray-600 animate-pulse" aria-hidden="true">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
