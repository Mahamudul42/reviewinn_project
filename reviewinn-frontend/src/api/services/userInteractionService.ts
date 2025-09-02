import { httpClient } from '../httpClient';
import { API_CONFIG } from '../config';
import { useAuthStore } from '../../stores/authStore';
import { authEvents } from '../../utils/authEvents';

export interface UserInteraction {
  reviewId: string;
  reaction?: string;
  isBookmarked?: boolean;
  isHelpful?: boolean;
  lastInteraction: Date;
  userId?: string; // Track which user owns this interaction
}

export interface UserInteractionCache {
  [reviewId: string]: UserInteraction;
  _metadata?: {
    userId: string;
    lastSync: Date;
  };
}

class UserInteractionService {
  private interactionCache: UserInteractionCache = {};
  private subscribers: ((interactions: UserInteractionCache) => void)[] = [];

  constructor() {
    this.initializeFromStorage();
    this.setupAuthEventListeners();
    // Auto-sync if user is already authenticated
    setTimeout(() => this.checkAndSyncOnInit(), 500);
  }

  private setupAuthEventListeners() {
    // Sync reactions from server when user logs in
    authEvents.on('login', () => {
      console.log('🔄 UserInteractionService: User login detected, syncing from server');
      setTimeout(() => this.syncReactionsFromServer(), 100); // Faster sync
    });
    
    // Clear cache on logout  
    authEvents.on('logout', () => {
      console.log('🧹 UserInteractionService: User logout detected, clearing cache');
      this.clearInteractions();
    });
    
    // FIXED: Listen for unified auth events with user switching protection
    window.addEventListener('authStateChanged', (e) => {
      const detail = (e as CustomEvent).detail;
      if (detail.isAuthenticated && detail.user) {
        console.log('🔄 UserInteractionService: Auth state changed to authenticated, validating cache');
        
        // ENHANCED: Check if cache belongs to current user
        const currentUserId = detail.user.id || detail.user.user_id;
        if (this.validateCacheOwnership(currentUserId)) {
          console.log('✅ UserInteractionService: Cache validated for current user, syncing from server');
          setTimeout(() => this.syncReactionsFromServer(), 200);
        } else {
          console.log('🔄 UserInteractionService: Cache belongs to different user, clearing and syncing');
          this.clearInteractions();
          setTimeout(() => this.syncReactionsFromServer(), 300);
        }
      } else {
        console.log('🧹 UserInteractionService: Auth state changed to unauthenticated, clearing cache');
        this.clearInteractions();
      }
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

  // ENHANCED: Validate if cache belongs to current user (user-switching protection)
  private validateCacheOwnership(currentUserId: string): boolean {
    if (!this.interactionCache._metadata) {
      // No metadata means old cache or empty cache - need to clear
      return false;
    }
    
    const cacheUserId = this.interactionCache._metadata.userId;
    const belongsToCurrentUser = cacheUserId === String(currentUserId);
    
    console.log('🔍 UserInteractionService: Cache validation:', {
      cacheUserId,
      currentUserId: String(currentUserId),
      belongsToCurrentUser
    });
    
    return belongsToCurrentUser;
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

  // Load user interactions from local storage only
  async loadUserInteractions(): Promise<void> {
    // Just notify subscribers that we've "loaded" (from localStorage)
    this.notifySubscribers();
  }

  // Sync reactions from server for cross-browser support
  private async syncReactionsFromServer(): Promise<void> {
    const authState = useAuthStore.getState();
    
    if (!authState.isAuthenticated || !authState.token || !authState.user) {
      console.log('🔍 UserInteractionService: Not authenticated, skipping sync');
      return;
    }

    try {
      console.log('🔄 UserInteractionService: Fetching reactions from server...');
      
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}/reviews/user-reactions`, true);
      
      if (response && response.success && response.data) {
        const serverReactions = response.data as any[];
        
        // ENHANCED: Store user metadata for better cross-browser sync
        const currentUserId = authState.user.id || authState.user.user_id;
        
        // Convert server response to interaction cache format  
        serverReactions.forEach((reaction: any) => {
          this.interactionCache[reaction.review_id] = {
            reviewId: reaction.review_id,
            reaction: reaction.reaction_type,
            isBookmarked: false,
            isHelpful: undefined,
            lastInteraction: new Date(reaction.created_at || Date.now()),
            userId: String(currentUserId) // Track ownership for validation
          };
        });

        // Store metadata for cache validation
        this.interactionCache._metadata = {
          userId: String(currentUserId),
          lastSync: new Date()
        };

        this.saveToStorage();
        this.notifySubscribers();
        
        console.log(`✅ UserInteractionService: Synced ${serverReactions.length} reactions from server`);
        
        // Force a second notification to ensure UI updates
        setTimeout(() => {
          this.notifySubscribers();
          console.log('🔄 UserInteractionService: Force UI refresh after sync');
          
          // Dispatch a custom event that components can listen to
          window.dispatchEvent(new CustomEvent('reactionsSync', {
            detail: { syncedReactions: serverReactions.length, reactions: serverReactions }
          }));
        }, 100);
      }
      
    } catch (error) {
      console.warn('⚠️ UserInteractionService: Failed to sync from server:', error);
    }
  }

  // Check if user is authenticated on init and sync if needed
  private async checkAndSyncOnInit(): Promise<void> {
    const authState = useAuthStore.getState();
    if (authState.isAuthenticated && authState.token && authState.user) {
      console.log('🔄 UserInteractionService: User authenticated on init, syncing reactions');
      await this.syncReactionsFromServer();
    }
  }

  // Update interaction locally only
  updateUserInteraction(reviewId: string, interaction: Partial<UserInteraction>): void {
    // ENHANCED: Include current user ID for ownership tracking
    const authState = useAuthStore.getState();
    const currentUserId = authState.user?.id || authState.user?.user_id;
    
    this.interactionCache[reviewId] = {
      ...this.interactionCache[reviewId],
      ...interaction,
      reviewId,
      lastInteraction: new Date(),
      userId: currentUserId ? String(currentUserId) : undefined
    };
    
    // Update metadata if needed
    if (currentUserId && (!this.interactionCache._metadata || this.interactionCache._metadata.userId !== String(currentUserId))) {
      this.interactionCache._metadata = {
        userId: String(currentUserId),
        lastSync: new Date()
      };
    }
    
    this.saveToStorage();
    this.notifySubscribers();
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

  // Manual sync method for testing and force refresh
  async syncFromServer(): Promise<void> {
    await this.syncReactionsFromServer();
  }

  // Force immediate sync - useful when components mount
  async forceSync(): Promise<void> {
    console.log('🔄 UserInteractionService: Force sync requested');
    await this.syncReactionsFromServer();
  }
}

export const userInteractionService = new UserInteractionService();