import React from 'react';

interface NavBadgeProps {
  count?: number | string;
  colorClass?: string;
  className?: string;
}

const NavBadge: React.FC<NavBadgeProps> = ({ count, colorClass = 'bg-blue-500 text-white', className = '' }) => {
  if (count === undefined || count === null) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colorClass} ${className}`}>
      {count}
    </span>
  );
};

export default NavBadge; 