import React from 'react';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const base = 'w-full px-4 py-2 rounded-lg font-semibold focus:outline-none transition-colors';
  const primary = 'bg-blue-600 text-white hover:bg-blue-700';
  const secondary = 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  return (
    <button
      className={`${base} ${variant === 'primary' ? primary : secondary} ${className}`}
      {...props}
    />
  );
};

export default AuthButton; 