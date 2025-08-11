import React from 'react';
import NavIcon from '../atoms/NavIcon';
import NavBadge from '../atoms/NavBadge';
import type { LucideIcon } from 'lucide-react';

interface CategoryFilterItemProps {
  id: string | null;
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  hoverColor: string;
  count: number;
  selected: boolean;
  onClick: (id: string | null) => void;
}

const CategoryFilterItem: React.FC<CategoryFilterItemProps> = ({
  id, label, icon, color, bgColor, hoverColor, count, selected, onClick
}) => (
  <button
    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg mb-1 transition-all ${bgColor} ${hoverColor} ${selected ? 'ring-2 ring-blue-400' : ''}`}
    onClick={() => onClick(id)}
  >
    <NavIcon icon={icon} className={`w-5 h-5 ${color}`} />
    <span className="flex-1 text-left font-medium text-sm">{label}</span>
    <NavBadge count={count} colorClass={`${color} bg-white`} />
  </button>
);

export default CategoryFilterItem; 