/**
 * UNIFIED REACTION SERVICE
 * ========================
 * Single source of truth for all reaction functionality
 * Replaces: EnterpriseReactionStateManager, userInteractionService, and other reaction services
 */

import { useAuthStore } from '../stores/authStore';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';

export interface ReactionState {
  reviewId: string;
  userReaction: string | null;  // Which emoji the user selected
  reactionCounts: Record<string, number>;  // Count for each reaction type
  lastUpdated: number;
}

class UnifiedReactionService {
  private cache = new Map<string, ReactionState>();
  private subscribers = new Map<string, Set<(state: ReactionState) => void>>();
  private pendingUpdates = new Set<string>();

  constructor() {
    this.setupAuthListeners();
    this.loadFromStorage();
  }

  private setupAuthListeners() {
    // Sync reactions when user logs in
    window.addEventListener('authLoginSuccess', () => {
      console.log('🔄 UnifiedReaction: Login detected - syncing reactions');
      this.syncAllFromServer();
    });

    // Clear cache when user logs out  
    window.addEventListener('authLogout', () => {
      console.log('🧹 UnifiedReaction: Logout detected - clearing cache');
      this.clearCache();
    });

    // Sync when session changes
    window.addEventListener('userSessionChanged', () => {
      console.log('🔄 UnifiedReaction: Session changed - syncing reactions');
      this.syncAllFromServer();
    });
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('unified_reactions');
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

  private saveToStorage() {
    try {
      const data: Record<string, ReactionState> = {};
      this.cache.forEach((state, reviewId) => {
        data[reviewId] = state;
      });
      localStorage.setItem('unified_reactions', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save reactions to storage:', error);
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get reaction state for a review (with automatic server sync)
   */
  async getReactionState(reviewId: string): Promise<ReactionState> {
    const cached = this.cache.get(reviewId);
    
    // Return cached if recent
    if (cached && Date.now() - cached.lastUpdated < 60000) { // 1 minute
      return cached;
    }

    // Fetch from server
    try {
      const serverState = await this.fetchFromServer(reviewId);
      this.cache.set(reviewId, serverState);
      this.saveToStorage();
      this.notifySubscribers(reviewId, serverState);
      return serverState;
    } catch (error) {
      console.warn(`Failed to fetch reaction state for ${reviewId}:`, error);
      
      // Return cached as fallback or empty state
      return cached || {
        reviewId,
        userReaction: null,
        reactionCounts: {},
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Update user's reaction for a review
   */
  async updateReaction(reviewId: string, reactionType: string | null): Promise<ReactionState> {
    if (this.pendingUpdates.has(reviewId)) {
      console.log(`Reaction update already pending for ${reviewId}`);
      return this.cache.get(reviewId) || this.createEmptyState(reviewId);
    }

    this.pendingUpdates.add(reviewId);

    try {
      // Optimistic update for immediate UI feedback
      const currentState = this.cache.get(reviewId) || this.createEmptyState(reviewId);
      const optimisticState = this.calculateOptimisticState(currentState, reactionType);
      
      this.cache.set(reviewId, optimisticState);
      this.notifySubscribers(reviewId, optimisticState);

      // Update server
      const serverState = await this.updateOnServer(reviewId, reactionType);
      
      // Apply server response
      this.cache.set(reviewId, serverState);
      this.saveToStorage();
      this.notifySubscribers(reviewId, serverState);
      
      return serverState;

    } catch (error) {
      console.error(`Failed to update reaction for ${reviewId}:`, error);
      
      // Revert optimistic update on failure
      const originalState = await this.fetchFromServer(reviewId).catch(() => this.createEmptyState(reviewId));
      this.cache.set(reviewId, originalState);
      this.notifySubscribers(reviewId, originalState);
      
      throw error;
    } finally {
      this.pendingUpdates.delete(reviewId);
    }
  }

  /**
   * Subscribe to reaction state changes for a review
   */
  subscribe(reviewId: string, callback: (state: ReactionState) => void): () => void {
    if (!this.subscribers.has(reviewId)) {
      this.subscribers.set(reviewId, new Set());
    }
    
    this.subscribers.get(reviewId)!.add(callback);

    return () => {
      const reviewSubscribers = this.subscribers.get(reviewId);
      if (reviewSubscribers) {
        reviewSubscribers.delete(callback);
        if (reviewSubscribers.size === 0) {
          this.subscribers.delete(reviewId);
        }
      }
    };
  }

  /**
   * Get user's current reaction for a review (synchronous)
   */
  getUserReaction(reviewId: string): string | null {
    return this.cache.get(reviewId)?.userReaction || null;
  }

  /**
   * Get reaction counts for a review (synchronous)
   */
  getReactionCounts(reviewId: string): Record<string, number> {
    return this.cache.get(reviewId)?.reactionCounts || {};
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private async fetchFromServer(reviewId: string): Promise<ReactionState> {
    const response = await httpClient.get(`${API_CONFIG.BASE_URL}/reviews/${reviewId}/reactions`);
    
    if (response.success && response.data) {
      const data = response.data as import('../types').ReactionApiResponse;
      return {
        reviewId,
        userReaction: data.user_reaction || null,
        reactionCounts: data.reactions || {},
        lastUpdated: Date.now()
      };
    }
    
    return this.createEmptyState(reviewId);
  }

  private async updateOnServer(reviewId: string, reactionType: string | null): Promise<ReactionState> {
    if (reactionType) {
      // Add or update reaction
      const response = await httpClient.post(`${API_CONFIG.BASE_URL}/reviews/${reviewId}/reaction`, {
        reaction_type: reactionType
      });
      
      if (response.success && response.data) {
        const data = response.data as import('../types').ReactionApiResponse;
        return {
          reviewId,
          userReaction: data.user_reaction || null,
          reactionCounts: data.reactions || {},
          lastUpdated: Date.now()
        };
      }
    } else {
      // Remove reaction
      const response = await httpClient.delete(`${API_CONFIG.BASE_URL}/reviews/${reviewId}/reaction`);
      
      if (response.success && response.data) {
        const data = response.data as import('../types').ReactionApiResponse;
        return {
          reviewId,
          userReaction: null,
          reactionCounts: data.reactions || {},
          lastUpdated: Date.now()
        };
      }
    }
    
    throw new Error('Server update failed');
  }

  private calculateOptimisticState(currentState: ReactionState, newReaction: string | null): ReactionState {
    const newCounts = { ...currentState.reactionCounts };
    const oldReaction = currentState.userReaction;

    // Remove old reaction count
    if (oldReaction && newCounts[oldReaction]) {
      newCounts[oldReaction] = Math.max(0, newCounts[oldReaction] - 1);
    }

    // Add new reaction count  
    if (newReaction) {
      newCounts[newReaction] = (newCounts[newReaction] || 0) + 1;
    }

    return {
      ...currentState,
      userReaction: newReaction,
      reactionCounts: newCounts,
      lastUpdated: Date.now()
    };
  }

  private createEmptyState(reviewId: string): ReactionState {
    return {
      reviewId,
      userReaction: null,
      reactionCounts: {},
      lastUpdated: Date.now()
    };
  }

  private notifySubscribers(reviewId: string, state: ReactionState) {
    const reviewSubscribers = this.subscribers.get(reviewId);
    if (reviewSubscribers) {
      reviewSubscribers.forEach(callback => {
        try {
          callback(state);
        } catch (error) {
          console.error('Error in reaction subscriber:', error);
        }
      });
    }
  }

  private async syncAllFromServer() {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated) {
      return;
    }

    try {
      // Fetch all user reactions from server
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}/reviews/user-reactions`);
      
      if (response.success && response.data) {
        const userReactions = response.data as any[];
        
        // Update cache with server data
        userReactions.forEach((reaction: any) => {
          const state: ReactionState = {
            reviewId: reaction.review_id,
            userReaction: reaction.reaction_type,
            reactionCounts: reaction.reactions || {},
            lastUpdated: Date.now()
          };
          
          this.cache.set(reaction.review_id, state);
          this.notifySubscribers(reaction.review_id, state);
        });
        
        this.saveToStorage();
        console.log(`✅ Synced ${userReactions.length} reactions from server`);
      }
    } catch (error) {
      console.warn('Failed to sync reactions from server:', error);
    }
  }

  private clearCache() {
    this.cache.clear();
    this.saveToStorage();
    localStorage.removeItem('user_interactions'); // Clear old cache
  }
}

// Export singleton instance
export const reactionService = new UnifiedReactionService();

// Backward compatibility exports
export const userInteractionService = {
  getUserReaction: (reviewId: string) => reactionService.getUserReaction(reviewId),
  updateUserInteraction: (reviewId: string, interaction: { reaction?: string }) => {
    if (interaction.reaction !== undefined) {
      return reactionService.updateReaction(reviewId, interaction.reaction);
    }
  },
  subscribe: (_callback: any) => () => {}, // Simplified for migration
  loadUserInteractions: () => Promise.resolve()
};

export const enterpriseReactionStateManager = {
  getReactionState: (reviewId: string) => reactionService.getReactionState(reviewId),
  updateReaction: (reviewId: string, reactionType: string | null) => reactionService.updateReaction(reviewId, reactionType),
  subscribe: (reviewId: string, callback: any) => reactionService.subscribe(reviewId, callback)
};