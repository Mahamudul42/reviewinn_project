import { useCallback } from 'react';
import { reviewStatsService } from '../services/reviewStatsService';
import type { Review } from '../types';

/**
 * Hook for managing review statistics across different pages
 * Provides consistent interface for fetching reviews with full stats
 */
export const useReviewStats = () => {
  
  /**
   * Get user reviews with full statistics
   */
  const getUserReviewsWithStats = useCallback(async (
    userId: string,
    params: {
      page?: number;
      limit?: number;
      includeAnonymous?: boolean;
    } = {}
  ) => {
    return reviewStatsService.getUserReviewsWithStats(userId, params);
  }, []);

  /**
   * Get homepage reviews with full statistics
   */
  const getHomepageReviewsWithStats = useCallback(async (
    params: {
      page?: number;
      limit?: number;
      sortBy?: 'created_at' | 'view_count' | 'overall_rating';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) => {
    return reviewStatsService.getHomepageReviewsWithStats(params);
  }, []);

  /**
   * Get entity reviews with full statistics
   */
  const getEntityReviewsWithStats = useCallback(async (
    entityId: string,
    params: {
      page?: number;
      limit?: number;
      sortBy?: 'created_at' | 'view_count' | 'overall_rating';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ) => {
    return reviewStatsService.getEntityReviewsWithStats(entityId, params);
  }, []);

  /**
   * Update review statistics after user interaction
   */
  const updateReviewStats = useCallback(async (
    reviewId: string,
    updates: {
      reactions?: Record<string, number>;
      user_reaction?: string;
      comment_count_change?: number;
      view_count_change?: number;
    }
  ) => {
    return reviewStatsService.updateReviewStats(reviewId, updates);
  }, []);

  /**
   * Invalidate cache for a specific review
   */
  const invalidateReviewCache = useCallback((reviewId: string) => {
    reviewStatsService.invalidateReviewCache(reviewId);
  }, []);

  /**
   * Clear all cached review stats
   */
  const clearAllCache = useCallback(() => {
    reviewStatsService.clearCache();
  }, []);

  /**
   * Get cached review if available
   */
  const getCachedReview = useCallback((reviewId: string): Review | null => {
    return reviewStatsService.getCachedReview(reviewId);
  }, []);

  return {
    getUserReviewsWithStats,
    getHomepageReviewsWithStats,
    getEntityReviewsWithStats,
    updateReviewStats,
    invalidateReviewCache,
    clearAllCache,
    getCachedReview
  };
};