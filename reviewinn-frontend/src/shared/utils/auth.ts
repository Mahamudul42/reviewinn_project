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
  const authState = useAuthStore.getState();
  const token = authState.token;
  
  // FIXED: Only return auth headers if user is actually authenticated
  if (token && authState.isAuthenticated && token !== 'null' && token !== 'undefined') {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};

/**
 * Get the current auth token
 * Uses only the unified auth store - no fallbacks
 */
export const getAuthToken = (): string | null => {
  const authState = useAuthStore.getState();
  // FIXED: Only return token if user is actually authenticated
  if (authState.isAuthenticated && authState.token) {
    return authState.token;
  }
  return null;
};

/**
 * Check if user is authenticated
 * Uses only the unified auth store - no fallbacks
 */
export const isAuthenticated = (): boolean => {
  const authState = useAuthStore.getState();
  // FIXED: Check both token and authenticated state
  return authState.isAuthenticated && !!authState.token && !!authState.user;
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