import React from 'react';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const FormTextarea: React.FC<FormTextareaProps> = ({ className = '', disabled, 'aria-invalid': ariaInvalid, ...props }) => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-y';
  const normalClasses = 'border-gray-300 focus:ring-blue-500';
  const errorClasses = 'border-red-500 focus:ring-red-500';
  const disabledClasses = 'bg-gray-100 cursor-not-allowed text-gray-500';
  
  const classes = `${baseClasses} ${
    ariaInvalid === 'true' || ariaInvalid === true ? errorClasses : normalClasses
  } ${disabled ? disabledClasses : ''} ${className}`;

  return (
    <textarea
      className={classes}
      disabled={disabled}
      aria-disabled={disabled}
      aria-invalid={ariaInvalid}
      {...props}
    />
  );
};

export default FormTextarea; 