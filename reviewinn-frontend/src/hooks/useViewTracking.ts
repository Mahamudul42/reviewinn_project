/**
 * React Hook for Review View Tracking
 * Provides industry-standard view tracking with 24-hour rate limiting
 * Gracefully handles errors and doesn't break the UI if backend is unavailable
 */
import { useEffect, useRef, useCallback } from 'react';
import { viewTrackingService } from '../api/viewTracking';

export interface UseReviewViewTrackingOptions {
  /** Whether to track views when the element enters the viewport */
  trackOnVisible?: boolean;
  /** Minimum time element must be visible before tracking (in milliseconds) */
  visibilityThreshold?: number;
  /** Whether to show console logs for debugging */
  debug?: boolean;
  /** Callback called when a view is successfully tracked */
  onViewTracked?: (newViewCount: number) => void;
}

/**
 * Hook for tracking review views with industry-standard rate limiting
 * Only authenticated users can increment view counts
 * Each user can only increment the count once per 24 hours per review
 */
export function useReviewViewTracking(
  reviewId: number,
  options: UseReviewViewTrackingOptions = {}
) {
  const {
    trackOnVisible = true,
    visibilityThreshold = 2000, // 2 seconds
    debug = false,
    onViewTracked
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const visibilityTimerRef = useRef<number | null>(null);
  const hasTrackedRef = useRef(false);

  // Simple client-side rate limiting
  const canView = useCallback(() => {
    try {
      const lastViewKey = `review_view_${reviewId}`;
      const lastViewTime = localStorage.getItem(lastViewKey);
      
      if (lastViewTime) {
        const timeDiff = Date.now() - parseInt(lastViewTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return timeDiff >= twentyFourHours;
      }
      
      return true;
    } catch (error) {
      if (debug) console.warn('Error checking view rate limit:', error);
      return true; // Default to allowing views if there's an error
    }
  }, [reviewId, debug]);

  // Manual tracking function with optimistic updates (like comment count pattern)
  const trackView = useCallback(async () => {
    if (hasTrackedRef.current) {
      if (debug) console.log(`Review ${reviewId}: Already tracked in this session`);
      return;
    }

    if (!canView()) {
      if (debug) console.log(`Review ${reviewId}: Rate limited`);
      return;
    }

    try {
      if (debug) console.log(`Review ${reviewId}: Attempting to track view`);
      
      // 🚀 IMMEDIATE UPDATE: Call callback immediately for optimistic update
      hasTrackedRef.current = true;
      const sessionKey = `review_view_${reviewId}`;
      sessionStorage.setItem(sessionKey, 'true');
      
      // Store the view time for rate limiting
      const lastViewKey = `review_view_${reviewId}`;
      localStorage.setItem(lastViewKey, Date.now().toString());
      
      // Call the callback immediately for optimistic UI update (like comment count)
      if (onViewTracked) {
        // We don't have the exact count from server yet, so trigger the increment
        onViewTracked(0); // The callback will handle the increment
      }
      
      if (debug) console.log(`Review ${reviewId}: View tracked optimistically`);
      
      // Use the view tracking service
      const result = await viewTrackingService.trackReviewView(reviewId);
      
      // Sync with server if successful and different from optimistic count
      if (result.tracked && result.view_count && onViewTracked) {
        // Note: The actual sync logic will be handled by the callback implementation
        if (debug) console.log(`Review ${reviewId}: View synced with server: ${result.view_count}`);
      } else if (!result.tracked) {
        if (debug) console.log(`Review ${reviewId}: Server didn't track - ${result.reason}`);
        // Keep optimistic update anyway (like comment count pattern)
      }
    } catch (error) {
      // Silently handle errors to prevent breaking the UI
      if (debug) console.warn(`Review ${reviewId}: Failed to track view:`, error);
      
      // Keep the optimistic update even if API fails (like comment count pattern)
      // The hasTrackedRef.current is already set to true above
    }
  }, [reviewId, debug, canView, onViewTracked]);

  // Intersection Observer for visibility tracking
  useEffect(() => {
    if (!trackOnVisible || !elementRef.current || !canView()) {
      return;
    }

    const element = elementRef.current;
    let observer: IntersectionObserver | null = null;

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      
      if (entry.isIntersecting) {
        // Element is visible, start timer
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
        }
        
        visibilityTimerRef.current = window.setTimeout(() => {
          if (!hasTrackedRef.current) {
            trackView();
          }
        }, visibilityThreshold);
        
        if (debug) console.log(`Review ${reviewId}: Element visible, timer started`);
      } else {
        // Element is not visible, clear timer
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
          visibilityTimerRef.current = null;
        }
        
        if (debug) console.log(`Review ${reviewId}: Element not visible, timer cleared`);
      }
    };

    try {
      observer = new IntersectionObserver(handleIntersection, {
        threshold: 0.5, // Element must be 50% visible
        rootMargin: '0px 0px -10% 0px' // Trigger when element is 10% into viewport
      });

      observer.observe(element);
    } catch (error) {
      if (debug) console.warn('Error setting up intersection observer:', error);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    };
  }, [reviewId, trackOnVisible, canView, visibilityThreshold, trackView, debug]);

  return {
    elementRef,
    canView: canView(),
    trackView
  };
}