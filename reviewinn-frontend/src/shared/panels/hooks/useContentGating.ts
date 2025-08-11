import { useMemo } from 'react';
import { PANEL_LIMITS } from '../config';

interface UseContentGatingProps<T> {
  items: T[];
  isAuthenticated: boolean;
  publicLimit: number;
  enableGating?: boolean;
}

/**
 * Improved content gating logic extracted from existing useGatedContent
 * Handles limiting content for public users with consistent patterns
 */
export const useContentGating = <T>({
  items,
  isAuthenticated,
  publicLimit,
  enableGating = true,
}: UseContentGatingProps<T>) => {
  const gatedResult = useMemo(() => {
    if (!enableGating || isAuthenticated) {
      return {
        visibleItems: items,
        hiddenCount: 0,
        isGated: false,
        hasMoreContent: false,
      };
    }

    const visibleItems = items.slice(0, publicLimit);
    const hiddenCount = Math.max(0, items.length - publicLimit);
    const isGated = hiddenCount > 0;
    const hasMoreContent = items.length > publicLimit;

    return {
      visibleItems,
      hiddenCount,
      isGated,
      hasMoreContent,
    };
  }, [items, isAuthenticated, publicLimit, enableGating]);

  return gatedResult;
};

/**
 * Specialized hooks for common gating scenarios
 */
export const useReviewGating = <T>(
  reviews: T[],
  isAuthenticated: boolean,
  customLimit?: number
) => {
  return useContentGating({
    items: reviews,
    isAuthenticated,
    publicLimit: customLimit || PANEL_LIMITS.PUBLIC_REVIEWS,
  });
};

export const useEntityGating = <T>(
  entities: T[],
  isAuthenticated: boolean,
  customLimit?: number
) => {
  return useContentGating({
    items: entities,
    isAuthenticated,
    publicLimit: customLimit || PANEL_LIMITS.PUBLIC_ENTITIES,
  });
};