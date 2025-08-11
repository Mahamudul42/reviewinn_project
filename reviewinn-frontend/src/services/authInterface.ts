/**
 * Unified Auth Interface
 * 
 * This interface provides a consistent API for authentication operations
 * and makes it easy to switch between different auth systems in the future.
 */

import type { User } from '../types';

// ============================================================================
// Auth Interface Types
// ============================================================================

export interface AuthCredentials {
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

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// Unified Auth Interface
// ============================================================================

export interface IAuthService {
  // State Management
  getAuthState(): AuthState;
  isAuthenticated(): boolean;
  getCurrentUser(): User | null;
  getToken(): string | null;
  isInitialized(): boolean;

  // Authentication Operations
  initialize(): Promise<void>;
  login(credentials: AuthCredentials): Promise<AuthResponse<{ user: User; token: string }>>;
  register(data: RegisterData): Promise<AuthResponse<{ user: User; token: string }>>;
  logout(): Promise<AuthResponse<void>>;
  refreshToken(): Promise<AuthResponse<{ token: string }>>;

  // Utilities
  checkAuth(): boolean;
  requireAuth(callback?: () => void): boolean;
  clearError(): void;

  // Event System
  subscribe(callback: (state: AuthState) => void): () => void;
  onAuthStateChange(callback: (state: AuthState) => void): () => void;
}

// ============================================================================
// Auth Manager - Facade Pattern
// ============================================================================

export class AuthManager implements IAuthService {
  private authService: IAuthService;
  private listeners: ((state: AuthState) => void)[] = [];

  constructor(authService: IAuthService) {
    this.authService = authService;
    
    // Subscribe to the underlying auth service changes
    this.authService.subscribe((state) => {
      this.notifyListeners(state);
    });
  }

  // Switch to a different auth service (e.g., from custom to OAuth)
  switchAuthService(newAuthService: IAuthService): void {
    console.log('AuthManager: Switching auth service');
    this.authService = newAuthService;
    
    // Re-subscribe to new service
    this.authService.subscribe((state) => {
      this.notifyListeners(state);
    });
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

  // Delegate all methods to the current auth service
  getAuthState(): AuthState {
    return this.authService.getAuthState();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  getToken(): string | null {
    return this.authService.getToken();
  }

  isInitialized(): boolean {
    return this.authService.isInitialized();
  }

  async initialize(): Promise<void> {
    return this.authService.initialize();
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse<{ user: User; token: string }>> {
    return this.authService.login(credentials);
  }

  async register(data: RegisterData): Promise<AuthResponse<{ user: User; token: string }>> {
    return this.authService.register(data);
  }

  async logout(): Promise<AuthResponse<void>> {
    return this.authService.logout();
  }

  async refreshToken(): Promise<AuthResponse<{ token: string }>> {
    return this.authService.refreshToken();
  }

  checkAuth(): boolean {
    return this.authService.checkAuth();
  }

  requireAuth(callback?: () => void): boolean {
    return this.authService.requireAuth(callback);
  }

  clearError(): void {
    return this.authService.clearError();
  }

  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.push(callback);
    
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

  // Additional utility methods
  async withAuth<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }
    return operation();
  }

  async ensureAuthenticated(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('User must be authenticated');
    }
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; details: Record<string, any> }> {
    const state = this.getAuthState();
    return {
      healthy: state.isInitialized && !state.error,
      details: {
        initialized: state.isInitialized,
        authenticated: state.isAuthenticated,
        hasUser: !!state.user,
        hasToken: !!state.token,
        error: state.error
      }
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let authManagerInstance: AuthManager | null = null;

export const getAuthManager = (): AuthManager => {
  if (!authManagerInstance) {
    throw new Error('Auth manager not initialized. Call initializeAuthManager first.');
  }
  return authManagerInstance;
};

export const initializeAuthManager = (authService: IAuthService): AuthManager => {
  if (authManagerInstance) {
    console.warn('Auth manager already initialized');
    return authManagerInstance;
  }
  
  authManagerInstance = new AuthManager(authService);
  console.log('Auth manager initialized successfully');
  return authManagerInstance;
};

export const resetAuthManager = (): void => {
  authManagerInstance = null;
  console.log('Auth manager reset');
};