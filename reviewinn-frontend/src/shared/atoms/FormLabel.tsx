import React from 'react';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  className?: string;
}

const FormLabel: React.FC<FormLabelProps> = ({ children, required, className = '', ...props }) => (
  <label className={`block text-sm font-medium text-gray-700 mb-2 ${className}`} {...props}>
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export default FormLabel; 