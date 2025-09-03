import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface NavIconProps {
  icon: LucideIcon;
  className?: string;
}

const NavIcon: React.FC<NavIconProps> = ({ icon: Icon, className = '' }) => (
  <Icon className={`w-5 h-5 ${className}`} aria-hidden="true" />
);

export default NavIcon; 