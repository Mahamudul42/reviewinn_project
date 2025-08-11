import React from 'react';
import { Users, Clock, TrendingUp, Settings, Search, Ban, Eye } from 'lucide-react';

interface Tab {
  id: 'members' | 'invites' | 'sent' | 'suggestions' | 'search' | 'analytics' | 'blocked';
  label: string;
  icon: React.FC<{ size?: number; className?: string }>;
  count?: number;
}

interface CircleNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: Tab[];
}

const CircleNavigation: React.FC<CircleNavigationProps> = ({
  activeTab,
  onTabChange,
  tabs
}) => {
  return (
    <div className="px-4 py-2 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-t border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-md flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-900">Circle Dashboard</h3>
            <p className="text-xs text-gray-600">Choose your view</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-2 py-0.5 bg-white bg-opacity-70 backdrop-blur-sm rounded-full border border-white border-opacity-50 shadow-sm">
            <span className="text-xs font-medium text-purple-700">
              {tabs.find(tab => tab.id === activeTab)?.label}
            </span>
          </div>
        </div>
      </div>
      
      {/* Desktop Navigation - Premium Floating Pills */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const getCountText = (count?: number) => {
              if (count === undefined) return '';
              if (count === 0) return '0';
              if (count === 1) return '1';
              return count.toString();
            };
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative overflow-hidden px-2.5 py-1.5 rounded-md font-medium text-xs transition-all duration-300 transform hover:scale-105 flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30'
                    : 'bg-white bg-opacity-70 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-sm border border-white border-opacity-50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse opacity-20"></div>
                )}
                <div className={`p-0.5 rounded-sm ${
                  isActive 
                    ? 'bg-white bg-opacity-20' 
                    : 'bg-gradient-to-r from-purple-100 to-indigo-100'
                }`}>
                  <Icon size={10} className={isActive ? 'text-white' : 'text-purple-600'} />
                </div>
                <span className="relative z-10 font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <div className={`relative z-10 px-1 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-white bg-opacity-25 text-white'
                      : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700'
                  }`}>
                    {getCountText(tab.count)}
                  </div>
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile/Tablet Navigation - Premium Cards */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const getCountText = (count?: number) => {
              if (count === undefined) return 'No items';
              if (count === 0) return 'Empty';
              if (count === 1) return '1 item';
              return `${count} items`;
            };
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative overflow-hidden p-2 rounded-lg text-left transition-all duration-300 transform hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-white bg-opacity-70 backdrop-blur-sm hover:bg-white hover:shadow-md border border-white border-opacity-50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 animate-pulse opacity-20"></div>
                )}
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className={`p-1 rounded-md ${
                      isActive 
                        ? 'bg-white bg-opacity-20' 
                        : 'bg-gradient-to-r from-purple-100 to-indigo-100'
                    }`}>
                      <Icon size={14} className={isActive ? 'text-white' : 'text-purple-600'} />
                    </div>
                    {tab.count !== undefined && (
                      <div className={`px-1 py-0.5 rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-white bg-opacity-25 text-white'
                          : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700'
                      }`}>
                        {tab.count}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs truncate leading-tight">{tab.label}</h4>
                    <p className={`text-xs leading-tight ${
                      isActive ? 'text-white text-opacity-80' : 'text-gray-600'
                    }`}>
                      {getCountText(tab.count)}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CircleNavigation;