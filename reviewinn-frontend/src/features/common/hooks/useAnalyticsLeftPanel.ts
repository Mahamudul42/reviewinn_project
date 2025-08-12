import { useState, useEffect, useCallback } from 'react';
import { analyticsLeftPanelService, type AnalyticsLeftPanelData } from '../../../api/services/analyticsLeftPanelService';

interface UseAnalyticsLeftPanelReturn {
  data: AnalyticsLeftPanelData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing analytics-based left panel data
 * Independent hook that can be used across any page
 * Fetches top reviews, categories, and reviewers based on analytics scoring
 */
export const useAnalyticsLeftPanel = (): UseAnalyticsLeftPanelReturn => {
  const [data, setData] = useState<AnalyticsLeftPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await analyticsLeftPanelService.getAnalyticsData();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data';
      setError(errorMessage);
      console.error('useAnalyticsLeftPanel: Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
};