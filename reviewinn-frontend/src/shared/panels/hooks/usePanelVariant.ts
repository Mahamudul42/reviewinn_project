import { useMemo } from 'react';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { PANEL_VARIANTS, PANEL_LIMITS, getFeatures, getLimits, type PanelVariant } from '../config';

/**
 * Hook to determine which panel variant to render based on authentication status
 */
export const usePanelVariant = () => {
  const { isAuthenticated, user } = useUnifiedAuth();

  const variant: PanelVariant = useMemo(() => {
    return isAuthenticated ? PANEL_VARIANTS.AUTHENTICATED : PANEL_VARIANTS.PUBLIC;
  }, [isAuthenticated]);

  const config = useMemo(() => ({
    variant,
    isAuthenticated,
    user,
    limits: getLimits(variant),
    features: getFeatures(variant),
  }), [variant, isAuthenticated, user]);

  return config;
};

export type PanelVariantConfig = ReturnType<typeof usePanelVariant>;