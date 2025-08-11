import React from 'react';

interface ReviewProsAndConsProps {
  pros?: string[];
  cons?: string[];
  maxItemsPerSection?: number;
  showAll?: boolean;
  className?: string;
}

const ReviewProsAndCons: React.FC<ReviewProsAndConsProps> = ({
  pros = [],
  cons = [],
  maxItemsPerSection = 2,
  showAll = false,
  className = ''
}) => {
  const displayedPros = showAll ? pros : pros.slice(0, maxItemsPerSection);
  const displayedCons = showAll ? cons : cons.slice(0, maxItemsPerSection);

  if (displayedPros.length === 0 && displayedCons.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${className}`}>
      {/* Pros Section */}
      {displayedPros.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <ul className="space-y-2.5">
            {displayedPros.map((pro, index) => (
              <li key={index} className="text-emerald-800 text-sm flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="flex-1 font-medium leading-relaxed">{pro}</span>
              </li>
            ))}
          </ul>
          {!showAll && pros.length > maxItemsPerSection && (
            <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {pros.length - maxItemsPerSection} more in details
            </div>
          )}
        </div>
      )}

      {/* Cons Section */}
      {displayedCons.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-xl p-4 shadow-sm">
          <ul className="space-y-2.5">
            {displayedCons.map((con, index) => (
              <li key={index} className="text-rose-800 text-sm flex items-start gap-3">
                <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="flex-1 font-medium leading-relaxed">{con}</span>
              </li>
            ))}
          </ul>
          {!showAll && cons.length > maxItemsPerSection && (
            <div className="mt-3 text-xs text-rose-700 font-semibold flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              {cons.length - maxItemsPerSection} more in details
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewProsAndCons;