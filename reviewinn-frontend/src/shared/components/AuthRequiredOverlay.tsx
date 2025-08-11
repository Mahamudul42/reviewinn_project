import React, { useState } from 'react';
import AuthModal from '../../features/auth/components/AuthModal';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface AuthRequiredOverlayProps {
  children: React.ReactNode;
  action: string;
  message?: string;
  showOverlay?: boolean;
}

const AuthRequiredOverlay: React.FC<AuthRequiredOverlayProps> = ({
  children,
  action,
  message,
  showOverlay = true
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAuthModal(true);
  };

  const getActionMessage = () => {
    switch (action) {
      case 'comment':
        return 'Sign up to comment on reviews';
      case 'react':
        return 'Sign up to react to reviews';
      case 'details':
        return 'Sign up to view full review details';
      case 'write':
        return 'Sign up to write reviews';
      default:
        return message || 'Sign up to access this feature';
    }
  };

  return (
    <>
      <div className="relative">
        <div className={showOverlay ? 'opacity-60 pointer-events-none' : ''}>
          {children}
        </div>
        
        {showOverlay && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm cursor-pointer rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-all duration-200"
            onClick={handleClick}
          >
            <div className="text-center p-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {getActionMessage()}
              </p>
              <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
                Click to get started →
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          window.location.reload();
        }}
        defaultMode="register"
      />
    </>
  );
};

export default AuthRequiredOverlay;