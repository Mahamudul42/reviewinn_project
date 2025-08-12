import { useState, useEffect, useCallback } from 'react';
import { testLeftPanelService, type TestLeftPanelData } from '../../../api/services/testLeftPanelService';

interface UseTestLeftPanelReturn {
  data: TestLeftPanelData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for managing test left panel data
 * Fetches top reviews, categories, and reviewers based on engagement scoring
 */
export const useTestLeftPanel = (): UseTestLeftPanelReturn => {
  const [data, setData] = useState<TestLeftPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await testLeftPanelService.getTestLeftPanelData();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load test left panel data';
      setError(errorMessage);
      console.error('useTestLeftPanel: Error fetching data:', err);
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