// Authentication service for user management - Enhanced with modern security
import type { User } from '../types';
import type { AuthState } from '../services/authInterface';
import { API_CONFIG, API_ENDPOINTS } from './config';
import { httpClient } from './httpClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
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
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(AuthService.REFRESH_TOKEN_KEY);
  }

  setToken(token: string) {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
  }

  setRefreshToken(token: string) {
    localStorage.setItem(AuthService.REFRESH_TOKEN_KEY, token);
  }

  removeToken() {
    localStorage.removeItem(AuthService.TOKEN_KEY);
  }

  removeRefreshToken() {
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
      const response = await httpClient.post<TokenResponse>(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`, credentials);
      if (!response.data || !response.data.access_token) throw new Error('Invalid login response');
      
      // Store tokens
      this.setToken(response.data.access_token);
      this.setRefreshToken(response.data.refresh_token);
      
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
      
      // Update Zustand store with the user data - ensure sync
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
    } catch (error: any) {
      let errorMessage = 'Login failed. Please try again.';
      
      // Handle specific error types
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 401) {
        errorMessage = 'Incorrect email or password. Please check your credentials and try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a moment before trying again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
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
      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

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
      
      // Store the access token and refresh token
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
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle specific registration errors
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 400) {
        // Usually means user already exists or validation failed
        if (error.response.data?.detail?.includes('email')) {
          errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
        } else {
          errorMessage = 'Invalid registration information. Please check your details and try again.';
        }
      } else if (error.response?.status === 422) {
        errorMessage = 'Please check all fields and ensure they meet the requirements.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many registration attempts. Please wait a moment before trying again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error during registration. Please try again later.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
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
      if (token) {
        console.log('AuthService: Calling logout API endpoint...');
        await httpClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`);
        console.log('AuthService: Logout API call successful');
      }
    } catch (error: any) {
      // Handle 401 errors gracefully (token already invalid)
      if (error.response?.status === 401) {
        console.log('AuthService: Token already invalid, proceeding with local cleanup');
      } else {
        console.warn('AuthService: Logout API call failed:', error);
      }
    }
    
    // Clear httpClient tokens first
    httpClient.clearAuthTokens();
    console.log('AuthService: Cleared httpClient tokens');
    
    // Clear all auth data comprehensively
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
    
    // Clear additional localStorage items that might persist auth data
    const itemsToClear = [
      'reviewsite_last_activity',
      'reviewinn_jwt_token',
      'reviewinn_refresh_token', 
      'reviewinn_user_data',
      'reviewinn_remember_me',
      'auth_token',
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
    } catch (error: any) {
      // Handle 401 Unauthorized errors gracefully
      if (error.response?.status === 401) {
        console.log('Auth token expired or invalid, clearing auth state');
        this.logout();
        return null;
      }
      console.error('Failed to fetch current user data:', error);
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
    
    if (token && user) {
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
            this.updateAuthState({ 
              user: freshUser, 
              isAuthenticated: true,
              isLoading: false,
              error: null 
            });
          } else {
            this.logout();
          }
        } catch (error) {
          this.logout();
        }
      } else {
        this.currentUser = user;
        this.isAuthenticated = true;
        this.updateAuthState({ 
          user: user, 
          isAuthenticated: true,
          isLoading: false,
          error: null 
        });
      }
    } else if (token) {
      // Token exists but no user data - fetch from backend
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
          this.updateAuthState({ 
            user: freshUser, 
            isAuthenticated: true,
            isLoading: false,
            error: null 
          });
        } else {
          this.logout();
        }
      } catch (error) {
        this.logout();
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
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    await httpClient.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.VERIFY}`, { token });
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
   * Clean up timers when service is destroyed
   */
  destroy(): void {
    if (this.refreshTokenTimer) {
      clearInterval(this.refreshTokenTimer);
    }
  }
}

export const authService = new AuthService();
