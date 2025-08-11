/**
 * React hook for managing entity service state and operations
 * Provides a clean interface for entity operations with loading states and error handling
 */

import { useState, useEffect, useCallback } from 'react';
import { entityService } from '../api/services';
import type { Entity, SearchResult, EntityCategory, SearchFilters } from '../types';

export interface UseEntityServiceState {
  entities: Entity[];
  loading: boolean;
  error: string | null;
  searchResults: SearchResult | null;
  totalEntities: number;
  hasMore: boolean;
}

export interface UseEntityServiceActions {
  loadEntities: (params?: any) => Promise<void>;
  searchEntities: (query: string, filters?: SearchFilters) => Promise<void>;
  getTrendingEntities: (limit?: number) => Promise<void>;
  getEntityById: (id: string) => Promise<Entity | null>;
  getEntitysByCategory: (category: EntityCategory, limit?: number) => Promise<void>;
  clearSearch: () => void;
  refresh: () => Promise<void>;
}

export interface UseEntityServiceOptions {
  initialLoad?: boolean;
  initialParams?: any;
}

export const useEntityService = (options: UseEntityServiceOptions = {}) => {
  const { initialLoad = true, initialParams = {} } = options;
  
  const [state, setState] = useState<UseEntityServiceState>({
    entities: [],
    loading: false,
    error: null,
    searchResults: null,
    totalEntities: 0,
    hasMore: false
  });

  const updateState = useCallback((updates: Partial<UseEntityServiceState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const loadEntities = useCallback(async (params = {}) => {
    updateState({ loading: true, error: null });
    
    try {
      const result = await entityService.getEntities({
        limit: 20,
        sortBy: 'rating',
        sortOrder: 'desc',
        ...params
      });
      
      updateState({
        entities: result.entities,
        totalEntities: result.total,
        hasMore: result.hasMore,
        loading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load entities',
        loading: false
      });
    }
  }, [updateState]);

  const searchEntities = useCallback(async (query: string, filters: SearchFilters = {}) => {
    updateState({ loading: true, error: null });
    
    try {
      const result = await entityService.searchEntities(query, filters);
      
      updateState({
        searchResults: result,
        entities: result.entities,
        totalEntities: result.total,
        hasMore: result.hasMore,
        loading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to search entities',
        loading: false
      });
    }
  }, [updateState]);

  const getTrendingEntities = useCallback(async (limit = 10) => {
    updateState({ loading: true, error: null });
    
    try {
      const entities = await entityService.getTrendingEntities(limit);
      
      updateState({
        entities,
        totalEntities: entities.length,
        hasMore: false,
        loading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load trending entities',
        loading: false
      });
    }
  }, [updateState]);

  const getEntityById = useCallback(async (id: string): Promise<Entity | null> => {
    updateState({ loading: true, error: null });
    
    try {
      const entity = await entityService.getEntityById(id);
      updateState({ loading: false });
      return entity;
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load entity',
        loading: false
      });
      return null;
    }
  }, [updateState]);

  const getEntitysByCategory = useCallback(async (category: EntityCategory, limit = 20) => {
    updateState({ loading: true, error: null });
    
    try {
      const result = await entityService.getEntitiesByCategory(category, limit);
      
      updateState({
        entities: result.entities,
        totalEntities: result.total,
        hasMore: result.hasMore,
        loading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : 'Failed to load entities by category',
        loading: false
      });
    }
  }, [updateState]);

  const clearSearch = useCallback(() => {
    updateState({
      searchResults: null,
      error: null
    });
  }, [updateState]);

  const refresh = useCallback(async () => {
    await loadEntities(initialParams);
  }, [loadEntities, initialParams]);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      loadEntities(initialParams);
    }
  }, [initialLoad, initialParams, loadEntities]);

  const actions: UseEntityServiceActions = {
    loadEntities,
    searchEntities,
    getTrendingEntities,
    getEntityById,
    getEntitysByCategory,
    clearSearch,
    refresh
  };

  return {
    ...state,
    ...actions
  };
};

export default useEntityService;