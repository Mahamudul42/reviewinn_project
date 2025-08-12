import { useState, useEffect, useCallback } from 'react';
import { reviewinnLeftPanelService, type ReviewInnLeftPanelData } from '../../../api/services/reviewinnLeftPanelService';

interface UseReviewInnLeftPanelReturn {
  data: ReviewInnLeftPanelData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useReviewInnLeftPanel = (): UseReviewInnLeftPanelReturn => {
  const [data, setData] = useState<ReviewInnLeftPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reviewinnLeftPanelService.getReviewInnLeftPanelData();
      setData(result);
    } catch (err) {
      console.error('Error fetching ReviewInn left panel data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};