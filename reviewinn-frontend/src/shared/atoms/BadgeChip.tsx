import React from 'react';

interface BadgeChipProps {
  label: string;
  className?: string;
}

const BadgeChip: React.FC<BadgeChipProps> = ({ label, className = '' }) => (
  <span className={`inline-flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-sm font-medium shadow ${className}`}>
    🏵️ {label}
  </span>
);

export default BadgeChip; 