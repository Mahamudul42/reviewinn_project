import React, { useState, useEffect } from 'react';
import AuthModal from '../../features/auth/components/AuthModal';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface FloatingAuthPromptProps {
  itemsViewed: number;
  totalItems: number;
  limit: number;
  onAuthSuccess?: () => void;
}

const FloatingAuthPrompt: React.FC<FloatingAuthPromptProps> = ({
  itemsViewed,
  totalItems,
  limit,
  onAuthSuccess
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (isAuthenticated || hasShown) {
      setIsVisible(false);
      return;
    }

    // Show floating prompt when user has viewed 80% of allowed content
    const viewThreshold = Math.floor(limit * 0.8);
    if (itemsViewed >= viewThreshold && totalItems > limit) {
      setIsVisible(true);
      setHasShown(true);
    }
  }, [isAuthenticated, itemsViewed, limit, totalItems, hasShown]);

  const handleSignUp = () => {
    setShowAuthModal(true);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onAuthSuccess?.();
  };

  if (!isVisible || isAuthenticated) return null;

  const remainingItems = totalItems - limit;

  return (
    <>
      {/* Floating Prompt */}
      <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-slideUp">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl p-4 border border-blue-500">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
          >
            ×
          </button>

          {/* Content */}
          <div className="pr-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                🔓
              </div>
              <h4 className="font-bold text-sm">Unlock More Content!</h4>
            </div>
            
            <p className="text-xs mb-3 text-blue-100">
              You've seen {itemsViewed} items. Get access to {remainingItems}+ more by signing up.
            </p>

            {/* Progress Bar */}
            <div className="bg-white/20 rounded-full h-1.5 mb-3">
              <div 
                className="bg-white rounded-full h-1.5 transition-all duration-300"
                style={{ width: `${(itemsViewed / limit) * 100}%` }}
              />
            </div>

            <button
              onClick={handleSignUp}
              className="w-full bg-white text-blue-600 font-bold text-sm py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sign Up Free 🚀
            </button>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultMode="register"
      />

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </>
  );
};

export default FloatingAuthPrompt;