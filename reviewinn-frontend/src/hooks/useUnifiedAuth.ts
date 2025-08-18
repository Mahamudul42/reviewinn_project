/**
 * Unified Auth Hook
 * 
 * This hook provides a consistent interface for authentication operations
 * across your entire application. It uses the new unified auth system
 * while maintaining backward compatibility.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authManager } from '../services/authInit';
import type { AuthState, AuthCredentials, RegisterData } from '../services/authInterface';
import type { User } from '../types';

export interface UseUnifiedAuthReturn {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;

  // Utilities
  getToken: () => string | null;
  checkAuth: () => boolean;
  requireAuth: (callback?: () => void) => boolean;
  withAuth: <T>(operation: () => Promise<T>) => Promise<T>;
  ensureAuthenticated: () => Promise<void>;

  // Health
  healthCheck: () => Promise<{ healthy: boolean; details: Record<string, any> }>;
}

export const useUnifiedAuth = (): UseUnifiedAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    isInitialized: false
  });

  const authManagerRef = useRef(authManager);

  // Subscribe to auth state changes
  useEffect(() => {
    console.log('useUnifiedAuth: Setting up subscription to auth manager');
    
    const unsubscribe = authManagerRef.current.subscribe((newState) => {
      console.log('useUnifiedAuth: Auth state changed from manager:', newState);
      setAuthState(newState);
    });

    // Get initial state
    const initialState = authManagerRef.current.getAuthState();
    console.log('useUnifiedAuth: Setting initial state:', initialState);
    setAuthState(initialState);

    // Initialize the auth system if not already done
    if (!initialState.isInitialized) {
      console.log('useUnifiedAuth: Initializing auth manager...');
      authManagerRef.current.initialize().catch(error => {
        console.error('useUnifiedAuth: Initialization failed:', error);
      });
    }

    return unsubscribe;
  }, []);

  // Authentication methods
  const login = useCallback(async (credentials: AuthCredentials) => {
    console.log('useUnifiedAuth: Starting login process for:', credentials.email);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await authManagerRef.current.login(credentials);
    console.log('useUnifiedAuth: Login result:', result);
    
    if (!result.success) {
      console.error('useUnifiedAuth: Login failed:', result.error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: result.error || 'Login failed' }));
      throw new Error(result.error || 'Login failed');
    }
    
    // Get the updated state after successful login
    const postLoginState = authManagerRef.current.getAuthState();
    console.log('useUnifiedAuth: Post-login state from manager:', postLoginState);
    setAuthState(postLoginState);
    
    // Emit login success event for homepage refresh
    window.dispatchEvent(new CustomEvent('authLoginSuccess'));
    
    console.log('useUnifiedAuth: Login process completed successfully');
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const result = await authManagerRef.current.register(data);
    
    if (!result.success) {
      setAuthState(prev => ({ ...prev, isLoading: false, error: result.error || 'Registration failed' }));
      throw new Error(result.error || 'Registration failed');
    }
    
    // Get the updated state after successful registration
    const postRegisterState = authManagerRef.current.getAuthState();
    console.log('useUnifiedAuth: Post-registration state from manager:', postRegisterState);
    setAuthState(postRegisterState);
    
    // Emit login success event for homepage refresh
    window.dispatchEvent(new CustomEvent('authLoginSuccess'));
    
    console.log('useUnifiedAuth: Registration successful');
  }, []);

  const logout = useCallback(async () => {
    console.log('useUnifiedAuth: Starting logout process...');
    
    try {
      // Set a logout timestamp before starting logout process
      const logoutTime = Date.now().toString();
      localStorage.setItem('last_logout_time', logoutTime);
      
      // Call the auth manager logout
      const result = await authManagerRef.current.logout();
      
      if (!result.success) {
        console.error('Logout failed:', result.error);
        throw new Error(result.error || 'Logout failed');
      }
      
      console.log('useUnifiedAuth: AuthManager logout successful');
      
      // Update local state immediately to reflect logout
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isInitialized: true
      });
      
      console.log('useUnifiedAuth: Local state updated');
      
      // Emit custom event for other parts of the app
      window.dispatchEvent(new CustomEvent('authLogout'));
      
      // Additional comprehensive cleanup - clear any cached auth data
      const authKeysToRemove = [
        'user_data',
        'reviewsite_last_activity',
        'reviewinn_jwt_token',
        'reviewinn_refresh_token',
        'reviewinn_user_data',
        'reviewinn_remember_me',
        'auth-storage'
      ];
      
      authKeysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log('useUnifiedAuth: Logout successful, all cleanup complete');
    } catch (error) {
      console.error('useUnifiedAuth: Logout process failed:', error);
      
      // Even if logout fails, clear local state for security
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Logout may not have completed properly',
        isInitialized: true
      });
      
      // Clear local storage anyway - emergency cleanup
      const emergencyCleanupKeys = [
        'user_data',
        'reviewsite_last_activity',
        'reviewinn_jwt_token',
        'reviewinn_refresh_token',
        'reviewinn_user_data',
        'reviewinn_remember_me',
        'auth-storage'
      ];
      
      emergencyCleanupKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Set logout timestamp even on failure
      localStorage.setItem('last_logout_time', Date.now().toString());
      
      console.log('useUnifiedAuth: Emergency cleanup completed');
      
      throw error;
    }
  }, []);

  const refreshToken = useCallback(async () => {
    const result = await authManagerRef.current.refreshToken();
    
    if (!result.success) {
      console.error('Token refresh failed:', result.error);
      throw new Error(result.error || 'Token refresh failed');
    }
    
    // Update local state after successful token refresh
    const updatedState = authManagerRef.current.getAuthState();
    setAuthState(updatedState);
  }, []);

  const clearError = useCallback(() => {
    authManagerRef.current.clearError();
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Utility methods
  const getToken = useCallback(() => {
    return authManagerRef.current.getToken();
  }, []);

  const checkAuth = useCallback(() => {
    return authManagerRef.current.checkAuth();
  }, []);

  const requireAuth = useCallback((callback?: () => void) => {
    return authManagerRef.current.requireAuth(callback);
  }, []);

  const withAuth = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    return authManagerRef.current.withAuth(operation);
  }, []);

  const ensureAuthenticated = useCallback(async () => {
    return authManagerRef.current.ensureAuthenticated();
  }, []);

  const healthCheck = useCallback(async () => {
    return authManagerRef.current.healthCheck();
  }, []);

  return {
    // State
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    isInitialized: authState.isInitialized,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    clearError,

    // Utilities
    getToken,
    checkAuth,
    requireAuth,
    withAuth,
    ensureAuthenticated,

    // Health
    healthCheck
  };
};

// Backward compatibility export
export const useAuth = useUnifiedAuth;
export default useUnifiedAuth;