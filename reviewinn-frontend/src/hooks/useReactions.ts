/**
 * CLEAN REACTION HOOK  
 * ===================
 * Simple, clean hook for reaction functionality
 * Replaces: useEnterpriseReactions, userInteractionService, etc.
 */

import { useState, useEffect } from 'react';
import { reactionService } from '../services/CleanReactionService';

interface ReactionState {
  reviewId: string;
  userReaction: string | null;
  reactionCounts: Record<string, number>;
  isLoading: boolean;
  error: string | null;
}

export function useReactions(reviewId: string) {
  const [state, setState] = useState<ReactionState>({
    reviewId,
    userReaction: null,
    reactionCounts: {},
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    // Load initial state
    const loadReactions = async () => {
      try {
        const reactionState = await reactionService.getReactionState(reviewId);
        if (isMounted) {
          console.log(`🎯 useReactions: Setting state for ${reviewId} with reaction: ${reactionState.userReaction}`);
          setState({
            reviewId,
            userReaction: reactionState.userReaction,
            reactionCounts: reactionState.reactionCounts,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load reactions'
          }));
        }
      }
    };

    // Subscribe to changes
    const unsubscribe = reactionService.subscribe(reviewId, (reactionState) => {
      if (isMounted) {
        console.log(`🔔 useReactions: Subscription update for ${reviewId} with reaction: ${reactionState.userReaction}`);
        setState({
          reviewId,
          userReaction: reactionState.userReaction,
          reactionCounts: reactionState.reactionCounts,
          isLoading: false,
          error: null
        });
      }
    });

    // Listen for global reaction sync events
    const handleReactionsSync = () => {
      if (isMounted) {
        console.log(`🔄 useReactions: Global sync event detected, reloading for ${reviewId}`);
        loadReactions();
      }
    };
    
    window.addEventListener('reactionsSync', handleReactionsSync);

    loadReactions();

    return () => {
      isMounted = false;
      unsubscribe();
      window.removeEventListener('reactionsSync', handleReactionsSync);
    };
  }, [reviewId]);

  const updateReaction = async (reactionType: string | null) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await reactionService.updateReaction(reviewId, reactionType);
      // State will be updated via subscription
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update reaction'
      }));
      throw error;
    }
  };

  return {
    userReaction: state.userReaction,
    reactionCounts: state.reactionCounts,
    isLoading: state.isLoading,
    error: state.error,
    updateReaction
  };
}

// Backward compatibility
export const useEnterpriseReactions = useReactions;
export default useReactions;