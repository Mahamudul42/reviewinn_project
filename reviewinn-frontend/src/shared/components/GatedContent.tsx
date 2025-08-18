import React, { useState, useEffect, useRef } from 'react';
import AuthModal from '../../features/auth/components/AuthModal';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

interface EnhancedGatedContentProps {
  publicItemsLimit?: number;
  totalItems: number;
  children: React.ReactNode;
  onAuthSuccess?: () => void;
  gateMessage?: {
    title: string;
    subtitle: string;
    benefits: string[];
  };
  showProgressBar?: boolean;
  autoTriggerOnScroll?: boolean;
}

const EnhancedGatedContent: React.FC<EnhancedGatedContentProps> = ({
  publicItemsLimit = 15,
  totalItems,
  children,
  onAuthSuccess,
  gateMessage = {
    title: "Unlock More Content",
    subtitle: "Join our community to access all content",
    benefits: [
      "Access unlimited content",
      "Full interaction features",
      "Personalized experience",
      "Ad-free browsing"
    ]
  },
  showProgressBar = true,
  autoTriggerOnScroll = true
}) => {
  const { isAuthenticated } = useUnifiedAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasTriggeredScroll, setHasTriggeredScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modified logic: Show gate if not authenticated AND we have any reviews
  // If total items <= limit, show gate anyway to encourage signup
  const shouldShowGate = !isAuthenticated && totalItems > 0;
  const hiddenItemsCount = Math.max(0, totalItems - publicItemsLimit);
  const effectiveLimit = Math.min(publicItemsLimit, totalItems);
  const progressPercentage = totalItems > 0 ? Math.min((effectiveLimit / Math.max(totalItems, publicItemsLimit)) * 100, 100) : 0;

  // Debug info - only in development
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log('🔍 Enhanced Gating Debug:', {
      isAuthenticated,
      totalItems,
      publicItemsLimit,
      shouldShowGate,
      hiddenItemsCount,
      progressPercentage
    });
  }

  useEffect(() => {
    if (!autoTriggerOnScroll || isAuthenticated) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollProgress(scrolled);

      // Trigger auth modal when user scrolls 70% through visible content
      if (scrolled > 70 && !hasTriggeredScroll && shouldShowGate) {
        setHasTriggeredScroll(true);
        setShowAuthModal(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [autoTriggerOnScroll, isAuthenticated, shouldShowGate, hasTriggeredScroll]);

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    onAuthSuccess?.();
  };

  const handleGetStarted = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div ref={containerRef}>
      {/* Progress Bar for Non-Authenticated Users */}
      {!isAuthenticated && showProgressBar && totalItems > 0 && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 p-3 shadow-sm">
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-3 border border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-700 mb-2 font-medium">
              <span>📖 Review Preview</span>
              <span>{Math.round(progressPercentage)}% explored</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2 text-center bg-blue-50 px-3 py-1 rounded-full">
              🚀 {hiddenItemsCount > 0 ? `${hiddenItemsCount} more reviews unlocked with free signup` : 'Unlock unlimited reviews with free signup'}
            </div>
          </div>
        </div>
      )}

      {children}
      
      {/* Content Gate */}
      {shouldShowGate && (
        <div className="relative">
          {/* Gradient Overlay */}
          <div className="absolute -top-32 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-white/50 to-white pointer-events-none z-10" />
          
          {/* Main Gate Card */}
          <div className="relative z-20 mx-auto max-w-2xl mt-8">
            <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-2xl p-8 text-center animate-fadeIn" style={{ backgroundColor: 'white' }}>
              {/* Urgency Banner */}
              <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full inline-block mb-6 animate-pulse">
                🔥 LIMITED PREVIEW ENDED
              </div>

              {/* Icon */}
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              {/* Main Message */}
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {gateMessage.title}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {gateMessage.subtitle}
              </p>

              {/* Stats Card */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-200 shadow-lg">
                <div className="text-sm text-gray-600 mb-2">
                  You've explored <span className="font-bold text-blue-600">{effectiveLimit}</span> reviews
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  {hiddenItemsCount > 0 ? `${hiddenItemsCount}+ More Reviews Available` : 'Unlimited Reviews Available'}
                </div>
                <div className="text-sm text-gray-600 bg-white/70 px-3 py-1 rounded-full inline-block">
                  🚀 {hiddenItemsCount > 0 ? 'Unlock more content now' : 'Join for full access & features'}
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {gateMessage.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <button
                  onClick={() => handleGetStarted('register')}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-xl hover:shadow-2xl"
                >
                  🚀 Join Free & Unlock All
                </button>
                <button
                  onClick={() => handleGetStarted('login')}
                  className="px-8 py-4 bg-gray-50 text-gray-700 font-semibold text-lg rounded-lg border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 shadow-lg"
                >
                  Already have an account?
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center gap-8 text-sm">
                  <span className="flex items-center gap-2 text-green-700 font-medium">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    100% Free Forever
                  </span>
                  <span className="flex items-center gap-2 text-green-700 font-medium">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    30 Second Signup
                  </span>
                  <span className="flex items-center gap-2 text-green-700 font-medium">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Instant Access
                  </span>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className="text-center mt-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">J</div>
                    <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">M</div>
                    <div className="w-8 h-8 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">S</div>
                    <div className="w-8 h-8 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">A</div>
                    <div className="w-8 h-8 bg-pink-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs">+</div>
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">Join 15,000+ active reviewers</p>
                <p className="text-xs text-gray-500">Trusted community sharing honest reviews</p>
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

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnhancedGatedContent;