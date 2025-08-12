import React, { memo } from 'react';
import AnalyticsLeftPanel from '../features/common/components/AnalyticsLeftPanel';
import HomepageHeader from '../features/common/components/HomepageHeader';
import HomepageErrorBoundary from '../features/common/components/HomepageErrorBoundary';

/**
 * Analytics Left Panel Page
 * Uses exact same styling as TestHomePage but shows only left panel
 * Completely independent for analytics-based data
 */
const AnalyticsLeftPanelPage: React.FC = () => {
  return (
    <HomepageErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" style={{ zoom: '0.9' }}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <HomepageHeader reviewCount={0} />

          {/* Main content area with left panel only - Responsive */}
          <div className="flex justify-center w-full">
            <div className="w-full max-w-7xl">
              <div className="flex justify-start px-2 sm:px-4 md:px-6 lg:px-8">
                {/* Left Panel only - Responsive width */}
                <div className="w-full sm:w-96 md:w-80 lg:w-96 xl:w-80">
                  <AnalyticsLeftPanel />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HomepageErrorBoundary>
  );
};

export default memo(AnalyticsLeftPanelPage);