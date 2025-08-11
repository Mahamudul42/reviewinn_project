import React from 'react';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import AuthPrompt from './AuthPrompt';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
  feature?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  title = "Sign In Required",
  description = "Please sign in to access this feature and unlock the full potential of ReviewInn.",
  feature = "default"
}) => {
  const { isAuthenticated } = useUnifiedAuth();

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuthPrompt
          title={title}
          description={description}
          feature={feature}
          onSignIn={() => {
            window.dispatchEvent(new CustomEvent('openAuthModal'));
          }}
          className="max-w-md"
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;