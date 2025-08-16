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

  // Enterprise-grade reactive auth state management
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      console.log('🔄 useReviewInnLeftPanel: Auth state changed, refetching data', event.detail);
      setTimeout(() => {
        fetchData();
      }, 400);
    };

    const handleLoginSuccess = () => {
      console.log('🔄 useReviewInnLeftPanel: Login success, refetching data');
      setTimeout(() => {
        fetchData();
      }, 500);
    };

    const handleUserRegistered = (event: CustomEvent) => {
      console.log('🔄 useReviewInnLeftPanel: User registered, refetching data', event.detail);
      setTimeout(() => {
        fetchData();
      }, 700);
    };

    // Add event listeners for reactive auth updates
    window.addEventListener('authStateChanged', handleAuthStateChange as EventListener);
    window.addEventListener('loginSuccess', handleLoginSuccess as EventListener);
    window.addEventListener('userRegistered', handleUserRegistered as EventListener);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange as EventListener);
      window.removeEventListener('loginSuccess', handleLoginSuccess as EventListener);
      window.removeEventListener('userRegistered', handleUserRegistered as EventListener);
    };
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