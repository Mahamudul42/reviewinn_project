import React from 'react';

interface FormErrorProps {
  message?: string;
  className?: string;
}

const FormError: React.FC<FormErrorProps> = ({ message, className = '' }) => {
  if (!message) return null;
  return <div className={`text-sm text-red-600 mt-1 ${className}`}>{message}</div>;
};

export default FormError; 