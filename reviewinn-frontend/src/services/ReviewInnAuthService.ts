/**
 * ReviewInn Auth Service Bridge
 * 
 * This class bridges your existing auth system to the new unified interface.
 * It wraps your current AuthContext and authService to provide a consistent API.
 */

import type { IAuthService, AuthState, AuthCredentials, RegisterData, AuthResponse } from './authInterface';
import type { User } from '../types';
import { authService } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

export class ReviewInnAuthService implements IAuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private storeUnsubscribe: (() => void) | null = null;

  constructor() {
    console.log('ReviewInnAuthService: Constructor - setting up subscriptions');
    
    // Subscribe to Zustand store changes
    this.storeUnsubscribe = useAuthStore.subscribe(
      (state) => {
        console.log('ReviewInnAuthService: Zustand state changed:', {
          isAuthenticated: state.isAuthenticated,
          hasUser: !!state.user,
          hasToken: !!state.token
        });
        
        const authState = this.mapZustandStateToAuthState(state);
        this.notifyListeners(authState);
      }
    );
  }

  private mapZustandStateToAuthState(zustandState: any): AuthState {
    return {
      user: zustandState.user,
      token: zustandState.token,
      isAuthenticated: zustandState.isAuthenticated,
      isLoading: zustandState.isLoading,
      error: zustandState.error,
      isInitialized: !zustandState.isLoading
    };
  }

  private notifyListeners(state: AuthState): void {
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  // ============================================================================
  // IAuthService Implementation
  // ============================================================================

  getAuthState(): AuthState {
    const zustandState = useAuthStore.getState();
    const mappedState = this.mapZustandStateToAuthState(zustandState);
    
    // Debug logging to track state
    console.log('ReviewInnAuthService.getAuthState():', {
      zustand: {
        isAuthenticated: zustandState.isAuthenticated,
        hasUser: !!zustandState.user,
        hasToken: !!zustandState.token,
        isLoading: zustandState.isLoading
      },
      mapped: mappedState,
      authService: {
        isAuthenticated: authService.isUserAuthenticated(),
        hasUser: !!authService.getCurrentUser(),
        hasToken: !!authService.getToken()
      }
    });
    
    return mappedState;
  }

  isAuthenticated(): boolean {
    const zustandState = useAuthStore.getState();
    
    console.log('ReviewInnAuthService.isAuthenticated():', {
      zustandAuth: zustandState.isAuthenticated,
      result: zustandState.isAuthenticated
    });
    
    return zustandState.isAuthenticated;
  }

  getCurrentUser(): User | null {
    const zustandUser = useAuthStore.getState().user;
    
    console.log('ReviewInnAuthService.getCurrentUser():', {
      zustandUser: !!zustandUser,
      result: !!zustandUser
    });
    
    return zustandUser;
  }

  getToken(): string | null {
    const zustandToken = useAuthStore.getState().token;
    
    console.log('ReviewInnAuthService.getToken():', {
      zustandToken: !!zustandToken,
      result: !!zustandToken
    });
    
    return zustandToken;
  }

  isInitialized(): boolean {
    const zustandState = useAuthStore.getState();
    return !zustandState.isLoading;
  }

  async initialize(): Promise<void> {
    try {
      console.log('ReviewInnAuthService: Initializing...');
      const zustandStore = useAuthStore.getState();
      await zustandStore.initialize();
      console.log('ReviewInnAuthService: Initialization complete');
    } catch (error) {
      console.error('ReviewInnAuthService: Initialization failed:', error);
      throw error;
    }
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse<{ user: User; token: string }>> {
    try {
      console.log('ReviewInnAuthService: Logging in user:', credentials.email);
      
      // Call the original auth service login
      const response = await authService.login(credentials);
      
      // Ensure Zustand store is updated after successful login
      const zustandStore = useAuthStore.getState();
      console.log('ReviewInnAuthService: Updating Zustand store with login data');
      zustandStore.login(response.user, response.token);
      
      // Wait a moment to ensure state propagation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the state was updated
      const newState = useAuthStore.getState();
      console.log('ReviewInnAuthService: Post-login state verification:', {
        isAuthenticated: newState.isAuthenticated,
        hasUser: !!newState.user,
        hasToken: !!newState.token
      });
      
      return {
        success: true,
        data: {
          user: response.user,
          token: response.token
        }
      };
    } catch (error: any) {
      console.error('ReviewInnAuthService: Login failed:', error);
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Login failed'
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResponse<{ user: User; token: string }>> {
    try {
      console.log('ReviewInnAuthService: Registering user:', data.email);
      const response = await authService.register(data);
      
      // Get the updated auth state after registration (includes auto-login)
      const newState = authService.getAuthState();
      console.log('ReviewInnAuthService: Post-registration auth state:', {
        isAuthenticated: newState.isAuthenticated,
        hasUser: !!newState.user,
        hasToken: !!newState.token
      });
      
      return {
        success: true,
        data: {
          user: response.user,
          token: response.token
        }
      };
    } catch (error: any) {
      console.error('ReviewInnAuthService: Registration failed:', error);
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Registration failed'
      };
    }
  }

  async logout(): Promise<AuthResponse<void>> {
    try {
      console.log('ReviewInnAuthService: Starting logout process');
      
      // First, logout from the auth service (this calls API and clears localStorage)
      await authService.logout();
      console.log('ReviewInnAuthService: AuthService logout completed');
      
      // Then, clear the Zustand store
      const zustandStore = useAuthStore.getState();
      zustandStore.logout();
      console.log('ReviewInnAuthService: Zustand store cleared');
      
      // Additional cleanup - ensure all possible auth keys are cleared
      const additionalKeys = [
        'last_logout_time', // Don't clear this one as it prevents immediate re-auth
        'reviewsite_last_activity',
        'auth_token',
        'refresh_token',
        'user_data',
        'reviewinn_remember_me'
      ];
      
      additionalKeys.forEach(key => {
        if (key !== 'last_logout_time') {
          localStorage.removeItem(key);
        }
      });
      
      console.log('ReviewInnAuthService: Additional cleanup completed');
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('ReviewInnAuthService: Logout failed:', error);
      
      // Even if logout failed, try to clear local state
      try {
        const zustandStore = useAuthStore.getState();
        zustandStore.logout();
        
        // Clear all auth-related localStorage items
        const allAuthKeys = [
          'reviewinn_jwt_token',
          'reviewinn_refresh_token',
          'reviewinn_user_data',
          'reviewinn_remember_me',
          'auth-storage',
          'auth_token',
          'refresh_token',
          'user_data',
          'reviewsite_last_activity'
        ];
        
        allAuthKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        
        console.log('ReviewInnAuthService: Emergency cleanup completed');
      } catch (cleanupError) {
        console.error('ReviewInnAuthService: Emergency cleanup failed:', cleanupError);
      }
      
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Logout failed'
      };
    }
  }

  async refreshToken(): Promise<AuthResponse<{ token: string }>> {
    try {
      console.log('ReviewInnAuthService: Refreshing token');
      await authService.restoreAuthFromToken();
      const newToken = authService.getToken();
      
      if (newToken) {
        return {
          success: true,
          data: {
            token: newToken
          }
        };
      } else {
        throw new Error('Failed to get new token');
      }
    } catch (error: any) {
      console.error('ReviewInnAuthService: Token refresh failed:', error);
      return {
        success: false,
        error: typeof error === 'string' ? error : error.message || 'Token refresh failed'
      };
    }
  }

  checkAuth(): boolean {
    const currentToken = this.getToken();
    const hasValidToken = !!currentToken && currentToken !== 'undefined' && currentToken !== 'null';
    const hasValidUser = !!this.getCurrentUser();
    
    return this.isAuthenticated() && hasValidToken && hasValidUser;
  }

  requireAuth(callback?: () => void): boolean {
    if (this.checkAuth()) {
      return true;
    }

    console.log('ReviewInnAuthService: Authentication required');
    
    if (callback) {
      callback();
    } else {
      // Default: emit event to show auth modal
      window.dispatchEvent(new CustomEvent('openAuthModal'));
    }
    
    return false;
  }

  clearError(): void {
    const zustandStore = useAuthStore.getState();
    zustandStore.clearError();
  }

  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately notify with current state
    const currentState = this.getAuthState();
    callback(currentState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    return this.subscribe(callback);
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
    this.listeners = [];
  }
}