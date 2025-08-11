import React, { useState } from 'react';
import AuthModal from '../../features/auth/components/AuthModal';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface GatedContentProps {
  publicItemsLimit?: number;
  totalItems: number;
  children: React.ReactNode;
  onAuthSuccess?: () => void;
  gateMessage?: {
    title: string;
    subtitle: string;
    benefits: string[];
  };
}

const GatedContent: React.FC<GatedContentProps> = ({
  publicItemsLimit = 15,
  totalItems,
  children,
  onAuthSuccess,
  gateMessage = {
    title: "See More Reviews",
    subtitle: "Join thousands of users sharing honest reviews",
    benefits: [
      "Access unlimited reviews",
      "Write your own reviews",
      "Comment and interact",
      "Build your reputation"
    ]
  }
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const shouldShowGate = !isAuthenticated && totalItems > publicItemsLimit;
  const hiddenItemsCount = totalItems - publicItemsLimit;

  // Debug logging
  console.log('GatedContent Debug:', {
    isAuthenticated,
    totalItems,
    publicItemsLimit,
    shouldShowGate,
    hiddenItemsCount
  });

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onAuthSuccess?.();
  };

  const handleGetStarted = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      {children}
      
      {shouldShowGate && (
        <div className="relative">
          {/* Gradient Overlay */}
          <div className="absolute -top-20 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-white/70 to-white pointer-events-none z-10" />
          
          {/* Gate Card */}
          <div className="relative z-20 mx-auto max-w-2xl">
            <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200 rounded-2xl shadow-xl p-8 text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              {/* Main Message */}
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {gateMessage.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {gateMessage.subtitle}
              </p>

              {/* Stats */}
              <div className="bg-white/70 rounded-xl p-4 mb-6 border border-blue-100">
                <div className="text-sm text-gray-600 mb-2">
                  You've seen <span className="font-semibold text-blue-600">{publicItemsLimit}</span> reviews
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {hiddenItemsCount}+ more reviews available
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {gateMessage.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => handleGetStarted('register')}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => handleGetStarted('login')}
                  className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                >
                  Already have account?
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 text-xs text-gray-500">
                <div className="flex items-center justify-center gap-4">
                  <span>✓ No spam</span>
                  <span>✓ Free forever</span>
                  <span>✓ Join in 30 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultMode={authMode}
      />
    </>
  );
};

export default GatedContent;