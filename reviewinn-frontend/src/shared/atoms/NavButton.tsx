import React from 'react';

interface NavButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, children, className = '', ...props }) => (
  <button
    type="button"
    className={`flex items-center space-x-1 py-2 px-3 rounded-md text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
      active ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-purple-600'
    } ${className}`}
    aria-pressed={active}
    {...props}
  >
    {children}
  </button>
);

export default NavButton; 