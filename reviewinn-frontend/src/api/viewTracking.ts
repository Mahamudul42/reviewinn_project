/**
 * View Tracking Service - Frontend Implementation
 * Handles view tracking with industry-standard rate limiting and best practices
 */
import { httpClient } from './httpClient';
import { useAuthStore } from '../stores/authStore';
import { API_CONFIG, API_ENDPOINTS } from './config';

export interface ViewTrackingResponse {
  tracked: boolean;
  reason: string;
  view_count: number;
  message: string;
}

export interface ViewAnalytics {
  review_id: number;
  total_views: number;
  unique_users: number;
  unique_sessions: number;
  analytics: {
    views_today: number;
    views_this_week: number;
    views_this_month: number;
    last_view_at: string | null;
    review_title?: string;
    review_rating?: number;
    entity_id?: number;
    created_at?: string;
  };
}

class ViewTrackingService {
  private viewedReviews = new Set<number>();
  private viewedEntities = new Set<number>();
  private lastViewTimes = new Map<string, number>();
  
  /**
   * Track a review view with industry-standard rate limiting
   * @param reviewId - The ID of the review being viewed
   * @returns Promise with tracking result
   */
  async trackReviewView(reviewId: number): Promise<ViewTrackingResponse> {
    try {
      // Get authentication state from store
      const authState = useAuthStore.getState();
      
      // Determine rate limiting based on authentication status
      let rateLimitMs: number;
      let viewKey: string;
      
      if (authState.isAuthenticated) {
        // Authenticated users: 24 hour rate limit
        rateLimitMs = 24 * 60 * 60 * 1000;
        viewKey = `review_${reviewId}_user`;
      } else {
        // Anonymous users: 1 hour rate limit
        rateLimitMs = 1 * 60 * 60 * 1000;
        viewKey = `review_${reviewId}_anon`;
      }

      // Client-side rate limiting check
      const lastViewTime = this.lastViewTimes.get(viewKey);
      const now = Date.now();

      if (lastViewTime && (now - lastViewTime) < rateLimitMs) {
        const timeLeft = rateLimitMs - (now - lastViewTime);
        const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
        
        const timeMessage = hoursLeft > 0 
          ? `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}` 
          : `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
          
        return {
          tracked: false,
          reason: `Rate limited - ${timeMessage} remaining`,
          view_count: 0,
          message: `You can view this review again in ${timeMessage}`
        };
      }

      // Check if already viewed in this session (prevent duplicate calls)
      if (this.viewedReviews.has(reviewId)) {
        return {
          tracked: false,
          reason: 'Already viewed in this session',
          view_count: 0,
          message: 'View already tracked this session'
        };
      }

      // Immediately mark as viewed to prevent race conditions
      this.viewedReviews.add(reviewId);
      this.lastViewTimes.set(viewKey, now);

      // Make API call to track the view with error handling
      try {
        const response = await httpClient.post<ViewTrackingResponse>(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.VIEW_TRACKING.TRACK_REVIEW(reviewId.toString())}`
        );

        // If successfully tracked, save to localStorage for persistence
        if (response.data && response.data.tracked) {
          // State already updated above to prevent race conditions
          this.saveViewTimeToStorage(viewKey, now);
        } else {
          // If not tracked by server, revert the state changes
          this.viewedReviews.delete(reviewId);
          this.lastViewTimes.delete(viewKey);
        }

        return response.data || {
          tracked: false,
          reason: 'Invalid response',
          view_count: 0,
          message: 'Invalid server response'
        };
      } catch (apiError) {
        // If API call fails, still track locally to prevent UI issues
        console.warn('View tracking API call failed, tracking locally:', apiError);
        
        // State already updated above, just save to localStorage
        this.saveViewTimeToStorage(viewKey, now);
        
        return {
          tracked: true, // Report as tracked to prevent retries
          reason: 'Tracked locally (API unavailable)',
          view_count: 0,
          message: 'View tracked locally due to server issues'
        };
      }

    } catch (error) {
      console.error('Error tracking review view:', error);
      return {
        tracked: false,
        reason: 'Network error',
        view_count: 0,
        message: 'Failed to track view due to network error'
      };
    }
  }

  /**
   * Track an entity view with the same rate limiting as reviews
   * @param entityId - The ID of the entity being viewed
   * @returns Promise with tracking result
   */
  async trackEntityView(entityId: number): Promise<ViewTrackingResponse> {
    try {
      // Get authentication state
      const authState = useAuthStore.getState();
      
      // Determine rate limiting based on authentication status
      let rateLimitMs: number;
      let viewKey: string;
      
      if (authState.isAuthenticated) {
        // Authenticated users: 24 hour rate limit
        rateLimitMs = 24 * 60 * 60 * 1000;
        viewKey = `entity_${entityId}_user`;
      } else {
        // Anonymous users: 1 hour rate limit
        rateLimitMs = 1 * 60 * 60 * 1000;
        viewKey = `entity_${entityId}_anon`;
      }

      // Client-side rate limiting check
      const lastViewTime = this.lastViewTimes.get(viewKey);
      const now = Date.now();

      if (lastViewTime && (now - lastViewTime) < rateLimitMs) {
        const timeLeft = rateLimitMs - (now - lastViewTime);
        const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
        
        const timeMessage = hoursLeft > 0 
          ? `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}` 
          : `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;
          
        return {
          tracked: false,
          reason: `Rate limited - ${timeMessage} remaining`,
          view_count: 0,
          message: `You can view this entity again in ${timeMessage}`
        };
      }

      // Check if already viewed in this session
      if (this.viewedEntities.has(entityId)) {
        return {
          tracked: false,
          reason: 'Already viewed in this session',
          view_count: 0,
          message: 'View already tracked this session'
        };
      }

      // Make API call to track the view with error handling
      try {
        const response = await httpClient.post<ViewTrackingResponse>(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.VIEW_TRACKING.TRACK_ENTITY(entityId.toString())}`
        );

        // If successfully tracked, update local state
        if (response.data && response.data.tracked) {
          this.viewedEntities.add(entityId);
          this.lastViewTimes.set(viewKey, now);
          
          // Store in localStorage for persistence
          this.saveViewTimeToStorage(viewKey, now);
        }

        return response.data || {
          tracked: false,
          reason: 'Invalid response',
          view_count: 0,
          message: 'Invalid server response'
        };
      } catch (apiError) {
        // If API call fails, still track locally to prevent UI issues
        console.warn('Entity view tracking API call failed, tracking locally:', apiError);
        
        this.viewedEntities.add(entityId);
        this.lastViewTimes.set(viewKey, now);
        this.saveViewTimeToStorage(viewKey, now);
        
        return {
          tracked: true, // Report as tracked to prevent retries
          reason: 'Tracked locally (API unavailable)',
          view_count: 0,
          message: 'View tracked locally due to server issues'
        };
      }

    } catch (error) {
      console.error('Error tracking entity view:', error);
      return {
        tracked: false,
        reason: 'Network error',
        view_count: 0,
        message: 'Failed to track view due to network error'
      };
    }
  }

  /**
   * Get analytics for a review (requires appropriate permissions)
   * @param reviewId - The ID of the review
   * @returns Promise with analytics data
   */
  async getReviewAnalytics(reviewId: number): Promise<ViewAnalytics | null> {
    try {
      const response = await httpClient.get<ViewAnalytics>(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.VIEW_TRACKING.REVIEW_ANALYTICS(reviewId.toString())}`
      );
      return response.data || null;
    } catch (error) {
      console.error('Error fetching review analytics:', error);
      return null;
    }
  }

  /**
   * Save view time to localStorage for persistence across sessions
   * @param viewKey - The key for the view
   * @param timestamp - The timestamp of the view
   */
  private saveViewTimeToStorage(viewKey: string, timestamp: number): void {
    try {
      const storedViews = JSON.parse(localStorage.getItem('review_view_times') || '{}');
      storedViews[viewKey] = timestamp;
      localStorage.setItem('review_view_times', JSON.stringify(storedViews));
    } catch (error) {
      console.warn('Failed to save view time to localStorage:', error);
    }
  }

  /**
   * Load view times from localStorage on initialization
   */
  private loadViewTimesFromStorage(): void {
    try {
      const storedViews = JSON.parse(localStorage.getItem('review_view_times') || '{}');
      const now = Date.now();
      const rateLimitMs = 24 * 60 * 60 * 1000; // 24 hours

      // Only load view times that are still within the rate limit window
      Object.entries(storedViews).forEach(([key, timestamp]) => {
        if (typeof timestamp === 'number' && (now - timestamp) < rateLimitMs) {
          this.lastViewTimes.set(key, timestamp);
        }
      });

      // Clean up old entries from localStorage
      const validViews: Record<string, number> = {};
      this.lastViewTimes.forEach((timestamp, key) => {
        validViews[key] = timestamp;
      });
      localStorage.setItem('review_view_times', JSON.stringify(validViews));

    } catch (error) {
      console.warn('Failed to load view times from localStorage:', error);
    }
  }

  /**
   * Check if a review can be viewed (client-side check)
   * @param reviewId - The ID of the review
   * @returns Whether the review can be viewed
   */
  canViewReview(reviewId: number): boolean {
    const authState = useAuthStore.getState();
    
    // Determine rate limiting based on authentication status
    let rateLimitMs: number;
    let viewKey: string;
    
    if (authState.isAuthenticated) {
      rateLimitMs = 24 * 60 * 60 * 1000; // 24 hours for authenticated users
      viewKey = `review_${reviewId}_user`;
    } else {
      rateLimitMs = 1 * 60 * 60 * 1000; // 1 hour for anonymous users
      viewKey = `review_${reviewId}_anon`;
    }

    const lastViewTime = this.lastViewTimes.get(viewKey);
    if (!lastViewTime) {
      return true;
    }

    return (Date.now() - lastViewTime) >= rateLimitMs;
  }

  /**
   * Check if an entity can be viewed (client-side check)
   * @param entityId - The ID of the entity
   * @returns Whether the entity can be viewed
   */
  canViewEntity(entityId: number): boolean {
    const authState = useAuthStore.getState();
    
    // Determine rate limiting based on authentication status
    let rateLimitMs: number;
    let viewKey: string;
    
    if (authState.isAuthenticated) {
      rateLimitMs = 24 * 60 * 60 * 1000; // 24 hours for authenticated users
      viewKey = `entity_${entityId}_user`;
    } else {
      rateLimitMs = 1 * 60 * 60 * 1000; // 1 hour for anonymous users
      viewKey = `entity_${entityId}_anon`;
    }

    const lastViewTime = this.lastViewTimes.get(viewKey);
    if (!lastViewTime) {
      return true;
    }

    return (Date.now() - lastViewTime) >= rateLimitMs;
  }

  /**
   * Clear all view tracking data (useful for logout)
   */
  clearViewData(): void {
    this.viewedReviews.clear();
    this.viewedEntities.clear();
    this.lastViewTimes.clear();
    try {
      localStorage.removeItem('review_view_times');
    } catch (error) {
      console.warn('Failed to clear view data from localStorage:', error);
    }
  }

  /**
   * Initialize the service (load persisted data)
   */
  initialize(): void {
    this.loadViewTimesFromStorage();
  }
}

// Create and initialize the service instance
export const viewTrackingService = new ViewTrackingService();

// Initialize on module load
viewTrackingService.initialize();

export default viewTrackingService;
