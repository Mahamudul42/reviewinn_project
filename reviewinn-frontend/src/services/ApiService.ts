/**
 * Enterprise API Service Wrapper
 * Handles failures, retries, circuit breakers, and feature flags
 */

import { featureFlags } from './FeatureFlags';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  retryAfter?: number;
  fallbackUsed?: boolean;
}

export interface ApiServiceConfig {
  retries: number;
  retryDelay: number;
  timeout: number;
  enableLogging: boolean;
}

class ApiServiceWrapper {
  private config: ApiServiceConfig = {
    retries: 3,
    retryDelay: 1000,
    timeout: 10000,
    enableLogging: true,
  };

  async executeWithFallback<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallbackData?: T,
    operationName?: string
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    
    try {
      // Check circuit breaker
      if (featureFlags.isCircuitBreakerOpen(serviceName)) {
        return this.handleCircuitBreakerOpen(serviceName, fallbackData, operationName);
      }

      // Execute with retries
      const result = await this.executeWithRetry(operation);
      
      // Record success
      featureFlags.recordSuccess(serviceName);
      
      this.logSuccess(serviceName, operationName, Date.now() - startTime);
      
      return {
        success: true,
        data: result,
        fallbackUsed: false
      };

    } catch (error) {
      // Record failure for circuit breaker
      featureFlags.recordFailure(serviceName);
      
      return this.handleApiError(serviceName, error, fallbackData, operationName);
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          this.timeoutPromise()
        ]);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retries) {
          await this.delay(this.config.retryDelay * attempt);
          this.log(`Retry attempt ${attempt} for operation`);
        }
      }
    }

    throw lastError!;
  }

  private handleCircuitBreakerOpen<T>(
    serviceName: string, 
    fallbackData?: T, 
    operationName?: string
  ): ApiResponse<T> {
    this.log(`Circuit breaker open for ${serviceName}, using fallback`, 'warn');
    
    return {
      success: false,
      error: 'Service temporarily unavailable',
      errorCode: 'CIRCUIT_BREAKER_OPEN',
      data: fallbackData,
      fallbackUsed: !!fallbackData,
      retryAfter: 30000 // Retry after 30 seconds
    };
  }

  private handleApiError<T>(
    serviceName: string,
    error: unknown,
    fallbackData?: T,
    operationName?: string
  ): ApiResponse<T> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isNetworkError = errorMessage.includes('fetch') || errorMessage.includes('network');
    const is404 = errorMessage.includes('404');
    
    this.logError(serviceName, operationName, errorMessage);

    // Determine appropriate response based on error type
    if (is404) {
      return {
        success: false,
        error: 'Feature not available - service endpoint not found',
        errorCode: 'FEATURE_NOT_AVAILABLE',
        data: fallbackData,
        fallbackUsed: !!fallbackData
      };
    }

    if (isNetworkError) {
      return {
        success: false,
        error: 'Network connection problem - please check your internet connection',
        errorCode: 'NETWORK_ERROR',
        data: fallbackData,
        fallbackUsed: !!fallbackData,
        retryAfter: 5000
      };
    }

    return {
      success: false,
      error: 'Service temporarily unavailable - please try again later',
      errorCode: 'SERVICE_ERROR',
      data: fallbackData,
      fallbackUsed: !!fallbackData
    };
  }

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), this.config.timeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (!this.config.enableLogging) return;

    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    console[level](`${prefix} [ApiService ${timestamp}] ${message}`);
  }

  private logSuccess(serviceName: string, operationName?: string, duration?: number) {
    this.log(`✅ ${serviceName}${operationName ? `:${operationName}` : ''} completed successfully${duration ? ` (${duration}ms)` : ''}`, 'info');
  }

  private logError(serviceName: string, operationName?: string, error?: string) {
    this.log(`❌ ${serviceName}${operationName ? `:${operationName}` : ''} failed: ${error}`, 'error');
  }

  // Health check method
  async healthCheck(serviceName: string, healthEndpoint: () => Promise<unknown>): Promise<boolean> {
    try {
      await this.executeWithRetry(healthEndpoint);
      featureFlags.recordSuccess(serviceName);
      return true;
    } catch {
      featureFlags.recordFailure(serviceName);
      return false;
    }
  }
}

export const apiService = new ApiServiceWrapper();

// Messaging-specific wrapper
export const messagingApiService = {
  async getConversations(operation: () => Promise<any>) {
    if (!featureFlags.isMessagingEndpointEnabled('conversations')) {
      return {
        success: false,
        error: 'Messaging conversations feature is disabled',
        errorCode: 'FEATURE_DISABLED',
        fallbackUsed: false
      };
    }

    return apiService.executeWithFallback(
      'messaging-api',
      operation,
      undefined, // No fallback data for production
      'getConversations'
    );
  },

  async sendMessage(operation: () => Promise<any>) {
    if (!featureFlags.isMessagingEndpointEnabled('messages')) {
      return {
        success: false,
        error: 'Messaging feature is disabled',
        errorCode: 'FEATURE_DISABLED'
      };
    }

    return apiService.executeWithFallback(
      'messaging-api',
      operation,
      undefined,
      'sendMessage'
    );
  }
};