import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

export default FormInput; 