/**
 * Centralized Authentication Utilities
 * 
 * This module provides unified auth utilities to replace direct localStorage access
 * throughout the application. All service files should use these utilities instead
 * of accessing localStorage directly.
 */

import { useAuthStore } from '../../stores/authStore';

/**
 * Get authentication headers for API requests
 * Uses only the unified auth store - no fallbacks
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = useAuthStore.getState().token;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Get the current auth token
 * Uses only the unified auth store - no fallbacks
 */
export const getAuthToken = (): string | null => {
  return useAuthStore.getState().token;
};

/**
 * Check if user is authenticated
 * Uses only the unified auth store - no fallbacks
 */
export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().isAuthenticated;
};

/**
 * Get the current user
 * Uses only the unified auth store - no fallbacks
 */
export const getCurrentUser = () => {
  return useAuthStore.getState().user;
};

/**
 * Check if authentication is required for a request
 * Returns true if user should be authenticated but isn't
 */
export const requiresAuth = (): boolean => {
  const state = useAuthStore.getState();
  return !state.isAuthenticated;
};

/**
 * Create authenticated fetch options
 * Combines default headers with auth headers
 */
export const createAuthenticatedRequestInit = (options: RequestInit = {}): RequestInit => {
  const authHeaders = getAuthHeaders();
  
  return {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  };
};