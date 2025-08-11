import React from 'react';
import NavTab from '../molecules/NavTab';
import type { LucideIcon } from 'lucide-react';

interface NavTabsProps {
  tabs: { id: string; label: string; icon: LucideIcon }[];
  activeTab: string;
  onTabClick: (id: string) => void;
}

const NavTabs: React.FC<NavTabsProps> = ({ tabs, activeTab, onTabClick }) => (
  <div className="flex bg-gray-100 rounded-lg p-1">
    {tabs.map(tab => (
      <NavTab
        key={tab.id}
        id={tab.id}
        label={tab.label}
        icon={tab.icon}
        active={activeTab === tab.id}
        onClick={() => onTabClick(tab.id)}
      />
    ))}
  </div>
);

export default NavTabs; 