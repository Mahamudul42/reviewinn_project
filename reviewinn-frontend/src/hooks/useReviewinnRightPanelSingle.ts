import { useState, useEffect, useCallback } from 'react';
import { reviewinnRightPanelService } from '../api/services';
import { useUnifiedAuth } from './useUnifiedAuth';

export interface UseReviewinnRightPanelSingleReturn {
  data: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
}

export const useReviewinnRightPanelSingle = (): UseReviewinnRightPanelSingleReturn => {
  const { isAuthenticated } = useUnifiedAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching unified right panel data with auth status:', isAuthenticated);
      const response = await reviewinnRightPanelService.getUnifiedData(isAuthenticated);
      console.log('✅ Unified data received:', response);
      setData(response);
    } catch (err: any) {
      console.error('❌ Error fetching unified right panel data:', err);
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
  }, [isAuthenticated]);

  // Fetch data on mount and when auth changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Enterprise-grade reactive auth state management
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      console.log('🔄 useReviewinnRightPanelSingle: Auth state changed, refetching data', event.detail);
      setTimeout(() => {
        fetchData();
      }, 200);
    };

    const handleLoginSuccess = () => {
      console.log('🔄 useReviewinnRightPanelSingle: Login success, refetching data');
      setTimeout(() => {
        fetchData();
      }, 300);
    };

    const handleUserRegistered = (event: CustomEvent) => {
      console.log('🔄 useReviewinnRightPanelSingle: User registered, refetching data', event.detail);
      setTimeout(() => {
        fetchData();
      }, 500);
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

  // Also refetch when isAuthenticated changes (backup mechanism)
  useEffect(() => {
    console.log('🔄 useReviewinnRightPanelSingle: Auth status changed to:', isAuthenticated);
    setTimeout(() => {
      fetchData();
    }, 100);
  }, [isAuthenticated, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    isAuthenticated,
    refetch
  };
};