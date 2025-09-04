// Authentication service for user management - Enhanced with modern security
import type { User } from '../types';
import type { AuthState } from '../services/authInterface';
import { API_CONFIG, API_ENDPOINTS } from './config';
import { httpClient } from './httpClient';
import { setSecureTokens, getSecureAccessToken, getSecureRefreshToken, clearSecureTokens } from '../utils/cookieAuth';
import type { ApiError, RegistrationApiResponse, VerificationApiResponse, ResendVerificationApiResponse } from '../types';

// Helper function to handle unknown errors
function handleError(error: unknown): ApiError & { status?: number; response?: any } {
  if (error instanceof Error) {
    return { message: error.message };
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error) {
      return { 
        message: String(error.message),
        status: 'status' in error ? Number(error.status) : undefined,
        response: 'response' in error ? error.response : undefined
      };
    }
    if ('response' in error) {
      return { 
        message: 'Request failed',
        response: error.response
      };
    }
  }
  return { message: 'An unknown error occurred' };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user?: {
    user_id: number;
    email: string;
    full_name: string;
    username: string;
    is_verified: boolean;
    is_active: boolean;
    role: string;
    created_at: string;
  };
}

class AuthService {
  private currentUser: User | null = null;
  private isAuthenticated = false;
  private isLoading = false;
  private error: string | null = null;
  private subscribers: ((state: AuthState) => void)[] = [];
  private refreshTokenTimer?: number;
  private lastActivityTime: number = Date.now();
  private readonly ACTIVITY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_INACTIVITY_DAYS = 30;

  constructor() {
    // Set loading state during initialization
    this.isLoading = false;
    
    // Don't auto-initialize here to avoid conflicts with Zustand
    // Let Zustand handle initialization
    
    // Start activity monitoring and auto-refresh
    this.startActivityMonitoring();
    this.setupAutoRefresh();
  }

  private static TOKEN_KEY = 'reviewinn_jwt_token';
  private static REFRESH_TOKEN_KEY = 'reviewinn_refresh_token';
  private static USER_KEY = 'reviewinn_user_data';

  private updateAuthState(updates: Partial<AuthState>) {
    if (updates.user !== undefined) this.currentUser = updates.user;
    if (updates.isAuthenticated !== undefined) this.isAuthenticated = updates.isAuthenticated;
    if (updates.isLoading !== undefined) this.isLoading = updates.isLoading;
    if (updates.error !== undefined) this.error = updates.error;
    
    this.notifySubscribers();
  }

  private notifySubscribers() {
    const state = this.getAuthState();
    this.subscribers.forEach(callback => callback(state));
  }

  subscribe(callback: (state: AuthState) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  getToken(): string | null {
    // Use secure cookie storage first, fallback to localStorage for backward compatibility
    const secureToken = getSecureAccessToken();
    if (secureToken) return secureToken;
    
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    // Use secure cookie storage first, fallback to localStorage for backward compatibility
    const secureToken = getSecureRefreshToken();
    if (secureToken) return secureToken;
    
    return localStorage.getItem(AuthService.REFRESH_TOKEN_KEY);
  }

  setToken(token: string) {
    // Store in secure cookies AND localStorage (for backward compatibility during transition)
    setSecureTokens(token, this.getRefreshToken() || undefined);
    localStorage.setItem(AuthService.TOKEN_KEY, token);
  }

  setRefreshToken(token: string) {
    // Store in secure cookies AND localStorage (for backward compatibility during transition)
    setSecureTokens(this.getToken() || '', token);
    localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, token);
  }

  removeToken() {
    clearSecureTokens();
    localStorage.removeItem(AuthService.TOKEN_KEY);
  }

  removeRefreshToken() {
    clearSecureTokens();
    localStorage.removeItem(AuthService.REFRESH_TOKEN_KEY);
  }

  setUser(user: User) {
    localStorage.setItem(AuthService.USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    try {
      const userData = localStorage.getItem(AuthService.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  removeUser() {
    localStorage.removeItem(AuthService.USER_KEY);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.updateAuthState({ isLoading: true, error: null });
    try {
      const url = `/api/v1/auth-production/login`;
      const fetchResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      if (!fetchResponse.ok) {
        const errorData = await fetchResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `Login failed: ${fetchResponse.statusText}`);
      }

      const response = { data: await fetchResponse.json() };
      if (!response.data || !response.data.access_token) throw new Error('Invalid login response');
      
      // Store tokens securely in cookies first, then localStorage for compatibility
      setSecureTokens(response.data.access_token, response.data.refresh_token || '');
      this.setToken(response.data.access_token);
      this.setRefreshToken(response.data.refresh_token || '');
      
      // Update httpClient with the new token
      httpClient.setAuthTokens(response.data.access_token, response.data.refresh_token);
      console.log('AuthService: Set tokens in httpClient after login');
      
      // Map backend user to frontend user format
      let user: User;
      if (response.data.user) {
        // Use user data from login response
        user = {
          id: response.data.user.user_id.toString(),
          name: response.data.user.full_name || response.data.user.username,
          email: response.data.user.email,
          avatar: 'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg', // Default avatar
          level: 1,
          points: 0,
          badges: [
            { id: 'first_review', name: 'First Review', description: 'Posted your first review', icon: 'star' },
            { id: 'week_warrior', name: 'Week Warrior', description: 'Active for a week', icon: 'flame' }
          ],
          createdAt: response.data.user.created_at,
          username: response.data.user.username,
          preferences: {
            notifications: { email: true, reviewReplies: true },
            privacy: { profileVisible: true, showContexts: true }
          },
          stats: {
            totalReviews: 0,
            averageRatingGiven: 0,
            entitiesReviewed: 0,
            streakDays: 0
          },
          following: [],
          followers: []
        };
      } else {
        // Fallback: Get user info from /users/me endpoint
        const userResponse = await httpClient.get<{ user_id: number; username: string; name: string; full_name: string; email: string; is_verified: boolean; created_at: string }>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.ME}`);
        
        if (!userResponse.data) throw new Error('Failed to get user info');
        
        user = {
          id: userResponse.data.user_id.toString(),
          name: userResponse.data.full_name || userResponse.data.name || userResponse.data.username,
          email: userResponse.data.email,
          avatar: 'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg',
          level: 1,
          points: 0,
          badges: [
            { id: 'first_review', name: 'First Review', description: 'Posted your first review', icon: 'star' },
            { id: 'week_warrior', name: 'Week Warrior', description: 'Active for a week', icon: 'flame' }
          ],
          createdAt: userResponse.data.created_at,
          username: userResponse.data.username,
          preferences: {
            notifications: { email: true, reviewReplies: true },
            privacy: { profileVisible: true, showContexts: true }
          },
          stats: {
            totalReviews: 0,
            averageRatingGiven: 0,
            entitiesReviewed: 0,
            streakDays: 0
          },
          following: [],
          followers: []
        };
      }
      
      this.currentUser = user;
      this.isAuthenticated = true;
      this.setUser(user); // Store user data in localStorage
      
      // Import and update Zustand store with the user data dynamically to avoid circular imports
      const { useAuthStore } = await import('../stores/authStore');
      const authStore = useAuthStore.getState();
      authStore.login(user, response.data.access_token);
      console.log('AuthService: Updated Zustand store after login');
      
      // Setup token refresh
      this.setupTokenRefresh(response.data.expires_in);
      
      this.updateAuthState({
        user: user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      // Force a notification to all subscribers
      console.log('AuthService: Login successful, notifying all subscribers');
      this.notifySubscribers();
      
      return { user, token: response.data.access_token };
    } catch (error: unknown) {
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific error types
      const err = handleError(error);
      if (err.message?.includes('detail')) {
        errorMessage = err.message.replace('Login failed: ', '');
      } else if (err.message?.includes('401')) {
        errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
      } else if (err.message?.includes('429')) {
        errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
      } else if (err.message?.includes('5')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = err.message;
      }

      this.updateAuthState({
        isLoading: false,
        error: errorMessage
      });
      throw error; // Pass the original error object for detailed handling
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    this.updateAuthState({ isLoading: true, error: null });

    try {

      // Call the real backend registration endpoint
      const response = await httpClient.post<{ user_id: number; username: string; full_name: string; email: string; is_verified: boolean; created_at: string }>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password
      });
      
      if (!response.data) throw new Error('Registration failed');
      
      // After successful registration, automatically log in to get JWT token
      const loginResponse = await httpClient.post<TokenResponse>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, {
        email: data.email,
        password: data.password
      });
      
      if (!loginResponse.data || !loginResponse.data.access_token) throw new Error('Auto-login failed after registration');
      
      // Store the access token and refresh token securely
      setSecureTokens(loginResponse.data.access_token, loginResponse.data.refresh_token);
      this.setToken(loginResponse.data.access_token);
      this.setRefreshToken(loginResponse.data.refresh_token);
      
      // Update httpClient with the new token
      httpClient.setAuthTokens(loginResponse.data.access_token, loginResponse.data.refresh_token);
      console.log('AuthService: Set tokens in httpClient after registration');
      
      // Map backend user to frontend user format from login response
      const user: User = {
        id: loginResponse.data.user?.user_id.toString() || response.data.user_id.toString(),
        name: loginResponse.data.user?.full_name || response.data.full_name || response.data.username,
        email: loginResponse.data.user?.email || response.data.email,
        avatar: 'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg',
        level: 1,
        points: 0,
        badges: [
          { id: 'first_review', name: 'First Review', description: 'Posted your first review', icon: 'star' },
          { id: 'week_warrior', name: 'Week Warrior', description: 'Active for a week', icon: 'flame' }
        ],
        createdAt: loginResponse.data.user?.created_at || response.data.created_at,
        username: loginResponse.data.user?.username || response.data.username,
        preferences: {
          notifications: { email: true, reviewReplies: true },
          privacy: { profileVisible: true, showContexts: true }
        },
        stats: {
          totalReviews: 0,
          averageRatingGiven: 0,
          entitiesReviewed: 0,
          streakDays: 0
        },
        following: [],
        followers: []
      };

      this.currentUser = user;
      this.isAuthenticated = true;
      this.setUser(user); // Store user data in localStorage
      
      // Update Zustand store with the user data - ensure sync
      console.log('AuthService: Updated Zustand store after registration');
      
      // Setup token refresh
      this.setupTokenRefresh(loginResponse.data.expires_in);

      this.updateAuthState({
        user: user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Force a notification to all subscribers
      console.log('AuthService: Registration successful, notifying all subscribers');
      this.notifySubscribers();

      return {
        user: user,
        token: loginResponse.data.access_token
      };
    } catch (error: unknown) {
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific registration errors
      const err = handleError(error);
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.response?.status === 400) {
        // Usually means user already exists or validation failed
        if (err.response.data?.detail?.includes('email')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
        } else {
          errorMessage = 'Invalid registration information. Please check your details and try again.';
        }
      } else if (err.response?.status === 422) {
        errorMessage = 'Please check all fields and ensure they meet the requirements.';
      } else if (err.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please wait a moment before trying again.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error during registration. Please try again later.';
      } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = err.message;
      }

      this.updateAuthState({
        isLoading: false,
        error: errorMessage
      });
      throw error; // Pass the original error object for detailed handling
    }
  }

  async logout(): Promise<void> {
    console.log('AuthService: Starting logout process...');
    
    try {
      // Call logout endpoint to blacklist token only if we have a valid token
      const token = this.getToken();
      if (token && token !== 'null' && token !== 'undefined') {
        console.log('AuthService: Calling logout API endpoint...');
        await httpClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`);
        console.log('AuthService: Logout API call successful');
      }
    } catch (error: unknown) {
      // Handle 401 errors gracefully (token already invalid)
      const err = handleError(error);
      if (err.status === 401 || err.message?.includes('401')) {
        console.log('AuthService: Token already invalid, proceeding with local cleanup');
      } else {
        console.warn('AuthService: Logout API call failed:', err.message);
      }
    }
    
    // Clear httpClient tokens first
    httpClient.clearAuthTokens();
    console.log('AuthService: Cleared httpClient tokens');
    
    // Clear all auth data comprehensively (secure cookies and localStorage)
    clearSecureTokens();
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
    
    // Update Zustand store as well
    try {
      const { useAuthStore } = await import('../stores/authStore');
      const authStore = useAuthStore.getState();
      authStore.logout();
      console.log('AuthService: Cleared Zustand store');
    } catch (storeError) {
      console.warn('AuthService: Failed to clear Zustand store:', storeError);
    }
    
    // Clear additional localStorage items that might persist auth data
    const itemsToClear = [
      'reviewsite_last_activity',
      'reviewinn_jwt_token',
      'reviewinn_refresh_token', 
      'reviewinn_user_data',
      'reviewinn_remember_me',
      'refresh_token',
      'user_data',
      'auth-storage' // Zustand persist key
    ];
    
    itemsToClear.forEach(item => {
      localStorage.removeItem(item);
    });
    console.log('AuthService: Cleared all localStorage items');
    
    this.clearTokenRefresh();
    this.currentUser = null;
    this.isAuthenticated = false;
    
    this.updateAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    
    console.log('AuthService: Logout process completed');
  }

  private setupTokenRefresh(expiresIn: number): void {
    // Clear existing timer
    this.clearTokenRefresh();
    
    // Set up refresh 2 minutes before expiration
    const refreshTime = (expiresIn - 120) * 1000;
    if (refreshTime > 0) {
      this.refreshTokenTimer = window.setTimeout(() => {
        this.refreshAccessToken();
      }, refreshTime);
    }
  }

  private clearTokenRefresh(): void {
    if (this.refreshTokenTimer) {
      clearTimeout(this.refreshTokenTimer);
      this.refreshTokenTimer = undefined;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await httpClient.post<TokenResponse>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
        refresh_token: refreshToken
      });

      if (response.data?.access_token) {
        // Store tokens securely
        setSecureTokens(response.data.access_token, response.data.refresh_token);
        this.setToken(response.data.access_token);
        
        // Update refresh token if provided
        if (response.data.refresh_token) {
          this.setRefreshToken(response.data.refresh_token);
        }
        
        // Update activity time on successful refresh
        this.lastActivityTime = Date.now();
        localStorage.setItem('reviewsite_last_activity', this.lastActivityTime.toString());
        
        // Setup token refresh if expires_in is provided
        if (response.data.expires_in) {
          this.setupTokenRefresh(response.data.expires_in);
        }
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Optionally, fetch from backend using the token
    return this.currentUser;
  }

  // Method to fetch current user data from backend
  private async fetchCurrentUserData(): Promise<User | null> {
    // Check if we have a token before making the request
    const token = this.getToken();
    if (!token) {
      console.log('No auth token found, skipping user data fetch');
      return null;
    }

    try {
      const response = await httpClient.get<{ user_id: number; email: string; full_name: string; username: string; is_verified: boolean; is_active: boolean; role: string; created_at: string }>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.ME}`);
      
      if (response.data) {
        // Map backend response to frontend User format
        const user: User = {
          id: response.data.user_id.toString(),
          name: response.data.full_name || response.data.username,
          email: response.data.email,
          avatar: 'https://images.pexels.com/photos/1138903/pexels-photo-1138903.jpeg',
          level: 1,
          points: 0,
          badges: [
            { id: 'first_review', name: 'First Review', description: 'Posted your first review', icon: 'star' },
            { id: 'week_warrior', name: 'Week Warrior', description: 'Active for a week', icon: 'flame' }
          ],
          createdAt: response.data.created_at,
          username: response.data.username,
          preferences: {
            notifications: { email: true, reviewReplies: true },
            privacy: { profileVisible: true, showContexts: true }
          },
          stats: {
            totalReviews: 0,
            averageRatingGiven: 0,
            entitiesReviewed: 0,
            streakDays: 0
          },
          following: [],
          followers: []
        };
        return user;
      }
      return null;
    } catch (error: unknown) {
      // Handle 401 Unauthorized errors gracefully
      const err = handleError(error);
      if (err.response?.status === 401) {
        console.log('Auth token expired or invalid, clearing auth state');
        this.logout();
        return null;
      }
      console.error('Failed to fetch current user data:', err.message);
      return null;
    }
  }

  isUserAuthenticated(): boolean {
    return this.isAuthenticated || !!this.getToken();
  }

  getAuthState(): AuthState {
    return {
      user: this.currentUser,
      token: this.getToken(),
      isAuthenticated: this.isAuthenticated,
      isLoading: this.isLoading,
      error: this.error,
      isInitialized: !this.isLoading || this.isAuthenticated || !!this.currentUser
    };
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    const updatedUser = { ...this.currentUser, ...updates };
    this.currentUser = updatedUser;
    this.updateAuthState({ user: updatedUser });
    
    return updatedUser;
  }

  // Public method to restore auth state from token and user data
  async restoreAuthFromToken() {
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && token !== 'null' && token !== 'undefined' && user) {
      // Sync with httpClient
      const refreshToken = this.getRefreshToken();
      httpClient.setAuthTokens(token, refreshToken || undefined);
      
      // Check if user data has a proper name (not just username)
      if (!user.name || user.name === user.username) {
        // Set loading state while fetching fresh data
        this.updateAuthState({ 
          isLoading: true,
          isAuthenticated: false,
          user: null,
          error: null 
        });
        
        try {
          const freshUser = await this.fetchCurrentUserData();
          if (freshUser) {
            this.currentUser = freshUser;
            this.isAuthenticated = true;
            this.setUser(freshUser); // Update localStorage
            
            // Sync with Zustand store
            const { useAuthStore } = await import('../stores/authStore');
            const authStore = useAuthStore.getState();
            authStore.login(freshUser, token);
            
            this.updateAuthState({ 
              user: freshUser, 
              isAuthenticated: true,
              isLoading: false,
              error: null 
            });
          } else {
            await this.logout();
          }
        } catch (error) {
          await this.logout();
        }
      } else {
        this.currentUser = user;
        this.isAuthenticated = true;
        
        // Sync with Zustand store
        try {
          const { useAuthStore } = await import('../stores/authStore');
          const authStore = useAuthStore.getState();
          authStore.login(user, token);
        } catch (storeError) {
          console.warn('AuthService: Failed to sync with Zustand store:', storeError);
        }
        
        this.updateAuthState({ 
          user: user, 
          isAuthenticated: true,
          isLoading: false,
          error: null 
        });
      }
    } else if (token && token !== 'null' && token !== 'undefined') {
      // Token exists but no user data - fetch from backend
      httpClient.setAuthTokens(token, this.getRefreshToken() || undefined);
      
      this.updateAuthState({ 
        isLoading: true,
        isAuthenticated: false,
        user: null,
        error: null 
      });
      
      try {
        const freshUser = await this.fetchCurrentUserData();
        if (freshUser) {
          this.currentUser = freshUser;
          this.isAuthenticated = true;
          this.setUser(freshUser);
          
          // Sync with Zustand store
          const { useAuthStore } = await import('../stores/authStore');
          const authStore = useAuthStore.getState();
          authStore.login(freshUser, token);
          
          this.updateAuthState({ 
            user: freshUser, 
            isAuthenticated: true,
            isLoading: false,
            error: null 
          });
        } else {
          await this.logout();
        }
      } catch (error) {
        await this.logout();
      }
    } else {
      this.updateAuthState({ 
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: null 
      });
    }
  }

  // Public method to set user and authentication state
  setUserAndAuth(user: User) {
    this.currentUser = user;
    this.isAuthenticated = true;
    this.setUser(user); // Store user data in localStorage
    this.updateAuthState({ user, isAuthenticated: true });
  }

  // Method to refresh user interactions after login
  async refreshUserInteractions(): Promise<void> {
    if (!this.currentUser) return;
    
    try {
      // This could trigger a global event or callback to refresh review data
      // For now, we'll just notify subscribers that auth state changed
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to refresh user interactions:', error);
    }
  }

  // Enhanced login method that refreshes interactions
  async loginWithInteractionRefresh(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.login(credentials);
    await this.refreshUserInteractions();
    return response;
  }

  // Password Management Functions

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await httpClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.FORGOT_PASSWORD}`, { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await httpClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
      token,
      new_password: newPassword
    });
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await httpClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
      current_password: currentPassword,
      new_password: newPassword
    });
  }

  /**
   * Start monitoring user activity for persistent login
   */
  private startActivityMonitoring(): void {
    // Track user activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      this.lastActivityTime = Date.now();
      localStorage.setItem('reviewsite_last_activity', this.lastActivityTime.toString());
    };

    // Add event listeners for activity tracking
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity periodically
    setInterval(() => {
      this.checkInactivity();
    }, this.ACTIVITY_CHECK_INTERVAL);
  }

  /**
   * Check if user has been inactive for too long
   */
  private checkInactivity(): void {
    if (!this.isAuthenticated) return;

    const storedActivity = localStorage.getItem('reviewsite_last_activity');
    const lastActivity = storedActivity ? parseInt(storedActivity) : this.lastActivityTime;
    const now = Date.now();
    const inactiveTime = now - lastActivity;
    const maxInactiveTime = this.MAX_INACTIVITY_DAYS * 24 * 60 * 60 * 1000; // 30 days in milliseconds

    if (inactiveTime > maxInactiveTime) {
      console.log('User inactive for too long, logging out');
      this.logout();
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupAutoRefresh(): void {
    // Refresh token 5 minutes before expiration (55 minutes for 60-minute tokens)
    const refreshInterval = 55 * 60 * 1000; // 55 minutes

    this.refreshTokenTimer = window.setInterval(async () => {
      if (this.isAuthenticated && this.getRefreshToken()) {
        try {
          await this.refreshAccessToken();
          console.log('Token refreshed automatically');
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // If refresh fails, user needs to log in again
          this.logout();
        }
      }
    }, refreshInterval);
  }


  /**
   * Register user without auto-login (for verification flow)
   */
  async registerWithoutLogin(data: RegisterData): Promise<{ user_id: string; email: string; message: string; requires_verification: boolean }> {
    this.updateAuthState({ isLoading: true, error: null });

    try {
      const response = await httpClient.post<RegistrationApiResponse>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password
      });

      this.updateAuthState({ isLoading: false, error: null });

      const responseData = response.data as RegistrationApiResponse;
      return {
        user_id: responseData.user_id,
        email: data.email,
        message: responseData.message || 'Registration successful',
        requires_verification: responseData.requires_verification !== false // Default to true
      };
    } catch (error: unknown) {
      console.error('Registration failed:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific error types
      const err = handleError(error);
      if (err.message?.includes('422')) {
        errorMessage = 'Please check all required fields and try again.';
      } else if (err.message?.includes('409')) {
        errorMessage = 'Email already exists. Please use a different email or sign in.';
      } else if (err.message?.includes('400')) {
        errorMessage = 'Invalid registration data. Please check your information.';
      } else {
        errorMessage = err.message;
      }

      this.updateAuthState({
        isLoading: false,
        error: errorMessage
      });
      throw error;
    }
  }

  /**
   * Verify email with 6-digit code
   */
  async verifyEmail(email: string, verificationCode: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await httpClient.post<VerificationApiResponse>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.VERIFY_EMAIL}`, {
        email,
        verification_code: verificationCode
      });

      const responseData = response.data as VerificationApiResponse;
      return {
        success: true,
        message: responseData.message || 'Email verified successfully'
      };
    } catch (error: unknown) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<{ success: boolean; message?: string; resend_available_in?: number }> {
    try {
      const response = await httpClient.post<ResendVerificationApiResponse>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.RESEND_VERIFICATION}`, {
        email
      });

      const responseData = response.data as ResendVerificationApiResponse;
      return {
        success: true,
        message: responseData.message || 'Verification code sent',
        resend_available_in: responseData.resend_available_in
      };
    } catch (error: unknown) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  }

  /**
   * Clean up timers when service is destroyed
   */
  destroy(): void {
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
    }
  }
}

export const authService = new AuthService();
