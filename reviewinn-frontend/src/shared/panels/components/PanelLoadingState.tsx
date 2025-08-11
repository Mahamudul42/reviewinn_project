import React from 'react';
import PanelHeader from './PanelHeader';
import { PANEL_STYLES, LOADING_CARD_CONFIG } from '../styles';

interface PanelLoadingStateProps {
  title: string;
  subtitle: string;
  cardCount?: number;
  className?: string;
}

/**
 * Reusable loading state component for panels
 * Provides consistent loading UI across all panel variants
 */
const PanelLoadingState: React.FC<PanelLoadingStateProps> = ({
  title,
  subtitle,
  cardCount = LOADING_CARD_CONFIG.defaultCount,
  className = '',
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <PanelHeader title={title} subtitle={subtitle} />
      <div className={PANEL_STYLES.loadingContainer}>
        {[...Array(cardCount)].map((_, i) => (
          <div key={i} className={LOADING_CARD_CONFIG.getCardClasses()}>
            <div className={LOADING_CARD_CONFIG.getInnerClasses()}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PanelLoadingState;