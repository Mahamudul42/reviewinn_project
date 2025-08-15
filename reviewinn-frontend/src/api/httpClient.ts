import { API_CONFIG, DEFAULT_HEADERS, HTTP_STATUS, API_ERROR_TYPES, type ApiResponse } from './config';
import { authEvents, emitAuthEvent } from '../utils/authEvents';
import { useAuthStore } from '../stores/authStore';

// Simple in-memory cache implementation
class ApiCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  set(key: string, data: unknown, ttl: number = API_CONFIG.CACHE.TTL): void {
    if (this.cache.size >= API_CONFIG.CACHE.MAX_SIZE) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

// Rate limiter implementation
class RateLimiter {
  private requests: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number = API_CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.limit) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.limit - this.requests.length);
  }
}

// Custom error class for API errors
export class ApiClientError extends Error {
  public type: keyof typeof API_ERROR_TYPES;
  public status?: number;
  public code?: string;
  public details?: unknown;

  constructor(type: keyof typeof API_ERROR_TYPES, message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.type = type;
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// HTTP Client class
export class HttpClient {
  private cache = new ApiCache();
  private rateLimiter = new RateLimiter();
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    // Listen to auth events to keep tokens in sync
    authEvents.on('login', ({ token }) => {
      this.authToken = token;
    });
    
    authEvents.on('logout', () => {
      this.clearAuthTokens();
    });
    
    authEvents.on('token_refresh', ({ token }) => {
      this.authToken = token;
    });
  }

  // Set authentication tokens
  setAuthTokens(accessToken: string, refreshToken?: string): void {
    this.authToken = accessToken;
    this.refreshToken = refreshToken || null;
  }

  // Clear authentication tokens
  clearAuthTokens(): void {
    this.authToken = null;
    this.refreshToken = null;
  }

  // Get headers with authentication
  private getHeaders(customHeaders?: Record<string, string>, url?: string): HeadersInit {
    const headers: HeadersInit = {
      ...DEFAULT_HEADERS,
      ...customHeaders
    };

    // Get the latest token from multiple sources in order of preference
    let token = this.authToken; // First try instance token
    
    if (!token) {
      // Try the auth store directly for consistency
      const authState = useAuthStore.getState();
      token = authState.token;
    }
    
    if (!token) {
      // Fallback to localStorage
      token = localStorage.getItem('reviewinn_jwt_token');
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      // Debug: Log token info when sending requests to protected endpoints
      if (url && (url.includes('/users/me') || url.includes('/circles/') || url.includes('/messaging/') || url.includes('/enterprise-notifications/'))) {
        console.log('🔐 HttpClient: Sending protected request with token:', {
          url: url,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...',
          hasToken: !!token,
          authHeader: headers['Authorization']?.substring(0, 30) + '...'
        });
      }
    } else {
      // Debug: Log when no token is available
      if (url && (url.includes('/users/me') || url.includes('/circles/') || url.includes('/messaging/') || url.includes('/enterprise-notifications/'))) {
        console.log('⚠️ HttpClient: Sending protected request WITHOUT token:', {
          url: url,
          instanceToken: !!this.authToken,
          storeToken: !!useAuthStore.getState().token,
          localStorageToken: !!localStorage.getItem('reviewinn_jwt_token')
        });
      }
    }
    
    return headers;
  }

  // Handle token refresh
  private async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('reviewinn_refresh_token');
      if (!refreshToken) {
        throw new ApiClientError(API_ERROR_TYPES.AUTHENTICATION_ERROR, 'No refresh token available');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: this.getHeaders({}, `${API_CONFIG.BASE_URL}/auth/refresh`),
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.access_token;
        
        if (newToken) {
          // Update localStorage
          localStorage.setItem('reviewinn_jwt_token', newToken);
          if (data.refresh_token) {
            localStorage.setItem('reviewinn_refresh_token', data.refresh_token);
          }
          
          // Update httpClient tokens
          this.authToken = newToken;
          this.refreshToken = data.refresh_token || refreshToken;
          
          // Notify subscribers
          this.refreshSubscribers.forEach(resolve => resolve(newToken));
          this.refreshSubscribers = [];
          
          // Emit token refresh event
          emitAuthEvent.tokenRefresh(newToken);
          
          return newToken;
        } else {
          throw new ApiClientError(API_ERROR_TYPES.AUTHENTICATION_ERROR, 'Invalid token response');
        }
      } else {
        throw new ApiClientError(API_ERROR_TYPES.AUTHENTICATION_ERROR, 'Token refresh failed');
      }
    } catch (error) {
      this.clearAuthTokens();
      localStorage.removeItem('reviewinn_jwt_token');
      localStorage.removeItem('reviewinn_refresh_token');
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // Create API error from response
  private createApiError(response: Response, data?: unknown): ApiClientError {
    const status = response.status;
    let type: keyof typeof API_ERROR_TYPES = API_ERROR_TYPES.UNKNOWN_ERROR;
    let message = 'An unknown error occurred';

    // Try to extract backend error message
    if (data && typeof data === 'object' && data !== null) {
      const dataObj = data as Record<string, unknown>;
      if (typeof dataObj.detail === 'string') {
        message = dataObj.detail;
      } else if (typeof dataObj.detail === 'object' && dataObj.detail !== null) {
        // Handle structured validation errors
        const detailObj = dataObj.detail as Record<string, unknown>;
        if (typeof detailObj.message === 'string') {
          message = detailObj.message;
          // If there are specific errors, append them
          if (Array.isArray(detailObj.errors) && detailObj.errors.length > 0) {
            const errorList = detailObj.errors.filter(err => typeof err === 'string').join(', ');
            if (errorList) {
              message += `: ${errorList}`;
            }
          }
        }
      } else if (typeof dataObj.message === 'string') {
        message = dataObj.message;
      }
    }

    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        type = API_ERROR_TYPES.VALIDATION_ERROR;
        if (message === 'An unknown error occurred') message = 'Invalid request';
        break;
      case HTTP_STATUS.UNAUTHORIZED:
        type = API_ERROR_TYPES.AUTHENTICATION_ERROR;
        if (message === 'An unknown error occurred') message = 'Authentication required';
        break;
      case HTTP_STATUS.FORBIDDEN:
        type = API_ERROR_TYPES.AUTHORIZATION_ERROR;
        if (message === 'An unknown error occurred') message = 'Access denied';
        break;
      case HTTP_STATUS.NOT_FOUND:
        type = API_ERROR_TYPES.NOT_FOUND_ERROR;
        if (message === 'An unknown error occurred') message = 'Resource not found';
        break;
      case HTTP_STATUS.CONFLICT:
        type = API_ERROR_TYPES.CONFLICT_ERROR;
        if (message === 'An unknown error occurred') message = 'Resource conflict';
        break;
      case HTTP_STATUS.UNPROCESSABLE_ENTITY:
        type = API_ERROR_TYPES.VALIDATION_ERROR;
        if (message === 'An unknown error occurred') message = 'Validation failed';
        break;
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        type = API_ERROR_TYPES.RATE_LIMIT_ERROR;
        if (message === 'An unknown error occurred') message = 'Rate limit exceeded';
        break;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        type = API_ERROR_TYPES.SERVER_ERROR;
        if (message === 'An unknown error occurred') message = 'Server error';
        break;
    }

    const dataObj = data && typeof data === 'object' && data !== null ? data as Record<string, unknown> : {};
    return new ApiClientError(type, message, status, typeof dataObj.code === 'string' ? dataObj.code : undefined, dataObj.details);
  }

  // Retry mechanism with exponential backoff for rate limits
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number = API_CONFIG.RETRY_ATTEMPTS,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error)) {
        // Use exponential backoff for rate limit errors
        let delay: number = API_CONFIG.RETRY_DELAY;
        if (error instanceof ApiClientError && error.type === API_ERROR_TYPES.RATE_LIMIT_ERROR) {
          delay = Math.min(30000, API_CONFIG.RETRY_DELAY * Math.pow(2, attempt)); // Max 30 seconds
        }
        
        await this.delay(delay);
        return this.retryRequest(requestFn, retries - 1, attempt + 1);
      }
      throw error;
    }
  }

  // Check if request should be retried
  private shouldRetry(error: unknown): boolean {
    if (error instanceof ApiClientError) {
      return error.type === API_ERROR_TYPES.NETWORK_ERROR || 
             error.type === API_ERROR_TYPES.TIMEOUT_ERROR ||
             error.type === API_ERROR_TYPES.SERVER_ERROR ||
             error.type === API_ERROR_TYPES.RATE_LIMIT_ERROR; // Allow retry for rate limit errors
    }
    return false;
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Main request method
  async request<T = unknown>(
    url: string,
    options: RequestInit = {},
    useCache: boolean = false,
    cacheKey?: string
  ): Promise<ApiResponse<T>> {
    // Check if this is a protected endpoint that requires authentication
    const isProtectedEndpoint = (url.includes('/users/me') || url.includes('/auth/profile') || 
                                url.includes('/reviews/create') || url.includes('/entities/create') ||
                                url.includes('/circles/') || url.includes('/notifications/') ||
                                url.includes('/enterprise-notifications/') ||
                                url.includes('/messenger/') || url.includes('/messaging/')) &&
                                !url.includes('/messaging/debug/'); // Exclude debug endpoints from auth requirement
    
    // If it's a protected endpoint and we have no token, don't make the request
    if (isProtectedEndpoint) {
      const token = this.authToken || 
                    useAuthStore.getState().token || 
                    localStorage.getItem('reviewinn_jwt_token');
      
      if (!token) {
        console.log('HttpClient: Skipping protected endpoint call - no auth token available');
        throw new ApiClientError(
          API_ERROR_TYPES.AUTHENTICATION_ERROR,
          'Authentication required',
          401
        );
      }
    }

    // Check rate limit (disabled in development)
    if (!import.meta.env.DEV && !this.rateLimiter.canMakeRequest()) {
      throw new ApiClientError(
        API_ERROR_TYPES.RATE_LIMIT_ERROR,
        'Rate limit exceeded',
        429
      );
    }

    // Check cache for GET requests
    if (useCache && options.method === 'GET' && cacheKey) {
      const cachedData = this.cache.get(cacheKey) as ApiResponse<T> | null;
      if (cachedData) {
        return cachedData;
      }
    }

    const requestFn = async (): Promise<ApiResponse<T>> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      try {
        const response = await fetch(url, {
          ...options,
          headers: this.getHeaders(options.headers as Record<string, string>, url),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Handle token refresh for 401 errors
        if (response.status === HTTP_STATUS.UNAUTHORIZED) {
          // Only log unauthorized errors in development or for protected endpoints
          const isProtectedEndpoint = (url.includes('/users/me') || url.includes('/auth/') || 
                                      url.includes('/reviews/create') || url.includes('/circles/') ||
                                      url.includes('/notifications/') || url.includes('/enterprise-notifications/') ||
                                      url.includes('/messenger/')) &&
                                      !url.includes('/messaging/debug/'); // Exclude debug endpoints from auth requirement
          if (import.meta.env.DEV || isProtectedEndpoint) {
            console.log('HttpClient: Received 401 Unauthorized, attempting token refresh...');
          }
          
          const refreshToken = localStorage.getItem('reviewinn_refresh_token');
          if (refreshToken) {
            try {
              const newToken = await this.handleTokenRefresh();
              if (import.meta.env.DEV || isProtectedEndpoint) {
                console.log('HttpClient: Token refresh successful, retrying original request');
              }
              
              // Retry the original request with new token
              const retryResponse = await fetch(url, {
                ...options,
                headers: this.getHeaders(options.headers as Record<string, string>, url),
                signal: controller.signal
              });
              
              if (retryResponse.ok) {
                const data = await retryResponse.json();
                if (useCache && cacheKey) {
                  this.cache.set(cacheKey, data);
                }
                if (import.meta.env.DEV || isProtectedEndpoint) {
                  console.log('HttpClient: Retry request successful after token refresh');
                }
                return data;
              } else {
                if (import.meta.env.DEV || isProtectedEndpoint) {
                  console.log('HttpClient: Retry request failed after token refresh');
                }
              }
            } catch (refreshError) {
              if (import.meta.env.DEV || isProtectedEndpoint) {
                console.error('HttpClient: Token refresh failed:', refreshError);
                console.log('HttpClient: Forcing logout due to refresh failure');
              }
              // Refresh failed, clear auth and continue with original error
              useAuthStore.getState().logout();
            }
          } else {
            // Only force logout if this was a protected endpoint
            if (isProtectedEndpoint) {
              if (import.meta.env.DEV) {
                console.log('HttpClient: No refresh token available, forcing logout');
              }
              useAuthStore.getState().logout();
            }
          }
        }

        let data;
        try {
          const responseText = await response.text();
          if (!responseText.trim()) {
            // Empty response
            data = { success: true, data: null };
          } else {
            data = JSON.parse(responseText);
          }
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          // If response is not JSON, create a default response
          data = { success: false, message: 'Invalid JSON response' };
        }

        // If the response is not already wrapped, wrap it
        const wrapped = typeof data === 'object' && data !== null && ('data' in data || 'success' in data)
          ? data
          : { success: true, data };

        if (!response.ok) {
          throw this.createApiError(response, wrapped);
        }

        // Cache successful GET responses
        if (useCache && cacheKey && response.ok) {
          this.cache.set(cacheKey, wrapped);
        }

        return wrapped;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof ApiClientError) {
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiClientError(API_ERROR_TYPES.TIMEOUT_ERROR, 'Request timeout');
        }

        throw new ApiClientError(API_ERROR_TYPES.NETWORK_ERROR, 'Network error');
      }
    };

    return this.retryRequest(requestFn);
  }

  // Convenience methods
  async get<T = unknown>(url: string, useCache: boolean = false): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' }, useCache, url);
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async put<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async patch<T = unknown>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  async delete<T = unknown>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' });
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  // Rate limit info
  getRateLimitInfo(): { remaining: number; resetTime?: number } {
    return {
      remaining: this.rateLimiter.getRemainingRequests()
    };
  }
}

// Export singleton instance
export const httpClient = new HttpClient(); 