import React from 'react';

interface BadgeChipProps {
  label: string;
  className?: string;
  'aria-label'?: string;
}

const BadgeChip: React.FC<BadgeChipProps> = ({ 
  label, 
  className = '', 
  'aria-label': ariaLabel 
}) => (
  <span 
    className={`inline-flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-sm font-medium shadow ${className}`}
    role="status"
    aria-label={ariaLabel || `Badge: ${label}`}
  >
    <span aria-hidden="true">🏵️</span>
    <span>{label}</span>
  </span>
);

export default BadgeChip; 