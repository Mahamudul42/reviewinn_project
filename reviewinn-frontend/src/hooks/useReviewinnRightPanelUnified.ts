import { useState, useEffect, useCallback } from 'react';
import { reviewinnRightPanelService } from '../api/services';
import { useUnifiedAuth } from './useUnifiedAuth';
import type { 
  ReviewInnRightPanelPublicData, 
  ReviewInnRightPanelAuthData 
} from '../api/services/reviewinnRightPanelService';

export interface UseReviewinnRightPanelUnifiedReturn {
  publicData: ReviewInnRightPanelPublicData | null;
  authData: ReviewInnRightPanelAuthData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
}

export const useReviewinnRightPanelUnified = (): UseReviewinnRightPanelUnifiedReturn => {
  const { user, isAuthenticated } = useUnifiedAuth();
  const [publicData, setPublicData] = useState<ReviewInnRightPanelPublicData | null>(null);
  const [authData, setAuthData] = useState<ReviewInnRightPanelAuthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isAuthenticated && user) {
        // Fetch authenticated data
        console.log('🔍 Fetching authenticated right panel data...');
        const data = await reviewinnRightPanelService.getAuthenticatedData();
        console.log('✅ Authenticated data received:', data);
        setAuthData(data);
        setPublicData(null); // Clear public data when authenticated
      } else {
        // Fetch public data
        console.log('🔍 Fetching public right panel data...');
        const data = await reviewinnRightPanelService.getPublicData();
        console.log('✅ Public data received:', data);
        setPublicData(data);
        setAuthData(null); // Clear auth data when not authenticated
      }
    } catch (err: any) {
      console.error('❌ Error fetching right panel data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // Handle different error types
      if (err.response?.status === 401) {
        setError('Authentication required for personalized data');
        // If auth fails, try to fetch public data as fallback
        if (isAuthenticated) {
          try {
            console.log('🔄 Auth failed, falling back to public data...');
            const fallbackData = await reviewinnRightPanelService.getPublicData();
            setPublicData(fallbackData);
            setAuthData(null);
            setError(null); // Clear error if fallback succeeds
          } catch (fallbackErr) {
            console.error('❌ Fallback to public data also failed:', fallbackErr);
          }
        }
      } else if (err.response?.status === 404) {
        setError('Right panel service not found');
      } else if (err.response?.status === 500) {
        setError('Server error loading right panel data');
      } else if (err.code === 'NETWORK_ERROR') {
        setError('Network error - please check your connection');
      } else {
        setError(err.response?.data?.message || `Failed to load right panel data: ${err.message}`);
      }
      
      // Clear data on error (unless we have fallback data)
      if (!publicData) {
        setPublicData(null);
        setAuthData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, publicData]);

  // Fetch data when authentication state changes
  useEffect(() => {
    fetchData();
  }, [isAuthenticated, user?.id]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    publicData,
    authData,
    loading,
    error,
    isAuthenticated,
    refetch
  };
};