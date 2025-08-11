import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { entityService, reviewService } from '../api/services';
import type { Review, Entity } from '../types';

export interface EntityDetailState {
  entity: Entity | null;
  allReviews: Review[];
  displayedReviews: Review[];
  isLoading: boolean;
  error: string | null;
  selectedRating: number | 'all';
  timeSort: 'newest' | 'oldest';
  isSorting: boolean;
  showSortDropdown: boolean;
}

export interface EntityDetailActions {
  handleRatingChange: (rating: number | 'all') => void;
  handleTimeSortChange: (newSort: 'newest' | 'oldest') => Promise<void>;
  handleToggleSortDropdown: () => void;
  refreshEntity: () => Promise<void>;
  clearError: () => void;
}

export interface UseEntityDetailOptions {
  autoLoad?: boolean;
  enableViewTracking?: boolean;
}

export const useEntityDetail = (options: UseEntityDetailOptions = {}) => {
  const { autoLoad = true, enableViewTracking = true } = options;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<EntityDetailState>({
    entity: null,
    allReviews: [],
    displayedReviews: [],
    isLoading: true,
    error: null,
    selectedRating: 'all',
    timeSort: 'newest',
    isSorting: false,
    showSortDropdown: false,
  });

  const updateState = useCallback((updates: Partial<EntityDetailState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadEntityData = useCallback(async () => {
    if (!id) {
      updateState({ 
        error: 'Entity ID is required', 
        isLoading: false 
      });
      return;
    }

    try {
      updateState({ isLoading: true, error: null });

      // PERFORMANCE OPTIMIZED: Single comprehensive API call (same as user profile)
      // Get entity + reviews + engagement data in ONE call instead of two separate calls
      const { reviewStatsService } = await import('../services/reviewStatsService');
      const result = await reviewStatsService.getEntityDetailsWithStats(id, {
        page: 1,
        limit: 50, // Get more reviews initially
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const entityResponse = result.entity;
      const reviewsResponse = { reviews: result.reviews, total: result.total, hasMore: result.hasMore };

      if (entityResponse) {
        console.log('🏢 OPTIMIZED Entity received (same pattern as user profile):', {
          id: entityResponse.id,
          name: entityResponse.name,
          averageRating: entityResponse.averageRating,
          reviewCount: entityResponse.reviewCount,
          isVerified: entityResponse.isVerified,
          optimizationNote: 'Single API call used instead of 2 separate calls'
        });
        updateState({ entity: entityResponse });
      } else {
        updateState({ 
          error: 'Entity not found', 
          isLoading: false 
        });
        return;
      }

      if (reviewsResponse && reviewsResponse.reviews) {
        // OPTIMIZED: Reviews already include comprehensive data (reactions, comments, views, etc.)
        const reviews = reviewsResponse.reviews;
        const reviewCount = reviews.length;
        
        // Entity data is already optimized from the single API call
        // No need to recalculate - trust the backend aggregation
        const enhancedEntity = entityResponse ? {
          ...entityResponse,
          // Use backend-calculated values for accuracy
          averageRating: entityResponse.averageRating,
          reviewCount: entityResponse.reviewCount
        } : null;
        
        console.log('🏢 OPTIMIZED Enhanced entity (single comprehensive call):', {
          id: enhancedEntity?.id,
          name: enhancedEntity?.name,
          averageRating: enhancedEntity?.averageRating,
          reviewCount: enhancedEntity?.reviewCount,
          reviewsWithEngagement: reviews.filter((r: any) => 
            (r.total_reactions > 0) || (r.comment_count > 0) || (r.view_count > 0)
          ).length,
          optimizationNote: 'Backend provides pre-calculated aggregations for performance'
        });
        
        updateState({ 
          entity: enhancedEntity,
          allReviews: reviews,
          displayedReviews: reviews,
          isLoading: false 
        });
      } else {
        updateState({ 
          allReviews: [],
          displayedReviews: [],
          isLoading: false 
        });
      }
    } catch (err) {
      console.error('Error loading entity data:', err);
      updateState({ 
        error: 'Failed to load entity data', 
        isLoading: false 
      });
    }
  }, [id, updateState]);

  // Apply filters and sorting
  const applyFiltersAndSorting = useCallback(() => {
    if (!state.allReviews.length) return;

    let filteredReviews = [...state.allReviews];

    // Apply rating filter
    if (state.selectedRating !== 'all') {
      filteredReviews = filteredReviews.filter((review: Review) => {
        const rating = Math.floor(review.overallRating || 0);
        return rating === state.selectedRating;
      });
    }

    // Apply time sorting
    filteredReviews.sort((a: Review, b: Review) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (state.timeSort === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    updateState({ displayedReviews: filteredReviews });
  }, [state.allReviews, state.selectedRating, state.timeSort, updateState]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndSorting();
  }, [applyFiltersAndSorting]);

  const handleRatingChange = useCallback((rating: number | 'all') => {
    updateState({ selectedRating: rating });
  }, [updateState]);

  const handleTimeSortChange = useCallback(async (newSort: 'newest' | 'oldest') => {
    if (newSort === state.timeSort) return;
    
    updateState({ 
      isSorting: true, 
      timeSort: newSort, 
      showSortDropdown: false 
    });
    
    // Add small delay for visual feedback
    setTimeout(() => {
      updateState({ isSorting: false });
    }, 500);
  }, [state.timeSort, updateState]);

  const handleToggleSortDropdown = useCallback(() => {
    updateState({ showSortDropdown: !state.showSortDropdown });
  }, [state.showSortDropdown, updateState]);

  const refreshEntity = useCallback(async () => {
    await loadEntityData();
  }, [loadEntityData]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      loadEntityData();
    }
  }, [autoLoad, loadEntityData]);

  // Computed values
  const computedValues = useMemo(() => ({
    hasReviews: state.allReviews.length > 0,
    totalReviews: state.allReviews.length,
    averageRating: state.entity?.averageRating || 0,
    filteredReviewsCount: state.displayedReviews.length,
    isEntityNotFound: state.error === 'Entity not found',
    canWriteReview: !!state.entity,
  }), [state.allReviews, state.displayedReviews, state.entity, state.error]);

  const actions: EntityDetailActions = {
    handleRatingChange,
    handleTimeSortChange,
    handleToggleSortDropdown,
    refreshEntity,
    clearError,
  };

  return {
    ...state,
    ...computedValues,
    ...actions,
    navigate,
  };
}; 