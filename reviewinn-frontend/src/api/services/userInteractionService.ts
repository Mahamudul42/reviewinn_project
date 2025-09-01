import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';
import { isAuthenticated, getCurrentUser } from '../../shared/utils/auth';
import { useAuthStore } from '../../stores/authStore';

export interface UserInteraction {
  reviewId: string;
  reaction?: string;
  isBookmarked?: boolean;
  isHelpful?: boolean;
  lastInteraction: Date;
}

export interface UserInteractionCache {
  [reviewId: string]: UserInteraction;
}

class UserInteractionService {
  private interactionCache: UserInteractionCache = {};
  private isInitialized = false;
  private subscribers: ((interactions: UserInteractionCache) => void)[] = [];
  private syncInProgress = false;

  constructor() {
    this.initializeFromStorage();
    this.setupAuthEventListeners();
  }

  private setupAuthEventListeners() {
    // Listen for login events to sync from server
    window.addEventListener('authLoginSuccess', () => {
      console.log('🔄 UserInteractionService: Auth login success - syncing from server');
      this.loadUserInteractionsFromServer();
    });
    
    // Listen for user session changes
    window.addEventListener('userSessionChanged', () => {
      console.log('🔄 UserInteractionService: User session changed - syncing from server');  
      this.loadUserInteractionsFromServer();
    });
    
    // Clear cache on logout
    window.addEventListener('authLogout', () => {
      console.log('🧹 UserInteractionService: Auth logout - clearing cache');
      this.clearInteractions();
    });
  }

  private initializeFromStorage() {
    try {
      const stored = localStorage.getItem('user_interactions');
      if (stored) {
        this.interactionCache = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user interactions from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('user_interactions', JSON.stringify(this.interactionCache));
    } catch (error) {
      console.error('Failed to save user interactions to storage:', error);
    }
  }

  subscribe(callback: (interactions: UserInteractionCache) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.interactionCache));
  }

  // ENHANCED: Server synchronization on login/session change
  async loadUserInteractionsFromServer(): Promise<void> {
    if (this.syncInProgress) {
      console.log('🔄 UserInteractionService: Sync already in progress, skipping');
      return;
    }

    const authState = useAuthStore.getState();
    console.log('🔍 UserInteractionService: Auth state:', {
      isAuthenticated: authState.isAuthenticated,
      hasToken: !!authState.token,
      hasUser: !!authState.user,
      userId: authState.user?.id
    });
    
    if (!authState.isAuthenticated || !authState.token || !authState.user) {
      console.log('🔍 UserInteractionService: Not authenticated, clearing cache');
      this.clearInteractions();
      return;
    }

    this.syncInProgress = true;

    try {
      console.log('🔄 UserInteractionService: Fetching user reactions from server...');
      
      // Fetch user's reactions from review system
      const response = await this.fetchUserReactionsFromReviewSystem(authState.user.id);
      
      if (response && response.length > 0) {
        // Convert server response to interaction cache format
        const serverInteractions: UserInteractionCache = {};
        
        response.forEach((reaction: any) => {
          serverInteractions[reaction.review_id] = {
            reviewId: reaction.review_id,
            reaction: reaction.reaction_type,
            isBookmarked: false, // We'll extend this later if needed
            isHelpful: undefined,
            lastInteraction: new Date(reaction.created_at || Date.now())
          };
        });

        // Merge with existing cache (server takes precedence)
        this.interactionCache = { ...this.interactionCache, ...serverInteractions };
        this.saveToStorage();
        this.notifySubscribers();
        
        console.log(`✅ UserInteractionService: Loaded ${response.length} reactions from server`);
      } else {
        console.log('📭 UserInteractionService: No reactions found on server');
      }
      
    } catch (error) {
      console.warn('⚠️ UserInteractionService: Failed to fetch from server, using local cache:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // SIMPLIFIED: Fetch reactions directly from review system
  private async fetchUserReactionsFromReviewSystem(userId: string | number): Promise<any[]> {
    try {
      // Use your existing review API to get user's reactions
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}/api/v1/reviews/user-reactions`, true);
      
      if (response && response.data && response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch user reactions:', error);
      return [];
    }
  }

  // ENHANCED: Update interaction both locally and on server
  updateUserInteraction(reviewId: string, interaction: Partial<UserInteraction>): void {
    this.interactionCache[reviewId] = {
      ...this.interactionCache[reviewId],
      ...interaction,
      reviewId,
      lastInteraction: new Date()
    };
    this.saveToStorage();
    this.notifySubscribers();

    // Sync to server in background (don't wait)
    this.syncInteractionToServer(reviewId, interaction).catch(error => {
      console.warn('Failed to sync interaction to server:', error);
    });
  }

  // SIMPLIFIED: Sync single interaction to server
  private async syncInteractionToServer(reviewId: string, interaction: Partial<UserInteraction>): Promise<void> {
    const authState = useAuthStore.getState();
    if (!authState.isAuthenticated || !authState.token) {
      return;
    }

    try {
      if (interaction.reaction !== undefined) {
        // Sync reaction using your existing review reaction API
        if (interaction.reaction) {
          await httpClient.post(`${API_CONFIG.BASE_URL}/api/v1/reviews/${reviewId}/reaction`, {
            reaction_type: interaction.reaction
          }, true);
        } else {
          await httpClient.delete(`${API_CONFIG.BASE_URL}/api/v1/reviews/${reviewId}/reaction`, true);
        }
      }
    } catch (error) {
      console.warn(`Failed to sync interaction for review ${reviewId}:`, error);
    }
  }

  // Public API methods (unchanged)
  async loadUserInteractions(): Promise<void> {
    await this.loadUserInteractionsFromServer();
  }

  getUserInteraction(reviewId: string): UserInteraction | null {
    return this.interactionCache[reviewId] || null;
  }

  removeUserInteraction(reviewId: string): void {
    delete this.interactionCache[reviewId];
    this.saveToStorage();
    this.notifySubscribers();
  }

  clearInteractions(): void {
    this.interactionCache = {};
    this.saveToStorage();
    this.notifySubscribers();
  }

  getAllInteractions(): UserInteractionCache {
    return { ...this.interactionCache };
  }

  hasUserInteracted(reviewId: string): boolean {
    return reviewId in this.interactionCache;
  }

  getUserReaction(reviewId: string): string | null {
    return this.interactionCache[reviewId]?.reaction || null;
  }
}

export const userInteractionService = new UserInteractionService();