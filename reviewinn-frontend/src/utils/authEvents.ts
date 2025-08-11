/**
 * Global auth event system to keep all auth components in sync
 */

type AuthEventType = 'login' | 'logout' | 'token_refresh' | 'token_expired';

interface AuthEvent {
  type: AuthEventType;
  data?: any;
}

class AuthEventEmitter {
  private listeners: Map<AuthEventType, Set<(data?: any) => void>> = new Map();

  on(event: AuthEventType, callback: (data?: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: AuthEventType, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in auth event listener for ${event}:`, error);
        }
      });
    }
  }

  off(event: AuthEventType, callback: (data?: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  removeAllListeners(event?: AuthEventType) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const authEvents = new AuthEventEmitter();

// Helper to emit common auth events
export const emitAuthEvent = {
  login: (user: any, token: string) => authEvents.emit('login', { user, token }),
  logout: () => authEvents.emit('logout'),
  tokenRefresh: (token: string) => authEvents.emit('token_refresh', { token }),
  tokenExpired: () => authEvents.emit('token_expired')
};