import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({ 
  children, 
  className = '',
  as: Component = 'span'
}) => {
  return (
    <Component
      className={`sr-only ${className}`}
      aria-hidden="false"
    >
      {children}
    </Component>
  );
};

export default ScreenReaderOnly;