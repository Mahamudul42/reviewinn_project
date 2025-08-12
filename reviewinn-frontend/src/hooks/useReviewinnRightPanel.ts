import { useState, useEffect, useCallback } from 'react';
import { reviewinnRightPanelService } from '../api/services';
import type { ReviewInnRightPanelData } from '../api/services';

export interface UseReviewinnRightPanelReturn {
  data: ReviewInnRightPanelData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useReviewinnRightPanel = (): UseReviewinnRightPanelReturn => {
  const [data, setData] = useState<ReviewInnRightPanelData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting to fetch right panel data...');
      const rightPanelData = await reviewinnRightPanelService.getRightPanelData();
      console.log('✅ Right panel data received:', rightPanelData);
      setData(rightPanelData);
    } catch (err: any) {
      console.error('❌ Error fetching right panel data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Handle different error types
      if (err.response?.status === 404) {
        setError('Right panel service not found');
      } else if (err.response?.status === 500) {
        setError('Server error loading right panel data');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error - please check your connection');
      } else {
        setError(err.response?.data?.message || `Failed to load right panel data: ${err.message}`);
      }
      
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
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
    refetch
  };
};