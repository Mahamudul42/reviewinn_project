import React from 'react';
import NavButton from '../atoms/NavButton';
import NavIcon from '../atoms/NavIcon';
import type { LucideIcon } from 'lucide-react';

interface NavTabProps {
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}

const NavTab: React.FC<NavTabProps> = ({ label, icon, active, onClick }) => (
  <NavButton active={active} onClick={onClick} className="flex-1 justify-center">
    <NavIcon icon={icon} className="w-4 h-4" />
    <span className="hidden lg:inline">{label}</span>
  </NavButton>
);

export default NavTab; 