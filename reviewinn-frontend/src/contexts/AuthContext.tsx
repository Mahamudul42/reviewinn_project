/**
 * Unified Authentication Context
 * Single source of truth for authentication state across the entire application
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';
import { httpClient } from '../api/httpClient';
import type { User } from '../types';

export interface AuthContextType {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;

  // Utilities
  getToken: () => string | null;
  checkAuth: () => boolean;
  requireAuth: (callback?: () => void) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [mountComplete, setMountComplete] = useState(false);
  const initializationRef = useRef(false);

  // Get auth state from Zustand store
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: zustandLogin,
    logout: zustandLogout,
    clearError: zustandClearError,
    initialize,
    refreshToken: zustandRefreshToken
  } = useAuthStore();

  // Initialize authentication on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Prevent multiple initialization calls
      if (initializationRef.current) return;
      initializationRef.current = true;

      try {
        console.log('AuthProvider: Starting initialization...');
        
        // Check if a logout just occurred (within last 5 seconds)
        const lastLogoutTime = localStorage.getItem('last_logout_time');
        if (lastLogoutTime) {
          const timeSinceLogout = Date.now() - parseInt(lastLogoutTime);
          if (timeSinceLogout < 5000) { // 5 seconds
            console.log(`AuthProvider: Recent logout detected (${timeSinceLogout}ms ago), skipping initialization`);
            if (isMounted) {
              setIsInitialized(true);
            }
            return;
          } else {
            // Clear old logout timestamp
            localStorage.removeItem('last_logout_time');
          }
        }
        
        await initialize();
        
        // Load user interactions if user is already authenticated after initialization
        const authState = useAuthStore.getState();
        if (authState.isAuthenticated && authState.token) {
          try {
            const { userInteractionService } = await import('../api/services/userInteractionService');
            await userInteractionService.loadUserInteractions();
            console.log('AuthProvider: User interactions loaded during initialization');
          } catch (interactionError) {
            console.warn('AuthProvider: Failed to load user interactions during initialization:', interactionError);
          }
        }
        
        if (isMounted) {
          setIsInitialized(true);
          console.log('AuthProvider: Initialization complete');
        }
      } catch (error) {
        console.error('AuthProvider: Initialization failed:', error);
        if (isMounted) {
          setIsInitialized(true); // Still mark as initialized to prevent infinite loading
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      setMountComplete(true);
      initializeAuth();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [initialize]);

  // Sync httpClient tokens whenever auth state changes
  useEffect(() => {
    if (!isInitialized) return;

    const currentToken = token || localStorage.getItem('reviewinn_jwt_token');
    const currentRefreshToken = localStorage.getItem('reviewinn_refresh_token');

    if (currentToken && isAuthenticated) {
      console.log('AuthProvider: Syncing tokens to httpClient');
      httpClient.setAuthTokens(currentToken, currentRefreshToken || undefined);
    } else {
      console.log('AuthProvider: Clearing tokens from httpClient');
      httpClient.clearAuthTokens();
    }
  }, [token, isAuthenticated, isInitialized]);

  // Enhanced login function
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      console.log('AuthProvider: Starting login process...');
      await zustandLogin(credentials);
      console.log('AuthProvider: Login successful, current state:', {
        isAuthenticated,
        hasUser: !!user,
        hasToken: !!token
      });
      
      // Load user interactions after successful login
      try {
        const { userInteractionService } = await import('../api/services/userInteractionService');
        await userInteractionService.loadUserInteractions();
        console.log('AuthProvider: User interactions loaded after login');
      } catch (interactionError) {
        console.warn('AuthProvider: Failed to load user interactions after login:', interactionError);
      }
    } catch (error) {
      console.error('AuthProvider: Login failed:', error);
      throw error;
    }
  }, [zustandLogin, isAuthenticated, user, token]);

  // Enhanced register function
  const register = useCallback(async (data: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) => {
    try {
      console.log('AuthProvider: Starting registration process...');
      
      // Use the auth service for registration which will handle Zustand sync
      const { authService } = await import('../api/auth');
      const response = await authService.register(data);
      
      // The authService.register already handles Zustand state updates
      console.log('AuthProvider: Registration successful');
      
      // Load user interactions after successful registration
      try {
        const { userInteractionService } = await import('../api/services/userInteractionService');
        await userInteractionService.loadUserInteractions();
        console.log('AuthProvider: User interactions loaded after registration');
      } catch (interactionError) {
        console.warn('AuthProvider: Failed to load user interactions after registration:', interactionError);
      }
    } catch (error) {
      console.error('AuthProvider: Registration failed:', error);
      throw error;
    }
  }, []);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      await zustandLogout();
      console.log('AuthProvider: Logout successful');
      
      // Clear user interactions on logout
      try {
        const { userInteractionService } = await import('../api/services/userInteractionService');
        userInteractionService.clearInteractions();
        console.log('AuthProvider: User interactions cleared after logout');
      } catch (interactionError) {
        console.warn('AuthProvider: Failed to clear user interactions after logout:', interactionError);
      }
      
      // Emit custom event for other parts of the app
      window.dispatchEvent(new CustomEvent('authLogout'));
    } catch (error) {
      console.error('AuthProvider: Logout failed:', error);
    }
  }, [zustandLogout]);

  // Get token utility
  const getToken = useCallback(() => {
    return token || localStorage.getItem('reviewinn_jwt_token');
  }, [token]);

  // Check authentication status
  const checkAuth = useCallback(() => {
    const currentToken = getToken();
    const hasValidToken = !!currentToken && currentToken !== 'undefined' && currentToken !== 'null';
    const hasValidUser = !!user && user.id && user.id !== 'undefined';
    
    return isAuthenticated && hasValidToken && hasValidUser;
  }, [isAuthenticated, getToken, user]);

  // Require authentication utility
  const requireAuth = useCallback((callback?: () => void) => {
    if (checkAuth()) {
      return true;
    }

    // Show auth modal or redirect to login
    console.log('AuthProvider: Authentication required');
    
    if (callback) {
      callback();
    } else {
      // Default: emit event to show auth modal
      window.dispatchEvent(new CustomEvent('openAuthModal'));
    }
    
    return false;
  }, [checkAuth]);

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    token,
    isAuthenticated: isAuthenticated && !!user, // Less strict for UI - just need Zustand state and user
    isLoading: !isInitialized || isLoading,
    error,
    isInitialized,

    // Actions
    login,
    register,
    logout,
    refreshToken: zustandRefreshToken,
    clearError: zustandClearError,

    // Utilities
    getToken,
    checkAuth,
    requireAuth
  };

  // Don't render children until auth is initialized
  if (!mountComplete || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const context = useContext(AuthContext);
    if (!context) {
      throw new Error('withAuth must be used within an AuthProvider');
    }
    const { isAuthenticated, isLoading } = context;

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return null;
    }

    return <Component {...props} />;
  };
};

export default AuthContext;