/**
 * Groups Tab Navigation Component
 */

import React from 'react';
import { Users, Compass, Plus } from 'lucide-react';

export type TabType = 'your-groups' | 'discover' | 'create';

interface GroupsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const GroupsTabs: React.FC<GroupsTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'your-groups' as TabType, label: 'Your Groups', icon: Users },
    { id: 'discover' as TabType, label: 'Discover', icon: Compass },
    { id: 'create' as TabType, label: 'Create', icon: Plus },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2 inline" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};