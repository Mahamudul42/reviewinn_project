import { useState, useEffect, useCallback } from 'react';
import { optimizedHomepageService } from '../../../api/services/optimizedHomepageService';
import type { Review } from '../../../types';

interface UseOptimizedHomepageReturn {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  hasMoreReviews: boolean;
  loadingMore: boolean;
  loadInitialData: () => Promise<void>;
  handleLoadMore: () => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useOptimizedHomepage = (): UseOptimizedHomepageReturn => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await optimizedHomepageService.getHomepageReviews(15);
      setReviews(data.reviews);
      setHasMoreReviews(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more reviews
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreReviews) return;
    
    setLoadingMore(true);
    try {
      const data = await optimizedHomepageService.loadMoreReviews(reviews.length, 10);
      setReviews(data.reviews);
      setHasMoreReviews(data.hasMore);
    } catch (err) {
      console.error('Error loading more reviews:', err);
      setError('Failed to load more reviews');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreReviews, reviews.length]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setError(null);
    try {
      const data = await optimizedHomepageService.refreshHomepage();
      setReviews(data.reviews);
      setHasMoreReviews(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    reviews,
    loading,
    error,
    hasMoreReviews,
    loadingMore,
    loadInitialData,
    handleLoadMore,
    refreshData,
  };
};