import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';
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

  constructor() {
    this.initializeFromStorage();
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

  // Load user interactions from backend
  async loadUserInteractions(): Promise<void> {
    // Use unified auth through store
    const authState = useAuthStore.getState();
    console.log('🔍 UserInteractionService: Auth state:', {
      isAuthenticated: authState.isAuthenticated,
      hasToken: !!authState.token,
      hasUser: !!authState.user,
      userId: authState.user?.id
    });
    
    if (!authState.isAuthenticated || !authState.token || !authState.user) {
      console.log('🔍 UserInteractionService: Not authenticated, skipping interactions load');
      return;
    }

    try {
      console.log('🔍 UserInteractionService: Making authenticated request to interactions');
      const response = await httpClient.get(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.ME_INTERACTIONS}`, true);
      
      // Handle enterprise API response format
      const apiResponse = response.data;
      if (apiResponse && apiResponse.status === 'success' && apiResponse.data) {
        this.interactionCache = apiResponse.data.reduce((acc: UserInteractionCache, interaction: any) => {
          acc[interaction.reviewId] = {
            reviewId: interaction.reviewId,
            reaction: interaction.reaction,
            isBookmarked: interaction.isBookmarked,
            isHelpful: interaction.isHelpful,
            lastInteraction: new Date(interaction.lastInteraction)
          };
          return acc;
        }, {});
        this.saveToStorage();
        this.notifySubscribers();
      }
    } catch (error) {
      console.warn('User interactions endpoint not available, using localStorage only:', error);
      // Don't throw error - just use localStorage cache
    }
  }

  // Get user interaction for a specific review
  getUserInteraction(reviewId: string): UserInteraction | null {
    return this.interactionCache[reviewId] || null;
  }

  // Update user interaction
  updateUserInteraction(reviewId: string, interaction: Partial<UserInteraction>): void {
    this.interactionCache[reviewId] = {
      ...this.interactionCache[reviewId],
      ...interaction,
      lastInteraction: new Date()
    };
    this.saveToStorage();
    this.notifySubscribers();
  }

  // Remove user interaction
  removeUserInteraction(reviewId: string): void {
    delete this.interactionCache[reviewId];
    this.saveToStorage();
    this.notifySubscribers();
  }

  // Clear all interactions (useful for logout)
  clearInteractions(): void {
    this.interactionCache = {};
    this.saveToStorage();
    this.notifySubscribers();
  }

  // Get all user interactions
  getAllInteractions(): UserInteractionCache {
    return { ...this.interactionCache };
  }

  // Check if user has interacted with a review
  hasUserInteracted(reviewId: string): boolean {
    return reviewId in this.interactionCache;
  }

  // Get user's reaction for a review
  getUserReaction(reviewId: string): string | null {
    return this.interactionCache[reviewId]?.reaction || null;
  }
}

export const userInteractionService = new UserInteractionService(); 