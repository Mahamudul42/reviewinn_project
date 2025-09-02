/**
 * Authentication Store - Global state management for user authentication
 * Using Zustand for simple and efficient state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_CONFIG, API_ENDPOINTS } from '../api/config';
import { emitAuthEvent } from '../utils/authEvents';
import type { User } from '../types';

// Auth state interface
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions interface
interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkTokenValidity: () => Promise<boolean>;
}

// Combined auth store interface
export interface AuthStore extends AuthState, AuthActions {}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Create auth store with persistence
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Set user
      setUser: (user: User) => set(() => ({
        user,
        isAuthenticated: true,
        error: null,
      })),
      
      // Set token
      setToken: (token: string) => set(() => ({
        token,
        error: null,
      })),
      
      // Login action
      login: (user: User, token: string) => {
        // Get refresh token from localStorage if available
        const refreshToken = localStorage.getItem('reviewinn_refresh_token');
        
        set(() => ({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        
        // Store tokens in localStorage for persistence
        localStorage.setItem('reviewinn_jwt_token', token);
        localStorage.setItem('reviewinn_user_data', JSON.stringify(user));
        
        // Sync with httpClient immediately
        import('../api/httpClient').then(({ httpClient }) => {
          httpClient.setAuthTokens(token, refreshToken || undefined);
        });
        
        // Clear any previous logout timestamp since we're now authenticated
        localStorage.removeItem('last_logout_time');
        
        emitAuthEvent.login(user, token);
        
        // Emit auth state change event for Layout component
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { isAuthenticated: true, user } 
        }));
        console.log('AuthStore: Login complete - user authenticated');
      },
      
      // Logout action
      logout: () => {
        console.log('AuthStore: Starting logout process...');
        
        // Set logout timestamp to prevent immediate re-initialization
        const logoutTime = Date.now().toString();
        localStorage.setItem('last_logout_time', logoutTime);
        console.log('AuthStore: Set logout timestamp:', logoutTime);
        
        // Clear httpClient tokens first
        import('../api/httpClient').then(({ httpClient }) => {
          httpClient.clearAuthTokens();
        });
        
        // Clear state first to immediately update UI
        set(() => ({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }));
        
        // Clear localStorage items that might persist auth data
        try {
          const itemsToRemove = [
            'refresh_token', 
            'user_data',
            'reviewsite_last_activity',
            'reviewinn_jwt_token',
            'reviewinn_refresh_token',
            'reviewinn_user_data',
            'reviewinn_remember_me',
            'auth-storage' // Zustand persist key - this will also trigger the storage removeItem method
          ];
          
          itemsToRemove.forEach(item => {
            localStorage.removeItem(item);
          });
          
          console.log('AuthStore: All localStorage items cleared');
        } catch (error) {
          console.warn('AuthStore: Error clearing localStorage:', error);
        }
        
        emitAuthEvent.logout();
        
        // Emit auth state change event for Layout component
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { isAuthenticated: false, user: null } 
        }));
        
        // Emit logout event for other components to listen to
        window.dispatchEvent(new CustomEvent('authLogout'));
        
        console.log('AuthStore: Logout complete - user signed out');
      },
      
      // Update user
      updateUser: (updates: Partial<User>) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
        error: null,
      })),
      
      // Set loading state
      setLoading: (loading: boolean) => set(() => ({
        isLoading: loading,
      })),
      
      // Set error
      setError: (error: string | null) => set(() => ({
        error,
        isLoading: false,
      })),
      
      // Clear error
      clearError: () => set(() => ({
        error: null,
      })),
      
      // Initialize auth from stored data - simplified and more reliable
      initialize: async () => {
        const state = get();
        set({ isLoading: true, error: null });
        
        try {
          console.log('AuthStore: Starting initialization...');
          
          // Check if a logout just occurred (within last 10 seconds)
          const lastLogoutTime = localStorage.getItem('last_logout_time');
          if (lastLogoutTime) {
            const timeSinceLogout = Date.now() - parseInt(lastLogoutTime);
            if (timeSinceLogout < 10000) { // 10 seconds
              console.log(`AuthStore: Recent logout detected (${timeSinceLogout}ms ago), skipping auth restoration`);
              // Clear any persisted state as well
              try {
                localStorage.removeItem('auth-storage');
              } catch (e) {
                console.warn('Error clearing auth-storage:', e);
              }
              set({ isLoading: false, isAuthenticated: false, user: null, token: null });
              return;
            } else {
              // Clear old logout timestamp
              localStorage.removeItem('last_logout_time');
            }
          }
          
          // Check if we already have valid auth state from Zustand persistence
          if (state.isAuthenticated && state.user && state.token) {
            console.log('AuthStore: Found valid persisted auth state');
            
            // FIXED: Validate token synchronously before trusting persisted state
            try {
              // Basic token structure validation (don't trust expired tokens)
              const tokenParts = state.token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                const now = Math.floor(Date.now() / 1000);
                
                // If token is expired, clear state and continue to fallback
                if (payload.exp && payload.exp < now) {
                  console.log('AuthStore: Persisted token is expired, clearing state');
                  set({ 
                    user: null, 
                    token: null, 
                    isAuthenticated: false, 
                    isLoading: false 
                  });
                  return;
                }
              }
            } catch (error) {
              console.warn('AuthStore: Invalid token format, clearing state');
              set({ 
                user: null, 
                token: null, 
                isAuthenticated: false, 
                isLoading: false 
              });
              return;
            }
            
            // Get refresh token from localStorage for token sync
            const refreshToken = localStorage.getItem('reviewinn_refresh_token');
            
            // Sync with httpClient
            const { httpClient } = await import('../api/httpClient');
            httpClient.setAuthTokens(state.token, refreshToken || undefined);
            
            // Emit auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
              detail: { isAuthenticated: true, user: state.user } 
            }));
            
            set({ isLoading: false });
            
            // Validate token in background without blocking UI
            setTimeout(() => {
              get().checkTokenValidity().catch(error => {
                console.warn('Background token validation failed:', error);
                if (error.response?.status === 401) {
                  console.log('AuthStore: Token expired, attempting refresh');
                  // Try to refresh token before logging out
                  get().refreshToken().catch(() => {
                    console.log('AuthStore: Token refresh failed, logging out');
                    get().logout();
                  });
                }
              });
            }, 1000); // Delay validation to not block initialization
            
            return;
          }
          
          // Fallback: Check localStorage for individual tokens
          const storedToken = localStorage.getItem('reviewinn_jwt_token');
          const storedUser = localStorage.getItem('reviewinn_user_data');
          
          if (storedToken && storedUser) {
            try {
              const user = JSON.parse(storedUser);
              console.log('AuthStore: Found auth data in localStorage, restoring state');
              
              const refreshToken = localStorage.getItem('reviewinn_refresh_token');
              
              // Restore auth state
              set({ 
                user, 
                token: storedToken, 
                isAuthenticated: true, 
                isLoading: false 
              });
              
              // Sync with httpClient
              const { httpClient } = await import('../api/httpClient');
              httpClient.setAuthTokens(storedToken, refreshToken || undefined);
              
              // Emit auth state change event
              window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { isAuthenticated: true, user } 
              }));
              
              // Validate token in background
              setTimeout(() => {
                get().checkTokenValidity().catch(error => {
                  if (error.response?.status === 401) {
                    get().refreshToken().catch(() => get().logout());
                  }
                });
              }, 1000);
              
              return;
            } catch (error) {
              console.warn('AuthStore: Failed to parse stored user data:', error);
              localStorage.removeItem('reviewinn_user_data');
            }
          }
          
          // No valid auth state found
          console.log('AuthStore: No valid auth state found, user not authenticated');
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          
          // Clear httpClient
          const { httpClient } = await import('../api/httpClient');
          httpClient.clearAuthTokens();
          
        } catch (error) {
          console.error('AuthStore: Initialization error:', error);
          set({ 
            user: null, 
            token: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: 'Failed to initialize authentication'
          });
        }
      },
      
      // Refresh token
      refreshToken: async () => {
        const state = get();
        const refreshToken = localStorage.getItem('reviewinn_refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');
        
        try {
          // Import httpClient dynamically to avoid circular dependency
          const { httpClient } = await import('../api/httpClient');
          const response = await httpClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
            refresh_token: refreshToken
          });
          
          if (response.data?.access_token) {
            localStorage.setItem('reviewinn_jwt_token', response.data.access_token);
            if (response.data.refresh_token) {
              localStorage.setItem('reviewinn_refresh_token', response.data.refresh_token);
            }
            set({ token: response.data.access_token, error: null });
            emitAuthEvent.tokenRefresh(response.data.access_token);
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          get().logout();
          throw error;
        }
      },
      
      // Check if current token is valid
      checkTokenValidity: async () => {
        const state = get();
        const token = state.token || localStorage.getItem('reviewinn_jwt_token');
        if (!token) return false;
        
        try {
          // Ensure httpClient has the token before making the request
          const { httpClient } = await import('../api/httpClient');
          httpClient.setAuthTokens(token);
          
          const response = await httpClient.get(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.ME}`);
          if (response.data && (response.data.user_id || response.data.id)) {
            // Update user data if we get fresh info
            const userData = response.data;
            const user: User = {
              id: (userData.user_id || userData.id).toString(),
              username: userData.username || '',
              email: userData.email || '',
              name: userData.full_name || userData.name || userData.username || '',
              avatar: userData.avatar || 'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg',
              level: userData.level || 1,
              points: userData.points || 0,
              isVerified: userData.is_verified || false,
              preferences: userData.preferences || {},
              stats: userData.stats || {},
              createdAt: userData.created_at,
              badges: [],
              following: [],
              followers: []
            };
            set({ user });
            return true;
          }
          return false;
        } catch (error: any) {
          if (error.response?.status === 401) {
            // Token is invalid/expired
            return false;
          }
          // Network or other errors - assume token is still valid
          return true;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // Enhanced storage with cross-tab synchronization
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          console.log('AuthStore: Persisting auth state:', name, value.token ? 'with token' : 'without token');
          
          // Update last activity timestamp
          localStorage.setItem('reviewsite_last_activity', Date.now().toString());
          
          // Store Zustand state
          localStorage.setItem(name, JSON.stringify(value));
          
          // Sync with individual storage keys for compatibility
          if (value.token) {
            localStorage.setItem('reviewinn_jwt_token', value.token);
          } else {
            localStorage.removeItem('reviewinn_jwt_token');
          }
          
          if (value.user) {
            localStorage.setItem('reviewinn_user_data', JSON.stringify(value.user));
          } else {
            localStorage.removeItem('reviewinn_user_data');
          }
          
          // Update httpClient tokens when state changes
          import('../api/httpClient').then(({ httpClient }) => {
            if (value.token) {
              const refreshToken = localStorage.getItem('reviewinn_refresh_token');
              httpClient.setAuthTokens(value.token, refreshToken || undefined);
            } else {
              httpClient.clearAuthTokens();
            }
          });
          
          // Emit storage event for cross-tab synchronization
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'reviewinn-auth-change',
            newValue: JSON.stringify({
              isAuthenticated: value.isAuthenticated,
              user: value.user,
              token: value.token,
              timestamp: Date.now()
            })
          }));
        },
        removeItem: (name) => {
          console.log('AuthStore: Storage removeItem called for:', name);
          
          // Remove the main item
          localStorage.removeItem(name);
          
          // Clear all related auth items comprehensively
          const allAuthKeys = [
            'reviewsite_last_activity',
            'reviewinn_jwt_token',
            'reviewinn_refresh_token',
            'reviewinn_user_data',
            'reviewinn_remember_me',
            'refresh_token',
            'user_data',
            'auth-storage'
          ];
          
          allAuthKeys.forEach(key => {
            if (key !== name) { // Don't double-remove the main item
              localStorage.removeItem(key);
            }
          });
          
          console.log('AuthStore: All auth-related localStorage items cleared');
          
          // Emit storage event for cross-tab logout
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'reviewinn-auth-change',
            newValue: JSON.stringify({
              isAuthenticated: false,
              user: null,
              token: null,
              timestamp: Date.now()
            })
          }));
        },
      },
    }
  )
);

// Selector hooks for better performance
export const useUser = () => useAuthStore(state => state.user);
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useAuthToken = () => useAuthStore(state => state.token);
export const useAuthLoading = () => useAuthStore(state => state.isLoading);
export const useAuthError = () => useAuthStore(state => state.error);

// Note: useAuth hook now uses getState() directly to avoid re-render issues

// Helper function to check user permissions
export const useHasPermission = (permission: string) => {
  return useAuthStore(state => {
    if (!state.user) return false;
    
    // Check user level for basic permissions
    switch (permission) {
      case 'create_review':
        return state.user.level >= 1;
      case 'edit_entity':
        return state.user.level >= 5 || state.user.isVerified;
      case 'moderate_content':
        return state.user.level >= 10;
      case 'admin_access':
        return state.user.level >= 50;
      default:
        return false;
    }
  });
};

// Helper function to get user stats
export const useUserStats = () => {
  return useAuthStore(state => state.user?.stats || {});
};

// Cross-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'reviewinn-auth-change' && e.newValue) {
      try {
        const authData = JSON.parse(e.newValue);
        const currentState = useAuthStore.getState();
        
        // Only sync if this is a different tab (check timestamp)
        const timeDiff = Math.abs(Date.now() - authData.timestamp);
        if (timeDiff < 1000) { // Within 1 second means it's from this tab
          return;
        }
        
        console.log('AuthStore: Syncing auth state from another tab', authData);
        
        // Sync the auth state
        useAuthStore.setState({
          isAuthenticated: authData.isAuthenticated,
          user: authData.user,
          token: authData.token,
          isLoading: false,
          error: null
        });
        
        // Sync httpClient tokens
        import('../api/httpClient').then(({ httpClient }) => {
          if (authData.token) {
            httpClient.setAuthTokens(authData.token);
          } else {
            httpClient.clearAuthTokens();
          }
        });
        
        // Emit auth state change event
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
          detail: { 
            isAuthenticated: authData.isAuthenticated, 
            user: authData.user 
          } 
        }));
        
      } catch (error) {
        console.error('AuthStore: Failed to sync auth state from another tab:', error);
      }
    }
  });
}

export default useAuthStore;