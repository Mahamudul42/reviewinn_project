import React from 'react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import UnifiedLeftPanel from '../organisms/UnifiedLeftPanel';
import RightPanelReviewinn from './RightPanel/RightPanelReviewinn';

interface PanelFactoryProps {
  position: 'left' | 'middle' | 'right';
  [key: string]: any;
}

export const PanelFactory: React.FC<PanelFactoryProps> = ({ position, ...props }) => {
  const { isAuthenticated } = useUnifiedAuth();

  switch (position) {
    case 'left':
      return <UnifiedLeftPanel {...props} />;
    case 'right':
      return <RightPanelReviewinn {...props} />;
    case 'middle':
      // For now, return null for middle panel
      // This can be expanded to include middle panel components
      return null;
    default:
      return null;
  }
};
