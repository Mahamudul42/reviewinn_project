/**
 * CLEAN REACTION SERVICE
 * ======================
 * Single, simple service for all reaction functionality
 * Uses existing review_reactions table - no redundant code
 */

import { useAuthStore } from '../stores/authStore';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';

interface ReactionState {
  reviewId: string;
  userReaction: string | null;  // User's current reaction
  reactionCounts: Record<string, number>;  // Count per reaction type
}

class CleanReactionService {
  private cache = new Map<string, ReactionState>();
  private subscribers = new Map<string, ((state: ReactionState) => void)[]>();

  constructor() {
    this.setupAuthListeners();
  }

  private setupAuthListeners() {
    // Sync when user logs in
    window.addEventListener('authLoginSuccess', () => {
      console.log('🔄 Syncing user reactions on login');
      this.syncUserReactionsFromServer();
    });

    // Clear when user logs out
    window.addEventListener('authLogout', () => {
      console.log('🧹 Clearing reaction cache on logout');
      this.cache.clear();
      this.saveToStorage();
    });

    // Sync on session change
    window.addEventListener('userSessionChanged', () => {
      console.log('🔄 Syncing user reactions on session change');
      this.syncUserReactionsFromServer();
    });
  }

  /**
   * Get reaction state for a review
   */
  async getReactionState(reviewId: string): Promise<ReactionState> {
    // Check cache first
    const cached = this.cache.get(reviewId);
    if (cached) {
      return cached;
    }

    // Fetch from server
    try {
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}/api/v1/reviews/${reviewId}/reactions`, true);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        const state: ReactionState = {
          reviewId,
          userReaction: data.user_reaction || null,
          reactionCounts: data.reactions || {}
        };
        
        this.cache.set(reviewId, state);
        this.saveToStorage();
        return state;
      }
    } catch (error) {
      console.warn(`Failed to fetch reactions for review ${reviewId}:`, error);
    }

    // Return empty state if fetch fails
    const emptyState: ReactionState = {
      reviewId,
      userReaction: null,
      reactionCounts: {}
    };
    
    this.cache.set(reviewId, emptyState);
    return emptyState;
  }

  /**
   * Update user reaction
   */
  async updateReaction(reviewId: string, reactionType: string | null): Promise<ReactionState> {
    try {
      // Update on server first
      let response;
      if (reactionType) {
        response = await httpClient.post(`${API_CONFIG.BASE_URL}/api/v1/reviews/${reviewId}/reaction`, {
          reaction_type: reactionType
        }, true);
      } else {
        response = await httpClient.delete(`${API_CONFIG.BASE_URL}/api/v1/reviews/${reviewId}/reaction`, true);
      }

      if (response.data && response.data.success) {
        const data = response.data.data;
        const newState: ReactionState = {
          reviewId,
          userReaction: data.user_reaction || null,
          reactionCounts: data.reactions || {}
        };

        // Update cache
        this.cache.set(reviewId, newState);
        this.saveToStorage();
        
        // Notify subscribers
        this.notifySubscribers(reviewId, newState);
        
        return newState;
      }
      
      throw new Error('Server update failed');
    } catch (error) {
      console.error(`Failed to update reaction for review ${reviewId}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to reaction changes for a review
   */
  subscribe(reviewId: string, callback: (state: ReactionState) => void): () => void {
    if (!this.subscribers.has(reviewId)) {
      this.subscribers.set(reviewId, []);
    }
    
    this.subscribers.get(reviewId)!.push(callback);

    return () => {
      const callbacks = this.subscribers.get(reviewId);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Get user's reaction for a review (sync)
   */
  getUserReaction(reviewId: string): string | null {
    return this.cache.get(reviewId)?.userReaction || null;
  }

  /**
   * Get reaction counts for a review (sync)
   */
  getReactionCounts(reviewId: string): Record<string, number> {
    return this.cache.get(reviewId)?.reactionCounts || {};
  }

  private notifySubscribers(reviewId: string, state: ReactionState) {
    const callbacks = this.subscribers.get(reviewId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error in reaction subscriber:', error);
        }
      });
    }
  }

  private async syncUserReactionsFromServer() {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    try {
      // Fetch all user reactions
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}/api/v1/reviews/user-reactions`, true);
      
      if (response.data && response.data.success) {
        const reactions = response.data.data || [];
        
        // Update cache with user's reactions
        reactions.forEach((reaction: any) => {
          const state: ReactionState = {
            reviewId: reaction.review_id.toString(),
            userReaction: reaction.reaction_type,
            reactionCounts: reaction.reactions || {}
          };
          
          this.cache.set(reaction.review_id.toString(), state);
          this.notifySubscribers(reaction.review_id.toString(), state);
        });
        
        this.saveToStorage();
        console.log(`✅ Synced ${reactions.length} user reactions`);
      }
    } catch (error) {
      console.warn('Failed to sync user reactions:', error);
    }
  }

  private saveToStorage() {
    try {
      const data: Record<string, ReactionState> = {};
      this.cache.forEach((state, reviewId) => {
        // Only save user reactions to reduce storage size
        if (state.userReaction) {
          data[reviewId] = state;
        }
      });
      localStorage.setItem('clean_reactions', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save reactions to storage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('clean_reactions');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([reviewId, state]) => {
          this.cache.set(reviewId, state as ReactionState);
        });
      }
    } catch (error) {
      console.warn('Failed to load reactions from storage:', error);
    }
  }
}

// Export singleton
export const reactionService = new CleanReactionService();

// Clean up old storage
localStorage.removeItem('user_interactions');
localStorage.removeItem('unified_reactions');
localStorage.removeItem('reaction_state_sync_');

export default reactionService;