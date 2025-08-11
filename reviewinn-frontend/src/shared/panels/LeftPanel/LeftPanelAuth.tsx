import React from 'react';
import Sidebar from '../../organisms/Sidebar';
import PersonalizedLeftPanelCards from '../../organisms/PersonalizedLeftPanelCards';
import { useLeftPanelData } from '../../hooks/useLeftPanelData';
import { COMMON_SIDEBAR_SECTIONS } from '../config';
import type { User } from '../../../types';
import PanelHeader from '../components/PanelHeader';
import PanelLoadingState from '../components/PanelLoadingState';

interface LeftPanelAuthProps {
  className?: string;
  user: User;
}

/**
 * Authenticated version of the left panel
 * Shows personalized content and discover sections for authenticated users
 */
const LeftPanelAuth: React.FC<LeftPanelAuthProps> = ({ 
  className = "",
  user
}) => {
  const { reviews, entities, loading, error } = useLeftPanelData();

  if (loading) {
    return (
      <PanelLoadingState
        title="Your Dashboard"
        subtitle="Loading your personalized content..."
        cardCount={6}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Personalized Section for Authenticated Users */}
      <PersonalizedLeftPanelCards user={user} />
      
      <PanelHeader
        title="Discover More"
        subtitle="Trending content and community insights"
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

export default LeftPanelAuth;