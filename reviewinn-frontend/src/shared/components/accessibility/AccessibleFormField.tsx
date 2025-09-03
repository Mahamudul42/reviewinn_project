import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement;
}

const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  error,
  helpText,
  required = false,
  className = '',
  children
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className={`space-y-1 ${className}`}>
      <label 
        htmlFor={id} 
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <>
            <span className="text-red-500 ml-1" aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </label>
      
      <div className="relative">
        {React.cloneElement(children, {
          id,
          'aria-describedby': describedBy,
          'aria-invalid': !!error,
          'aria-required': required
        })}
        
        {/* Error state indicator */}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>
      
      {/* Help text */}
      {helpText && (
        <div className="flex items-start space-x-2">
          <HelpCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p id={helpId} className="text-sm text-gray-600">
            {helpText}
          </p>
        </div>
      )}
      
      {/* Error message with live region */}
      {error && (
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p 
            id={errorId} 
            className="text-sm text-red-600" 
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default AccessibleFormField;