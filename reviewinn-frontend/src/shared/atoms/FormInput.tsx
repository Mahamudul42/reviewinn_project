import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: string;
  helpText?: string;
}

const FormInput: React.FC<FormInputProps> = ({ 
  className = '', 
  error, 
  helpText, 
  disabled, 
  required,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
  ...props 
}) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors';
  const normalClasses = 'border-gray-300 focus:ring-blue-500';
  const errorClasses = 'border-red-500 focus:ring-red-500';
  const disabledClasses = 'bg-gray-100 cursor-not-allowed text-gray-500 border-gray-200';
  
  const hasError = error || ariaInvalid === 'true' || ariaInvalid === true;
  
  const classes = `${baseClasses} ${
    hasError ? errorClasses : normalClasses
  } ${disabled ? disabledClasses : ''} ${className}`;

  return (
    <input
      className={classes}
      disabled={disabled}
      required={required}
      aria-disabled={disabled}
      aria-required={required}
      aria-invalid={hasError}
      aria-describedby={ariaDescribedBy}
      {...props}
    />
  );
};

export default FormInput; 