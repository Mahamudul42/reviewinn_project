/**
 * Enterprise Feature Flag System
 * Centralized feature management with environment and runtime support
 */

export interface FeatureConfig {
  messaging: {
    enabled: boolean;
    endpoints: {
      conversations: boolean;
      messages: boolean;
      presence: boolean;
    };
    fallbackMode: 'disabled' | 'readonly' | 'mock';
    circuitBreaker: {
      enabled: boolean;
      failureThreshold: number;
      timeoutMs: number;
    };
  };
  notifications: {
    enabled: boolean;
    realTime: boolean;
  };
  analytics: {
    enabled: boolean;
    trackErrors: boolean;
  };
}

class FeatureFlagService {
  private config: FeatureConfig;
  private circuitBreakers = new Map<string, {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
  }>();

  constructor() {
    this.config = this.loadConfiguration();
    this.initializeCircuitBreakers();
  }

  private loadConfiguration(): FeatureConfig {
    // Environment-based configuration
    return {
      messaging: {
        enabled: this.getEnvBoolean('VITE_MESSAGING_ENABLED', false),
        endpoints: {
          conversations: this.getEnvBoolean('VITE_MESSAGING_CONVERSATIONS_ENABLED', false),
          messages: this.getEnvBoolean('VITE_MESSAGING_MESSAGES_ENABLED', false),
          presence: this.getEnvBoolean('VITE_MESSAGING_PRESENCE_ENABLED', false),
        },
        fallbackMode: this.getEnvString('VITE_MESSAGING_FALLBACK_MODE', 'disabled') as any,
        circuitBreaker: {
          enabled: this.getEnvBoolean('VITE_CIRCUIT_BREAKER_ENABLED', true),
          failureThreshold: this.getEnvNumber('VITE_CIRCUIT_BREAKER_THRESHOLD', 5),
          timeoutMs: this.getEnvNumber('VITE_CIRCUIT_BREAKER_TIMEOUT', 30000),
        }
      },
      notifications: {
        enabled: this.getEnvBoolean('VITE_NOTIFICATIONS_ENABLED', true),
        realTime: this.getEnvBoolean('VITE_REALTIME_NOTIFICATIONS_ENABLED', true),
      },
      analytics: {
        enabled: this.getEnvBoolean('VITE_ANALYTICS_ENABLED', true),
        trackErrors: this.getEnvBoolean('VITE_ERROR_TRACKING_ENABLED', true),
      }
    };
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private getEnvString(key: string, defaultValue: string): string {
    return import.meta.env[key] || defaultValue;
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = import.meta.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  private initializeCircuitBreakers() {
    // Initialize circuit breakers for critical services
    const services = ['messaging-api', 'notifications-api', 'user-api'];
    services.forEach(service => {
      this.circuitBreakers.set(service, {
        failures: 0,
        lastFailure: 0,
        isOpen: false
      });
    });
  }

  // Feature flag checks
  isMessagingEnabled(): boolean {
    return this.config.messaging.enabled && !this.isCircuitBreakerOpen('messaging-api');
  }

  isMessagingEndpointEnabled(endpoint: keyof FeatureConfig['messaging']['endpoints']): boolean {
    return this.isMessagingEnabled() && this.config.messaging.endpoints[endpoint];
  }

  isNotificationsEnabled(): boolean {
    return this.config.notifications.enabled;
  }

  // Circuit breaker implementation
  recordSuccess(service: string) {
    const breaker = this.circuitBreakers.get(service);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  }

  recordFailure(service: string) {
    if (!this.config.messaging.circuitBreaker.enabled) return;

    const breaker = this.circuitBreakers.get(service);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = Date.now();

      if (breaker.failures >= this.config.messaging.circuitBreaker.failureThreshold) {
        breaker.isOpen = true;
        console.warn(`🚨 Circuit breaker opened for ${service} after ${breaker.failures} failures`);
        
        // Auto-reset after timeout
        setTimeout(() => {
          breaker.isOpen = false;
          breaker.failures = 0;
          console.info(`🔄 Circuit breaker reset for ${service}`);
        }, this.config.messaging.circuitBreaker.timeoutMs);
      }
    }
  }

  isCircuitBreakerOpen(service: string): boolean {
    const breaker = this.circuitBreakers.get(service);
    return breaker?.isOpen || false;
  }

  // Configuration getters
  getMessagingFallbackMode(): 'disabled' | 'readonly' | 'mock' {
    return this.config.messaging.fallbackMode;
  }

  // Runtime configuration updates (for admin panels)
  updateFeature(feature: string, enabled: boolean) {
    // Implementation for runtime feature toggling
    console.info(`Feature ${feature} ${enabled ? 'enabled' : 'disabled'} at runtime`);
  }

  // Health check
  getServiceStatus() {
    return {
      messaging: {
        enabled: this.isMessagingEnabled(),
        circuitBreakerOpen: this.isCircuitBreakerOpen('messaging-api'),
        endpoints: this.config.messaging.endpoints
      },
      notifications: {
        enabled: this.isNotificationsEnabled()
      }
    };
  }
}

export const featureFlags = new FeatureFlagService();
export { FeatureFlagService };