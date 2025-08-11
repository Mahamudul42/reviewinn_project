import React from 'react';
import EnhancedGatedContent from './EnhancedGatedContent';
import { calculateAdaptiveLimit } from '../../config/gating';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface AdaptiveGatedContentProps {
  children: React.ReactNode;
  totalItems: number;
  preferredLimit?: number;
  onAuthSuccess?: () => void;
  gateMessage?: {
    title: string;
    subtitle: string;
    benefits: string[];
  };
}

const AdaptiveGatedContent: React.FC<AdaptiveGatedContentProps> = ({
  children,
  totalItems,
  preferredLimit = 15,
  onAuthSuccess,
  gateMessage
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  // Calculate adaptive limit using centralized config
  const adaptiveLimit = calculateAdaptiveLimit(totalItems, preferredLimit);

  // Debug info - only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Adaptive Gating:', {
      totalItems,
      preferredLimit,
      adaptiveLimit,
      willShowGate: !isAuthenticated && totalItems > 0
    });
  }

  return (
    <EnhancedGatedContent
      publicItemsLimit={adaptiveLimit}
      totalItems={totalItems}
      onAuthSuccess={onAuthSuccess}
      gateMessage={gateMessage}
      showProgressBar={true}
      autoTriggerOnScroll={true}
    >
      {children}
    </EnhancedGatedContent>
  );
};

export default AdaptiveGatedContent;