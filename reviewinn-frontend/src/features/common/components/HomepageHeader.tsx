import React, { memo } from 'react';

interface HomepageHeaderProps {
  reviewCount: number;
}

const HomepageHeader: React.FC<HomepageHeaderProps> = memo(({ reviewCount }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm">
            <strong>ReviewInn Homepage</strong> - Optimized single-table performance with real-time data.
            {reviewCount > 0 && ` Showing ${reviewCount} recent reviews.`}
          </p>
        </div>
      </div>
    </div>
  );
});

HomepageHeader.displayName = 'HomepageHeader';

export default HomepageHeader;