import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import AuthGuard from './AuthGuard';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  redirectToHome?: boolean;
  requireAuth?: boolean;
  title?: string;
  description?: string;
  feature?: string;
  showAuthGuard?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/',
  redirectToHome = false,
  requireAuth = true,
  title,
  description,
  feature,
  showAuthGuard = true
}) => {
  const location = useLocation();
  const { isAuthenticated, getToken, isLoading, isInitialized } = useUnifiedAuth();
  const actuallyAuthenticated = isAuthenticated || !!getToken();

  // Debug logging to track authentication state
  console.log('ProtectedRoute Debug:', {
    path: location.pathname,
    isAuthenticated,
    hasToken: !!getToken(),
    isLoading,
    isInitialized,
    actuallyAuthenticated,
    requireAuth
  });

  useEffect(() => {
    // Store the intended destination for redirect after login
    if (requireAuth && !actuallyAuthenticated && isInitialized) {
      console.log('ProtectedRoute: Storing intended destination:', location.pathname);
      sessionStorage.setItem('intendedDestination', location.pathname);
      
      // Trigger the auth modal for certain scenarios
      if (!showAuthGuard) {
        window.dispatchEvent(new CustomEvent('openAuthModal'));
      }
    }
  }, [requireAuth, actuallyAuthenticated, location.pathname, showAuthGuard, isInitialized]);

  // Wait for auth initialization before making decisions
  if (requireAuth && isLoading && !isInitialized) {
    console.log('ProtectedRoute: Waiting for auth initialization...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Skip protection if auth is not required
  if (!requireAuth) {
    console.log('ProtectedRoute: Auth not required, rendering children');
    return <>{children}</>;
  }

  // If not authenticated and auth is required
  if (!actuallyAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, checking redirect logic');
    
    // For certain routes or when explicitly requested, redirect to home
    if (redirectToHome || 
        location.pathname.includes('/dashboard') || 
        location.pathname.includes('/profile') || 
        location.pathname.includes('/circle') ||
        location.pathname.includes('/messenger') ||
        location.pathname.includes('/add-entity')) {
      console.log('ProtectedRoute: Redirecting to home due to protected route');
      return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }
    
    // Show auth guard with custom messaging if enabled
    if (showAuthGuard) {
      console.log('ProtectedRoute: Showing auth guard');
      return (
        <AuthGuard
          title={title}
          description={description}
          feature={feature}
        >
          {children}
        </AuthGuard>
      );
    }
    
    // Default fallback to redirect
    console.log('ProtectedRoute: Default redirect to home');
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;