/**
 * ENTERPRISE REACTION HOOK
 * 
 * Industry-standard React hook for reaction state management with:
 * - Automatic server synchronization
 * - Cross-browser session persistence
 * - Optimistic updates with error recovery
 * - Real-time state synchronization
 * - Comprehensive error handling
 * 
 * @author ReviewInn Engineering Team
 * @version 2.0.0 Enterprise
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { enterpriseReactionStateManager, ReactionState } from '../services/EnterpriseReactionStateManager';
import { useUnifiedAuth } from './useUnifiedAuth';

export interface EnterpriseReactionHookResult {
  // Current state
  reactions: Record<string, number>;
  userReaction?: string;
  isLoading: boolean;
  error: string | null;
  
  // Metadata
  lastUpdated: number;
  source: 'server' | 'optimistic' | 'cache';
  
  // Actions
  setReaction: (reactionType: string | null) => Promise<void>;
  refreshReactions: () => Promise<void>;
  
  // Enterprise features
  isOptimistic: boolean;
  retryCount: number;
}

export const useEnterpriseReactions = (reviewId: string): EnterpriseReactionHookResult => {
  const { isAuthenticated, user } = useUnifiedAuth();
  const [state, setState] = useState<ReactionState>({
    reviewId,
    reactions: {},
    userReaction: undefined,
    lastUpdated: 0,
    source: 'cache'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const subscriptionRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  // Subscribe to state manager updates
  useEffect(() => {
    if (!reviewId) return;

    const unsubscribe = enterpriseReactionStateManager.subscribe(reviewId, (newState) => {
      if (mountedRef.current) {
        setState(newState);
        setError(null);
        
        console.log(`🏢 useEnterpriseReactions: State updated for ${reviewId}`, {
          reactions: newState.reactions,
          userReaction: newState.userReaction,
          source: newState.source,
          isAuthenticated,
          userId: user?.id || user?.user_id
        });
      }
    });

    subscriptionRef.current = unsubscribe;
    return unsubscribe;
  }, [reviewId, isAuthenticated, user?.id, user?.user_id]);

  // Initial data loading with authentication-aware caching
  useEffect(() => {
    if (!reviewId) return;

    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`🏢 useEnterpriseReactions: Loading initial data for ${reviewId}`, {
          isAuthenticated,
          userId: user?.id || user?.user_id
        });

        const initialState = await enterpriseReactionStateManager.getReactionState(reviewId, false);
        
        if (mountedRef.current) {
          setState(initialState);
          console.log(`🏢 useEnterpriseReactions: Initial state loaded for ${reviewId}`, initialState);
        }
      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load reactions';
          setError(errorMessage);
          console.error(`🏢 useEnterpriseReactions: Initial load failed for ${reviewId}:`, err);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();
  }, [reviewId, isAuthenticated, user?.id, user?.user_id]);

  // Force refresh when authentication changes
  useEffect(() => {
    if (!reviewId) return;

    const handleAuthChange = async () => {
      console.log(`🏢 useEnterpriseReactions: Auth changed, force refreshing ${reviewId}`);
      
      try {
        setIsLoading(true);
        setError(null);
        
        const freshState = await enterpriseReactionStateManager.getReactionState(reviewId, true);
        
        if (mountedRef.current) {
          setState(freshState);
          console.log(`🏢 useEnterpriseReactions: Force refresh completed for ${reviewId}`, freshState);
        }
      } catch (err) {
        if (mountedRef.current) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to refresh reactions';
          setError(errorMessage);
          console.error(`🏢 useEnterpriseReactions: Force refresh failed for ${reviewId}:`, err);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    // Listen for authentication events
    const authEvents = ['authLoginSuccess', 'userSessionChanged', 'tokenRefreshed'];
    authEvents.forEach(event => {
      window.addEventListener(event, handleAuthChange);
    });

    return () => {
      authEvents.forEach(event => {
        window.removeEventListener(event, handleAuthChange);
      });
    };
  }, [reviewId]);

  // Set reaction with enterprise error handling
  const setReaction = useCallback(async (reactionType: string | null) => {
    if (!reviewId) return;

    setIsLoading(true);
    setError(null);
    setRetryCount(0);

    try {
      console.log(`🏢 useEnterpriseReactions: Setting reaction for ${reviewId}`, {
        reactionType,
        currentUserReaction: state.userReaction,
        isAuthenticated,
        userId: user?.id || user?.user_id
      });

      await enterpriseReactionStateManager.updateReaction(reviewId, reactionType);
      
      console.log(`🏢 useEnterpriseReactions: Reaction set successfully for ${reviewId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update reaction';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      console.error(`🏢 useEnterpriseReactions: Failed to set reaction for ${reviewId}:`, err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [reviewId, state.userReaction, isAuthenticated, user?.id, user?.user_id]);

  // Refresh reactions from server
  const refreshReactions = useCallback(async () => {
    if (!reviewId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🏢 useEnterpriseReactions: Manual refresh for ${reviewId}`);
      
      const refreshedState = await enterpriseReactionStateManager.getReactionState(reviewId, true);
      
      if (mountedRef.current) {
        setState(refreshedState);
        console.log(`🏢 useEnterpriseReactions: Manual refresh completed for ${reviewId}`, refreshedState);
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to refresh reactions';
        setError(errorMessage);
        console.error(`🏢 useEnterpriseReactions: Manual refresh failed for ${reviewId}:`, err);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [reviewId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, []);

  return {
    // Current state
    reactions: state.reactions,
    userReaction: state.userReaction,
    isLoading,
    error,
    
    // Metadata
    lastUpdated: state.lastUpdated,
    source: state.source,
    
    // Actions
    setReaction,
    refreshReactions,
    
    // Enterprise features
    isOptimistic: state.source === 'optimistic',
    retryCount
  };
};