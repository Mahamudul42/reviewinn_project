import React from 'react';
import { PANEL_STYLES } from '../styles';

interface PanelHeaderProps {
  title: string;
  subtitle: string;
  className?: string;
}

/**
 * Reusable panel header component
 * Provides consistent styling for all panel titles and subtitles
 */
const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`${PANEL_STYLES.panelHeader} ${className}`}>
      <h2 className={PANEL_STYLES.panelTitle}>{title}</h2>
      <p className={PANEL_STYLES.panelSubtitle}>{subtitle}</p>
    </div>
  );
};

export default PanelHeader;