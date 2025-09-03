import React from 'react';

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  className?: string;
}

const FormButton: React.FC<FormButtonProps> = ({ variant = 'primary', className = '', disabled, ...props }) => {
  const base = 'px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const primary = `bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 ${
    disabled ? 'bg-gray-400 cursor-not-allowed' : ''
  }`;
  const secondary = `bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 ${
    disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
  }`;
  
  return (
    <button
      className={`${base} ${variant === 'primary' ? primary : secondary} ${className}`}
      disabled={disabled}
      aria-disabled={disabled}
      {...props}
    />
  );
};

export default FormButton; 