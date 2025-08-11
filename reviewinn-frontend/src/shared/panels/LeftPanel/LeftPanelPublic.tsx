import React from 'react';
import Sidebar from '../../organisms/Sidebar';
import { useLeftPanelData } from '../../hooks/useLeftPanelData';
import { COMMON_SIDEBAR_SECTIONS } from '../config';
import PanelHeader from '../components/PanelHeader';
import PanelLoadingState from '../components/PanelLoadingState';

interface LeftPanelPublicProps {
  className?: string;
}

/**
 * Public version of the left panel
 * Shows discover content for unauthenticated users
 */
const LeftPanelPublic: React.FC<LeftPanelPublicProps> = ({ 
  className = ""
}) => {
  const { reviews, entities, loading, error } = useLeftPanelData();

  if (loading) {
    return (
      <PanelLoadingState
        title="Discover"
        subtitle="Loading trending content..."
        cardCount={6}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <PanelHeader
        title="Discover"
        subtitle="Find trending content and get support"
      />
      
      <Sidebar 
        sections={COMMON_SIDEBAR_SECTIONS}
        reviews={reviews}
        entities={entities}
        loading={loading}
        error={error}
        className="w-full"
      />
    </div>
  );
};

export default LeftPanelPublic;