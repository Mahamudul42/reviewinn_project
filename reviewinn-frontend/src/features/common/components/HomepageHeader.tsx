import React, { memo } from 'react';

interface HomepageHeaderProps {
  reviewCount: number;
}

const HomepageHeader: React.FC<HomepageHeaderProps> = memo(({ reviewCount }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm mx-2 sm:mx-4 lg:mx-6 rounded-r-lg">
      <div className="flex items-start sm:items-center">
        <div className="flex-shrink-0">
          <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mt-0.5 sm:mt-0" viewBox="0 0 20 20" fill="currentColor">
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-2 sm:ml-3">
          <p className="text-xs sm:text-sm leading-relaxed">
            <strong className="block sm:inline">ReviewInn Test Homepage</strong>
            <span className="block sm:inline sm:ml-1">
              - Optimized performance with real-time data
              {reviewCount > 0 && (
                <span className="block sm:inline">
                  . <span className="font-medium">Showing {reviewCount} recent reviews</span>
                </span>
              )}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
});

HomepageHeader.displayName = 'HomepageHeader';

export default HomepageHeader;