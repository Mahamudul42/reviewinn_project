/**
 * CLEAN REACTION SERVICE
 * ======================
 * Single, simple service for all reaction functionality
 * Uses existing review_reactions table - no redundant code
 */

import { useAuthStore } from '../stores/authStore';
import { httpClient } from '../api/httpClient';
import { API_CONFIG } from '../api/config';
import { authEvents } from '../utils/authEvents';

interface ReactionState {
  reviewId: string;
  userReaction: string | null;  // User's current reaction
  reactionCounts: Record<string, number>;  // Count per reaction type
}

class CleanReactionService {
  private cache = new Map<string, ReactionState>();
  private subscribers = new Map<string, ((state: ReactionState) => void)[]>();
  private syncInProgress = false;

  constructor() {
    this.loadFromStorage();
    this.setupAuthListeners();
    // Auto-sync if user is already authenticated - faster for initial page load
    setTimeout(() => this.checkAndSyncOnInit(), 100);
  }

  private setupAuthListeners() {
    // Sync when user logs in using the proper auth events
    authEvents.on('login', () => {
      console.log('🔄 CleanReactionService: User login detected, syncing from server');
      setTimeout(() => this.syncUserReactionsFromServer(), 100);
    });

    // Clear when user logs out
    authEvents.on('logout', () => {
      console.log('🧹 CleanReactionService: User logout detected, clearing cache');
      this.cache.clear();
      this.saveToStorage();
    });

    // Listen for cross-tab login
    window.addEventListener('storage', (e) => {
      if (e.key === 'reviewinn_jwt_token' && e.newValue) {
        console.log('🔄 CleanReactionService: Token detected in another tab, syncing from server');
        setTimeout(() => this.syncUserReactionsFromServer(), 200);
      } else if (e.key === 'reviewinn_jwt_token' && !e.newValue) {
        console.log('🧹 CleanReactionService: Token cleared in another tab, clearing cache');
        this.cache.clear();
        this.saveToStorage();
      }
    });

    // Listen for auth state changes
    window.addEventListener('authStateChanged', () => {
      console.log('🔄 CleanReactionService: Auth state changed, syncing from server');
      setTimeout(() => this.syncUserReactionsFromServer(), 200);
    });
  }

  /**
   * Get reaction state for a review
   */
  async getReactionState(reviewId: string): Promise<ReactionState> {
    console.log(`🔍 CleanReactionService: Getting reaction state for review ${reviewId}`);
    
    // Check cache first
    const cached = this.cache.get(reviewId);
    if (cached) {
      console.log(`💾 Found cached reaction for review ${reviewId}: ${cached.userReaction}`);
      return cached;
    }

    // If not in cache and user is authenticated, try to get from synced data first
    const authState = useAuthStore.getState();
    if (authState.isAuthenticated && authState.user) {
      // Trigger a sync if we haven't synced yet and cache is small
      if (this.cache.size <= 3 && !this.syncInProgress) {
        console.log('🔄 CleanReactionService: Cache small on getReactionState, triggering sync');
        await this.syncUserReactionsFromServer();
        
        // Check cache again after sync
        const syncedCached = this.cache.get(reviewId);
        if (syncedCached) {
          console.log(`✅ Found synced reaction for review ${reviewId}: ${syncedCached.userReaction}`);
          return syncedCached;
        }
      }
    }

    // Fetch individual review reactions from server
    try {
      console.log(`🌐 Fetching individual reactions for review ${reviewId}`);
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}/reviews/${reviewId}/reactions`);
      
      if (response.success && response.data) {
        const data = response.data;
        const state: ReactionState = {
          reviewId,
          userReaction: data.user_reaction || null,
          reactionCounts: data.reactions || {}
        };
        
        console.log(`📥 Individual fetch result for review ${reviewId}: user_reaction=${state.userReaction}`);
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
    
    console.log(`⚪ Returning empty state for review ${reviewId}`);
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
        });
      } else {
        response = await httpClient.delete(`${API_CONFIG.BASE_URL}/api/v1/reviews/${reviewId}/reaction`);
      }

      if (response.success && response.data) {
        const data = response.data;
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

  /**
   * Manually sync reactions from server (for testing/debugging)
   */
  async forceSync(): Promise<void> {
    console.log('🔄 CleanReactionService: Manual sync requested');
    await this.syncUserReactionsFromServer();
  }

  /**
   * Debug method - log current state
   */
  debugState(): void {
    console.log('🔍 CleanReactionService Debug State:');
    console.log('Cache size:', this.cache.size);
    console.log('Sync in progress:', this.syncInProgress);
    console.log('Cached reactions:', Array.from(this.cache.entries()));
    
    const authState = useAuthStore.getState();
    console.log('Auth state:', {
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      hasToken: !!authState.token
    });
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
    if (this.syncInProgress) {
      console.log('🔄 CleanReactionService: Sync already in progress, skipping');
      return;
    }

    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated || !authState.user) {
      console.log('🔍 CleanReactionService: Not authenticated, skipping sync');
      return;
    }

    this.syncInProgress = true;
    
    try {
      console.log('🔄 CleanReactionService: Fetching user reactions from server...');
      
      // Fetch all user reactions
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}/reviews/user-reactions`);
      
      if (response.success && response.data) {
        const reactions = (response.data as any[]) || [];
        console.log(`📥 CleanReactionService: Received ${reactions.length} reactions from server`);
        
        // Update cache with user's reactions (preserve existing reaction counts)
        reactions.forEach((reaction: any) => {
          const reviewId = reaction.review_id.toString();
          const existingState = this.cache.get(reviewId);
          
          const state: ReactionState = {
            reviewId,
            userReaction: reaction.reaction_type,
            reactionCounts: existingState?.reactionCounts || {} // Preserve existing counts
          };
          
          this.cache.set(reviewId, state);
          
          console.log(`🔄 Updated reaction for review ${reviewId}: ${reaction.reaction_type}`);
        });

        // First save to storage
        this.saveToStorage();
        
        // Then notify all subscribers for each reaction
        reactions.forEach((reaction: any) => {
          const reviewId = reaction.review_id.toString();
          const state = this.cache.get(reviewId);
          if (state) {
            this.notifySubscribers(reviewId, state);
            console.log(`🔔 Notified subscribers for review ${reviewId} with reaction: ${state.userReaction}`);
          }
        });
        
        console.log(`✅ CleanReactionService: Synced ${reactions.length} user reactions from server`);
        
        // Force multiple UI refreshes to ensure components re-render
        setTimeout(() => {
          console.log('🔄 CleanReactionService: First force refresh');
          reactions.forEach((reaction: any) => {
            const reviewId = reaction.review_id.toString();
            const state = this.cache.get(reviewId);
            if (state) {
              this.notifySubscribers(reviewId, state);
            }
          });
        }, 50);
        
        setTimeout(() => {
          console.log('🔄 CleanReactionService: Second force refresh');
          reactions.forEach((reaction: any) => {
            const reviewId = reaction.review_id.toString();
            const state = this.cache.get(reviewId);
            if (state) {
              this.notifySubscribers(reviewId, state);
            }
          });
          
          // Also dispatch a global event for components that might need it
          window.dispatchEvent(new CustomEvent('reactionsSync', {
            detail: { syncedCount: reactions.length, timestamp: Date.now() }
          }));
        }, 200);
      } else {
        console.log('📭 CleanReactionService: No reactions found on server');
      }
    } catch (error) {
      console.error('⚠️ CleanReactionService: Failed to sync user reactions:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Check if user is authenticated on init and sync if needed
  private async checkAndSyncOnInit(): Promise<void> {
    const authState = useAuthStore.getState();
    if (authState.isAuthenticated && authState.token && authState.user) {
      console.log('🔄 CleanReactionService: User authenticated on init, syncing reactions');
      await this.syncUserReactionsFromServer();
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
        console.log(`💾 CleanReactionService: Loaded ${Object.keys(data).length} reactions from storage`);
      }
    } catch (error) {
      console.warn('Failed to load reactions from storage:', error);
    }
  }
}

// Export singleton
export const reactionService = new CleanReactionService();

// Clean up old storage to avoid conflicts
try {
  localStorage.removeItem('user_interactions');
  localStorage.removeItem('unified_reactions');
  localStorage.removeItem('reaction_state_sync_');
} catch (error) {
  console.warn('Failed to clean up old storage:', error);
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).reactionService = reactionService;
}

export default reactionService;