import React, { memo } from 'react';
import RightPanelReviewinn from '../shared/panels/RightPanel/RightPanelReviewinn';
import HomepageHeader from '../features/common/components/HomepageHeader';
import HomepageErrorBoundary from '../features/common/components/HomepageErrorBoundary';

/**
 * ReviewInn Right Panel Page
 * Uses exact same styling as ReviewInnLeftPanelPage but shows only right panel
 * Completely independent for ReviewInn-based data
 * Shows authenticated user progress or public community insights
 * Fully responsive across all screen sizes
 */
const ReviewInnRightPanelPage: React.FC = memo(() => {
  return (
    <HomepageErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <HomepageHeader />
        
        {/* Main Content Container - Responsive */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
            {/* Left Side - Hidden on mobile, shown on large screens */}
            <div className="hidden lg:block lg:col-span-8 h-full">
              <div className="cardBg rounded-lg border border-gray-200 shadow-sm h-full">
                <div className="cardWrapper p-8 h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📊</div>
                    <h2 className="text-xl font-semibold mb-2">ReviewInn Dashboard</h2>
                    <p className="text-gray-400 max-w-md">
                      This space is reserved for main content. The right panel demonstrates 
                      personalized progress tracking for authenticated users or community 
                      insights for public users.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Panel - Takes full width on mobile, 4 columns on large screens */}
            <div className="lg:col-span-4 h-full">
              <RightPanelReviewinn />
            </div>
          </div>
        </main>
      </div>
    </HomepageErrorBoundary>
  );
});

ReviewInnRightPanelPage.displayName = 'ReviewInnRightPanelPage';

export default ReviewInnRightPanelPage;