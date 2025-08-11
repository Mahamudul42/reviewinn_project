import React from 'react';

interface PanelContainerProps {
  children: React.ReactNode;
  position: 'left' | 'middle' | 'right';
  variant: 'public' | 'authenticated';
  className?: string;
}

/**
 * Common container wrapper for all panels
 * Provides consistent styling and behavior
 */
const PanelContainer: React.FC<PanelContainerProps> = ({
  children,
  position,
  variant,
  className = '',
}) => {
  const positionClasses = {
    left: 'w-72 flex-shrink-0',
    middle: 'flex-1 min-w-0',
    right: 'w-72 flex-shrink-0',
  };

  const variantClasses = {
    public: 'bg-gray-50',
    authenticated: 'bg-white',
  };

  return (
    <div 
      className={`
        ${positionClasses[position]} 
        ${variantClasses[variant]} 
        ${className}
      `}
      data-panel-position={position}
      data-panel-variant={variant}
    >
      {children}
    </div>
  );
};

export default PanelContainer;