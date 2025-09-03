import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  return (
    <a
      href={href}
      className={`
        sr-only focus:not-sr-only 
        fixed top-4 left-4 z-[9999] 
        px-4 py-2 
        bg-purple-600 text-white 
        rounded-lg font-medium 
        transition-all duration-200
        focus:outline-2 focus:outline-purple-300 focus:outline-offset-2
        hover:bg-purple-700
        ${className}
      `}
      tabIndex={0}
    >
      {children}
    </a>
  );
};

export default SkipLink;