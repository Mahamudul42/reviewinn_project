import React from 'react';
import FormLabel from '../atoms/FormLabel';
import FormError from '../atoms/FormError';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, required, error, children, className = '' }) => (
  <div className={`mb-4 ${className}`}>
    <FormLabel required={required}>{label}</FormLabel>
    {children}
    <FormError message={error} />
  </div>
);

export default FormField; 