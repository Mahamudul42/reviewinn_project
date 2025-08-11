import { useMemo } from 'react';

interface UseGatedContentOptions {
  publicLimit?: number;
  feature?: 'reviews' | 'comments' | 'reactions' | 'details';
}

interface UseGatedContentReturn<T> {
  visibleItems: T[];
  isGated: boolean;
  gatedItemsCount: number;
  shouldShowGate: boolean;
  canAccess: (index: number) => boolean;
  requiresAuth: (action: string) => boolean;
}

export const useGatedContent = <T>(
  items: T[],
  isAuthenticated: boolean,
  options: UseGatedContentOptions = {}
): UseGatedContentReturn<T> => {
  const { publicLimit = 15, feature = 'reviews' } = options;

  const result = useMemo(() => {
    const totalItems = items.length;
    const isGated = !isAuthenticated && totalItems > publicLimit;
    const visibleItems = isAuthenticated ? items : items.slice(0, publicLimit);
    const gatedItemsCount = Math.max(0, totalItems - publicLimit);
    const shouldShowGate = isGated && totalItems > 0;

    const canAccess = (index: number): boolean => {
      if (isAuthenticated) return true;
      return index < publicLimit;
    };

    const requiresAuth = (action: string): boolean => {
      if (isAuthenticated) return false;
      
      // Actions that always require auth for non-authenticated users
      const authRequiredActions = [
        'comment',
        'react',
        'write_review',
        'follow',
        'bookmark',
        'share_detailed'
      ];
      
      return authRequiredActions.includes(action);
    };

    return {
      visibleItems,
      isGated,
      gatedItemsCount,
      shouldShowGate,
      canAccess,
      requiresAuth
    };
  }, [items, isAuthenticated, publicLimit]);

  return result;
};

// Hook for specific review gating logic
export const useReviewGating = (
  reviews: any[],
  isAuthenticated: boolean,
  publicLimit: number = 15
) => {
  return useGatedContent(reviews, isAuthenticated, { 
    publicLimit, 
    feature: 'reviews' 
  });
};

// Hook for comment gating (more restrictive)
export const useCommentGating = (
  comments: any[],
  isAuthenticated: boolean,
  publicLimit: number = 3
) => {
  return useGatedContent(comments, isAuthenticated, { 
    publicLimit, 
    feature: 'comments' 
  });
};

export default useGatedContent;