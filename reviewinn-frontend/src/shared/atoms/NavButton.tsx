import React from 'react';

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, children, className = '', ...props }) => (
  <button
    className={`flex items-center space-x-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
      active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default NavButton; 