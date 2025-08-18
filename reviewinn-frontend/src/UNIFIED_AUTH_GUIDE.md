# Unified Authentication System - Complete Guide

## Overview

The unified authentication system provides a single, consistent interface for all authentication operations across your ReviewInn application. It combines multiple auth systems (AuthService, AuthStore, AuthContext) under one unified API while maintaining backward compatibility.

## Key Components

### 1. `useUnifiedAuth` Hook (Primary Interface)

This is your main interface for authentication in React components.

```typescript
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

const MyComponent = () => {
  const {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isInitialized,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    clearError,

    // Utilities
    getToken,
    checkAuth,
    requireAuth,
    withAuth,
    ensureAuthenticated,
    healthCheck
  } = useUnifiedAuth();

  // Your component logic here
};
```

### 2. Auth Manager & Service Layer

- **AuthManager**: Facade pattern that manages different auth services
- **ReviewInnAuthService**: Bridges your existing auth system to the unified interface
- **AuthStore (Zustand)**: Global state management for auth data
- **AuthService**: Backend API communication layer

### 3. HTTP Client Integration

The `httpClient` automatically:
- Adds auth tokens to requests
- Handles token refresh on 401 errors
- Syncs with the unified auth system

## Usage Examples

### Basic Login/Logout

```typescript
const LoginComponent = () => {
  const { login, logout, isAuthenticated, user, error, isLoading } = useUnifiedAuth();
  
  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
      // User is now logged in, state updated automatically
    } catch (error) {
      // Error is automatically set in the auth state
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    // User is logged out, state cleared automatically
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.name}!</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};
```

### Protected Operations

```typescript
const ProtectedComponent = () => {
  const { withAuth, requireAuth } = useUnifiedAuth();

  // Method 1: Use withAuth for async operations
  const handleProtectedAction = async () => {
    try {
      const result = await withAuth(async () => {
        // This only runs if user is authenticated
        return await fetch('/api/protected-data');
      });
      console.log(result);
    } catch (error) {
      console.error('Auth required:', error);
    }
  };

  // Method 2: Use requireAuth to check before proceeding
  const handleAnotherAction = () => {
    const canProceed = requireAuth(() => {
      // This callback runs if user is NOT authenticated
      alert('Please log in to continue');
    });

    if (canProceed) {
      // User is authenticated, proceed with action
      console.log('Proceeding with protected action');
    }
  };
};
```

### Registration

```typescript
const RegisterComponent = () => {
  const { register, error, isLoading } = useUnifiedAuth();

  const handleRegister = async (formData: any) => {
    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });
      // User is registered and automatically logged in
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };
};
```

### Health Checks

```typescript
const AdminPanel = () => {
  const { healthCheck } = useUnifiedAuth();

  const checkSystemHealth = async () => {
    const health = await healthCheck();
    console.log('System health:', health);
    // Returns: { healthy: boolean, details: {...} }
  };
};
```

## Migration from Old Auth System

### Before (Old Way)
```typescript
// Multiple imports needed
import { useAuth } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../api/auth';

const MyComponent = () => {
  const { user } = useAuth(); // From context
  const { isLoading } = useAuthStore(); // From store
  const token = authService.getToken(); // From service
  
  // Inconsistent state management
};
```

### After (Unified Way)
```typescript
// Single import
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

const MyComponent = () => {
  const { user, isLoading, token } = useUnifiedAuth();
  
  // Everything in one place, always consistent
};
```

## State Synchronization

The unified system ensures:
- **Cross-tab synchronization**: Login/logout in one tab affects all tabs
- **Automatic token refresh**: Handles token expiration transparently
- **Consistent state**: All components always see the same auth state
- **Persistent sessions**: Auth state persists across browser refreshes

## Error Handling

```typescript
const MyComponent = () => {
  const { error, clearError, isLoading } = useUnifiedAuth();

  // Errors are automatically captured and stored
  useEffect(() => {
    if (error) {
      console.error('Auth error:', error);
      // Optionally clear the error
      setTimeout(clearError, 5000);
    }
  }, [error, clearError]);
};
```

## Best Practices

1. **Use `useUnifiedAuth` in all new components** - It's the single source of truth
2. **Don't access localStorage directly** - Use the auth system methods
3. **Handle loading states** - The system provides `isLoading` for better UX
4. **Use `withAuth` for protected operations** - Built-in auth checking
5. **Let the system handle token refresh** - It's automatic
6. **Use `requireAuth` for user actions** - Better user experience than redirects

## Backward Compatibility

The unified system maintains compatibility with:
- Existing `AuthContext` usage
- `useAuthStore` calls
- Direct `authService` usage

However, new code should use `useUnifiedAuth` for consistency.

## Common Issues & Solutions

### Issue: Component doesn't update on auth state change
**Solution**: Make sure you're using `useUnifiedAuth()` and not accessing state directly.

### Issue: Token not included in API requests
**Solution**: The `httpClient` handles this automatically. Make sure you're using it for API calls.

### Issue: Auth state not persisting
**Solution**: The system uses Zustand persistence. Check browser storage permissions.

### Issue: Multiple re-renders on auth state change
**Solution**: The unified system is optimized to minimize re-renders. Use selectors if needed.

## Testing

```typescript
// Example test
import { renderHook, act } from '@testing-library/react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

test('should login user successfully', async () => {
  const { result } = renderHook(() => useUnifiedAuth());

  await act(async () => {
    await result.current.login({
      email: 'test@example.com',
      password: 'password'
    });
  });

  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user).toBeDefined();
});
```

## Migration Timeline

1. **Phase 1**: Start using `useUnifiedAuth` in new components
2. **Phase 2**: Gradually migrate existing components
3. **Phase 3**: Remove direct access to old auth systems
4. **Phase 4**: Clean up unused auth code

The unified system is production-ready and can be adopted incrementally.