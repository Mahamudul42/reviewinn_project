import React from 'react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  className?: string;
  loading?: boolean;
}

const AuthButton: React.FC<AuthButtonProps> = ({ 
  variant = 'primary', 
  className = '', 
  disabled, 
  loading = false,
  children,
  ...props 
}) => {
  const isDisabled = disabled || loading;
  
  const base = 'w-full px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors relative';
  const primary = `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 ${
    isDisabled ? 'bg-gray-400 cursor-not-allowed' : ''
  }`;
  const secondary = `bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 ${
    isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
  }`;
  
  return (
    <button
      className={`${base} ${variant === 'primary' ? primary : secondary} ${className}`}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-describedby={loading ? 'loading-indicator' : undefined}
      {...props}
    >
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
      
      {loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          id="loading-indicator"
          aria-label="Loading"
          role="status"
        >
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="sr-only">Loading...</span>
        </div>
      )}
    </button>
  );
};

export default AuthButton; 