/**
 * Example: How to use useUnifiedAuth Hook
 * 
 * This is a comprehensive example showing how to use the unified authentication system
 * in your React components. The useUnifiedAuth hook provides a consistent interface
 * for all authentication operations.
 */

import React, { useState } from 'react';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';

const LoginForm: React.FC = () => {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    clearError,
    checkAuth,
    requireAuth,
    withAuth,
    healthCheck
  } = useUnifiedAuth();

  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const [healthStatus, setHealthStatus] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await login(credentials);
      alert('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
      // Error is automatically managed by useUnifiedAuth
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logged out successfully!');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProtectedOperation = async () => {
    try {
      const result = await withAuth(async () => {
        // This operation will only run if user is authenticated
        return await fetch('/api/protected-endpoint');
      });
      console.log('Protected operation result:', result);
    } catch (error) {
      console.error('Protected operation failed:', error);
    }
  };

  const handleRequireAuth = () => {
    const isAllowed = requireAuth(() => {
      // This callback will be called if user is not authenticated
      alert('Please log in to continue');
    });

    if (isAllowed) {
      alert('User is authenticated, proceeding...');
    }
  };

  const checkSystemHealth = async () => {
    try {
      const health = await healthCheck();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Unified Auth Example</h2>

      {/* Auth Status Display */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Auth Status:</h3>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? user.name || user.email : 'None'}</p>
        <p><strong>Has Token:</strong> {token ? 'Yes' : 'No'}</p>
        <p><strong>Check Auth:</strong> {checkAuth() ? 'Valid' : 'Invalid'}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated ? (
        /* Login Form */
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email:
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password:
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      ) : (
        /* User Dashboard */
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded">
            <h3 className="font-semibold text-green-800">Welcome, {user?.name || user?.email}!</h3>
            <p className="text-green-700">You are successfully authenticated.</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleProtectedOperation}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Test Protected Operation
            </button>

            <button
              onClick={handleRequireAuth}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
            >
              Test Require Auth
            </button>

            <button
              onClick={checkSystemHealth}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
            >
              Check System Health
            </button>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Health Status Display */}
      {healthStatus && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">System Health:</h3>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
            {JSON.stringify(healthStatus, null, 2)}
          </pre>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">How to use useUnifiedAuth:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Import: <code>import {`{ useUnifiedAuth }`} from '../hooks/useUnifiedAuth'</code></p>
          <p>• Use in component: <code>const auth = useUnifiedAuth()</code></p>
          <p>• Access all auth state and methods from the returned object</p>
          <p>• State updates automatically across your entire app</p>
          <p>• Built-in error handling and loading states</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;