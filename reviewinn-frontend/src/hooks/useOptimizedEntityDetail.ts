import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { entityService, reviewService } from '../api/services';
import type { Review, Entity } from '../types';

export interface OptimizedEntityDetailState {
  entity: Entity | null;
  allReviews: Review[];
  displayedReviews: Review[];
  isLoading: boolean;
  error: string | null;
  selectedRating: number | 'all';
  timeSort: 'newest' | 'oldest';
  isSorting: boolean;
  showSortDropdown: boolean;
  isInitialLoad: boolean;
}

export interface UseOptimizedEntityDetailOptions {
  autoLoad?: boolean;
  enableViewTracking?: boolean;
  cacheTimeout?: number; // Cache timeout in milliseconds
  enablePrefetch?: boolean;
}

// Simple in-memory cache
const entityCache = new Map<string, { entity: Entity; reviews: Review[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useOptimizedEntityDetail = (options: UseOptimizedEntityDetailOptions = {}) => {
  const { 
    autoLoad = true, 
    enableViewTracking = true,
    cacheTimeout = CACHE_DURATION,
    enablePrefetch = true
  } = options;
  
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<OptimizedEntityDetailState>({
    entity: null,
    allReviews: [],
    displayedReviews: [],
    isLoading: true,
    error: null,
    selectedRating: 'all',
    timeSort: 'newest',
    isSorting: false,
    showSortDropdown: false,
    isInitialLoad: true,
  });

  const updateState = useCallback((updates: Partial<OptimizedEntityDetailState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Check cache for entity data
  const getCachedData = useCallback((entityId: string) => {
    const cached = entityCache.get(entityId);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached;
    }
    return null;
  }, [cacheTimeout]);

  // Store data in cache
  const setCachedData = useCallback((entityId: string, entity: Entity, reviews: Review[]) => {
    entityCache.set(entityId, {
      entity,
      reviews,
      timestamp: Date.now()
    });
  }, []);

  // Optimized data loading with caching and abort support
  const loadEntityData = useCallback(async (forceRefresh = false) => {
    if (!id) {
      updateState({ 
        error: 'Entity ID is required', 
        isLoading: false,
        isInitialLoad: false
      });
      return;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedData = getCachedData(id);
      if (cachedData) {
        console.log('🚀 Using cached data for entity:', id);
        updateState({
          entity: cachedData.entity,
          allReviews: cachedData.reviews,
          displayedReviews: cachedData.reviews,
          isLoading: false,
          error: null,
          isInitialLoad: false
        });
        return;
      }
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      updateState({ isLoading: true, error: null });

      // Add minimum loading time for UX (prevents flash)
      const minLoadTime = new Promise(resolve => {
        loadTimeoutRef.current = setTimeout(resolve, 300);
      });

      const [entityResponse, reviewsResponse] = await Promise.all([
        entityService.getEntityById(id, { signal }),
        reviewService.getReviewsForEntity(id, { signal }),
        minLoadTime
      ]);

      // Check if request was aborted
      if (signal.aborted) {
        return;
      }

      if (entityResponse) {
        console.log('🏢 Entity loaded:', {
          id: entityResponse.id,
          name: entityResponse.name,
          cached: false
        });

        const reviews = reviewsResponse?.reviews || [];
        
        // Calculate enhanced metrics
        const reviewCount = reviews.length;
        let averageRating = 0;
        
        if (reviewCount > 0) {
          const totalRating = reviews.reduce((sum: number, review: any) => {
            return sum + (review.overallRating || review.rating || 0);
          }, 0);
          averageRating = Math.round((totalRating / reviewCount) * 10) / 10;
        }
        
        const enhancedEntity = {
          ...entityResponse,
          averageRating,
          reviewCount
        };

        // Cache the data
        setCachedData(id, enhancedEntity, reviews);

        updateState({ 
          entity: enhancedEntity,
          allReviews: reviews,
          displayedReviews: reviews,
          isLoading: false,
          isInitialLoad: false
        });

        // Track view if enabled
        if (enableViewTracking) {
          // Debounced view tracking
          setTimeout(() => {
            console.log('👁️ Tracking view for entity:', enhancedEntity.name);
            // TODO: Implement view tracking API call
          }, 1000);
        }

      } else {
        updateState({ 
          error: 'Entity not found', 
          isLoading: false,
          isInitialLoad: false
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled, don't update state
      }
      
      console.error('Error loading entity data:', err);
      updateState({ 
        error: 'Failed to load entity data', 
        isLoading: false,
        isInitialLoad: false
      });
    }
  }, [id, updateState, getCachedData, setCachedData, enableViewTracking]);

  // Optimized filtering and sorting with memoization
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
      
      return state.timeSort === 'newest' ? dateB - dateA : dateA - dateB;
    });

    updateState({ displayedReviews: filteredReviews });
  }, [state.allReviews, state.selectedRating, state.timeSort, updateState]);

  // Debounced filter application
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFiltersAndSorting();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [applyFiltersAndSorting]);

  // Optimized handlers
  const handleRatingChange = useCallback((rating: number | 'all') => {
    if (rating !== state.selectedRating) {
      updateState({ selectedRating: rating });
    }
  }, [state.selectedRating, updateState]);

  const handleTimeSortChange = useCallback(async (newSort: 'newest' | 'oldest') => {
    if (newSort === state.timeSort) return;
    
    updateState({ 
      isSorting: true, 
      timeSort: newSort, 
      showSortDropdown: false 
    });
    
    // Add visual feedback delay
    setTimeout(() => {
      updateState({ isSorting: false });
    }, 400);
  }, [state.timeSort, updateState]);

  const handleToggleSortDropdown = useCallback(() => {
    updateState({ showSortDropdown: !state.showSortDropdown });
  }, [state.showSortDropdown, updateState]);

  const refreshEntity = useCallback(async () => {
    await loadEntityData(true); // Force refresh
  }, [loadEntityData]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
  }, []);

  // Initial load effect
  useEffect(() => {
    if (autoLoad) {
      loadEntityData();
    }
    
    return cleanup;
  }, [autoLoad, loadEntityData, cleanup]);

  // Prefetch related data (future enhancement)
  useEffect(() => {
    if (enablePrefetch && state.entity && !state.isLoading) {
      // TODO: Prefetch related entities or similar content
      console.log('🔮 Prefetching related content for:', state.entity.name);
    }
  }, [enablePrefetch, state.entity, state.isLoading]);

  // Memoized computed values for performance
  const computedValues = useMemo(() => ({
    hasReviews: state.allReviews.length > 0,
    totalReviews: state.allReviews.length,
    averageRating: state.entity?.averageRating || 0,
    filteredReviewsCount: state.displayedReviews.length,
    isEntityNotFound: state.error === 'Entity not found',
    canWriteReview: !!state.entity,
    isFromCache: !!getCachedData(id || ''),
  }), [state.allReviews, state.displayedReviews, state.entity, state.error, getCachedData, id]);

  return {
    ...state,
    ...computedValues,
    handleRatingChange,
    handleTimeSortChange,
    handleToggleSortDropdown,
    refreshEntity,
    clearError,
    navigate,
    cleanup,
  };
};