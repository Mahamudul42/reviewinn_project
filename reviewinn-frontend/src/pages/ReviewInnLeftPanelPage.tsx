import React, { memo } from 'react';
import ReviewInnLeftPanel from '../features/common/components/ReviewInnLeftPanel';
import HomepageHeader from '../features/common/components/HomepageHeader';
import HomepageErrorBoundary from '../features/common/components/HomepageErrorBoundary';

/**
 * ReviewInn Left Panel Page
 * Uses exact same styling as TestHomePage but shows only left panel
 * Completely independent for ReviewInn-based data
 * Fully responsive across all screen sizes
 */
const ReviewInnLeftPanelPage: React.FC = memo(() => {
  return (
    <HomepageErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <HomepageHeader />
        
        {/* Main Content Container - Responsive */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Left Panel - Takes full width on mobile, 4 columns on large screens */}
            <div className="lg:col-span-4 h-full">
              <ReviewInnLeftPanel />
            </div>
            
            {/* Right Side - Hidden on mobile, shown on large screens */}
            <div className="hidden lg:block lg:col-span-8 h-full">
              <div className="cardBg rounded-lg border border-gray-200 shadow-sm h-full">
                <div className="cardWrapper p-8 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-semibold mb-2">ReviewInn Analytics</h2>
                    <p className="text-gray-400">
                      This space is reserved for additional analytics content
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </HomepageErrorBoundary>
  );
});

ReviewInnLeftPanelPage.displayName = 'ReviewInnLeftPanelPage';

export default ReviewInnLeftPanelPage;