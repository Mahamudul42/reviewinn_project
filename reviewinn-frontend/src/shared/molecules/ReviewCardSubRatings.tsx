import React from 'react';
import ReviewProsAndCons from './ReviewProsAndCons';
import StarRating from '../atoms/StarRating';

interface ReviewCardSubRatingsProps {
  subRatings?: Record<string, any>;
  pros?: string[];
  cons?: string[];
  fallback?: string;
  showAllProsAndCons?: boolean;
}

const ReviewCardSubRatings: React.FC<ReviewCardSubRatingsProps> = ({
  subRatings = {},
  pros = [],
  cons = [],
  fallback = 'No sub-ratings',
  showAllProsAndCons = false
}) => {
  const hasRatings = subRatings && Object.keys(subRatings).length > 0;
  const ratingLabels = ['Very Poor', 'Poor', 'Average', 'Good', 'Very Good'];
  const getLabel = (val: any) => {
    if (typeof val === 'number' && val >= 1 && val <= 5) {
      // Show text label for each rating value
      return ratingLabels[Math.round(val) - 1] || val.toFixed(1);
    }
    return val;
  };

  const formatKeyName = (key: string) => {
    // Convert snake_case and camelCase to readable format
    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  };
  return (
    <div className="flex flex-row gap-2 mt-3 min-w-0">
      {/* Overall Evaluation Segment */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3 min-w-0 shadow-sm overflow-hidden">
        <div className="font-semibold text-gray-800 text-sm mb-3">OVERALL EVALUATION</div>
        <div className="space-y-2.5">
          {hasRatings ? (
            Object.entries(subRatings).slice(0, 6).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between gap-2 min-w-0">
                <span className="font-medium text-gray-700 text-sm flex-shrink min-w-0 break-words">
                  {formatKeyName(key)}:
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StarRating 
                    rating={Number(val) || 0}
                    maxRating={5}
                    size="xs"
                    showValue={false}
                    interactive={false}
                    className="flex-shrink-0"
                  />
                  <span className="text-gray-700 font-semibold text-xs whitespace-nowrap min-w-[65px] text-right">
                    {getLabel(val)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <span className="text-gray-500 italic text-sm">{fallback}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Pros & Cons Segment */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3 min-w-0 shadow-sm overflow-hidden">
        <div className="font-semibold text-gray-800 text-sm mb-3">PROS & CONS</div>
        <ReviewProsAndCons 
          pros={pros} 
          cons={cons} 
          maxItemsPerSection={showAllProsAndCons ? undefined : 2} 
          showAll={showAllProsAndCons}
        />
        {(pros.length === 0 && cons.length === 0) && (
          <div className="text-center py-4">
            <span className="text-gray-400 italic text-sm">No pros/cons available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCardSubRatings;