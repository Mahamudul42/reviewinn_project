import React, { useState, useEffect } from 'react';
import Sidebar, { type SidebarSection } from './Sidebar';
import PersonalizedLeftPanelCards from './PersonalizedLeftPanelCards';
import { useLeftPanelData } from '../hooks/useLeftPanelData';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface UnifiedLeftPanelProps {
  className?: string;
}

const UnifiedLeftPanel: React.FC<UnifiedLeftPanelProps> = ({ 
  className = ""
}) => {
  const { reviews, entities, loading, error } = useLeftPanelData();
  const { user, isAuthenticated } = useUnifiedAuth();

  const sections: SidebarSection[] = [
    {
      type: 'trending-review',
      id: 'top-reviews',
      title: 'Top Reviews'
    },
    {
      type: 'top-categories',
      id: 'top-categories',
      title: 'Top Categories'
    },
    {
      type: 'top-reviewer',
      id: 'top-reviewers',
      title: 'Top Reviewers'
    },
    {
      type: 'reviewsite-info',
      id: 'reviewsite-info',
      title: 'ReviewInn'
    },
    {
      type: 'support-info',
      id: 'support-info',
      title: 'Support Center'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Personalized Section for Authenticated Users */}
      {isAuthenticated && user && (
        <PersonalizedLeftPanelCards user={user} />
      )}
      
      <div className="pb-4 bg-transparent">
        <h2 className="text-xl font-bold text-gray-900">
          {isAuthenticated ? 'Discover More' : 'Discover'}
        </h2>
        <p className="text-sm text-gray-600">
          {isAuthenticated 
            ? 'Trending content and community insights' 
            : 'Find trending content and get support'
          }
        </p>
      </div>
      
      <Sidebar 
        sections={sections}
        reviews={reviews}
        entities={entities}
        loading={loading}
        error={error}
        className="w-full"
      />
    </div>
  );
};

export default UnifiedLeftPanel;