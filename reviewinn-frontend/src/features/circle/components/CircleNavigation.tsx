import React from 'react';
import { Users, Clock, TrendingUp, Settings, Search, Ban, Eye } from 'lucide-react';
import '../circle-purple-buttons.css';

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
    <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-purple-900">Circle Dashboard</h3>
            <p className="text-xs text-purple-600">Manage your review connections</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg border border-purple-200 shadow-sm">
          <span className="text-xs font-semibold text-purple-700">
            {tabs.find(tab => tab.id === activeTab)?.label}
          </span>
        </div>
      </div>
      
      {/* Desktop Navigation - Purple Theme Buttons */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-2">
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
                className={`relative overflow-hidden px-4 py-2 font-semibold text-sm transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 rounded-xl border ${
                  isActive
                    ? 'circle-nav-button-active'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 rounded-lg shadow-sm'
                }`}
              >
                {/* Shimmer Effect for active tab - like Create Entity button */}
                {isActive && (
                  <div className="absolute inset-0 -top-[1px] -bottom-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                )}
                {/* Content wrapper for proper z-index */}
                <div className="relative z-10 flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-5 h-5 rounded ${
                    isActive ? 'bg-white bg-opacity-20' : 'bg-purple-100'
                  }`}>
                    <Icon size={14} className={isActive ? 'text-white' : 'text-purple-600'} />
                  </div>
                  <span className="font-semibold">{tab.label}</span>
                  {tab.count !== undefined && (
                    <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive
                        ? 'bg-white bg-opacity-25 text-black'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {getCountText(tab.count)}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile/Tablet Navigation - Purple Theme Cards */}
      <div className="lg:hidden">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                className={`relative overflow-hidden p-3 rounded-xl text-left transition-all duration-300 transform hover:scale-105 border ${
                  isActive
                    ? 'circle-nav-button-active'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
                }`}
              >
                {/* Shimmer Effect for active tab */}
                {isActive && (
                  <div className="absolute inset-0 -top-[1px] -bottom-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                )}
                <div className="space-y-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${
                      isActive ? 'bg-white bg-opacity-20' : 'bg-purple-100'
                    }`}>
                      <Icon size={18} className={isActive ? 'text-white' : 'text-purple-600'} />
                    </div>
                    {tab.count !== undefined && (
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-white bg-opacity-25 text-black'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {tab.count}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm truncate leading-tight ${
                      isActive ? 'text-white' : 'text-gray-800'
                    }`}>{tab.label}</h4>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CircleNavigation;