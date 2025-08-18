/**
 * Unified Authentication Context
 * Single source of truth for authentication state across the entire application
 * Now uses the unified auth system (useUnifiedAuth) as the primary interface
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
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
  const [mountComplete, setMountComplete] = useState(false);

  // Use the unified auth system as the primary interface
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,
    login: unifiedLogin,
    register: unifiedRegister,
    logout: unifiedLogout,
    refreshToken: unifiedRefreshToken,
    clearError: unifiedClearError,
    getToken,
    checkAuth,
    requireAuth
  } = useUnifiedAuth();

  // Initialize authentication on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Starting initialization...');
        
        // Load user interactions if user is already authenticated after initialization
        if (isAuthenticated && token) {
          try {
            const { userInteractionService } = await import('../api/services/userInteractionService');
            await userInteractionService.loadUserInteractions();
            console.log('AuthProvider: User interactions loaded during initialization');
          } catch (interactionError) {
            console.warn('AuthProvider: Failed to load user interactions during initialization:', interactionError);
          }
        }
        
        if (isMounted) {
          console.log('AuthProvider: Initialization complete');
        }
      } catch (error) {
        console.error('AuthProvider: Initialization failed:', error);
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
  }, [isAuthenticated, token]);

  // Token sync is now handled by the unified auth system
  // No need for manual httpClient sync here

  // Enhanced login function
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      console.log('AuthProvider: Starting login process...');
      await unifiedLogin(credentials);
      console.log('AuthProvider: Login successful');
      
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
  }, [unifiedLogin]);

  // Enhanced register function
  const register = useCallback(async (data: { firstName: string; lastName: string; email: string; password: string; confirmPassword: string }) => {
    try {
      console.log('AuthProvider: Starting registration process...');
      await unifiedRegister(data);
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
  }, [unifiedRegister]);

  // Enhanced logout function
  const logout = useCallback(async () => {
    try {
      await unifiedLogout();
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
  }, [unifiedLogout]);

  // Utility functions are now provided by useUnifiedAuth

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
    refreshToken: unifiedRefreshToken,
    clearError: unifiedClearError,

    // Utilities
    getToken,
    checkAuth,
    requireAuth
  };

  // Don't render children until auth is initialized and component is mounted
  if (!mountComplete || (!isInitialized && isLoading)) {
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