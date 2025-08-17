import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { Review } from '../../../types';
import StarRating from '../../../shared/atoms/StarRating';

interface RatingBreakdownProps {
  reviews: Review[];
  totalReviews: number;
  averageRating: number;
}

interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export const RatingBreakdown: React.FC<RatingBreakdownProps> = ({
  reviews = [],
  totalReviews = 0,
  averageRating = 0
}) => {
  // Calculate actual rating distribution from reviews
  const ratingDistribution: RatingDistribution = React.useMemo(() => {
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      try {
        const rating = Math.floor(review?.overallRating || 0);
        if (rating >= 1 && rating <= 5) {
          distribution[rating as keyof RatingDistribution]++;
        }
      } catch (error) {
        console.warn('Error processing review rating:', error);
      }
    });

    return distribution;
  }, [reviews]);

  // Color function - TrustPilot style with inline colors to ensure they show up
  const getBarColor = (rating: number, percentage: number): string => {
    if (percentage === 0) return '#E5E7EB'; // gray-200
    
    // Use hex colors to ensure they always work
    switch (rating) {
      case 5:
        return '#10B981';  // Green for excellent (green-500)
      case 4:
        return '#34D399';  // Light green for good (green-400)
      case 3:
        return '#FBBF24';  // Yellow for average (yellow-400)
      case 2:
        return '#F97316';  // Orange for poor (orange-500)
      case 1:
        return '#EF4444';  // Red for terrible (red-500)
      default:
        return '#D1D5DB'; // gray-300
    }
  };

  return (
    <div className="bg-white border-2 border-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Colorful Header */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white drop-shadow-md">Rating Breakdown</h3>
          <div className="ml-auto">
            <span className="text-xl animate-pulse">⭐</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="flex items-start gap-8">
          {/* Overall Rating */}
          <div className="text-center bg-white border-2 border-gray-200 rounded-lg p-6 min-w-[140px] shadow-sm">
            <div className="text-4xl font-bold text-indigo-600 mb-3">
              {averageRating?.toFixed(1) || 'N/A'}
            </div>
            <div className="flex items-center justify-center mb-3">
              <StarRating 
                rating={averageRating || 0} 
                size="lg" 
                showValue={false}
                style="golden"
              />
            </div>
            <div className="text-sm font-medium text-gray-900 mt-3">
              {(() => {
                const actualTotal = reviews.length || totalReviews;
                return `${actualTotal.toLocaleString()} review${actualTotal !== 1 ? 's' : ''}`;
              })()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {(() => {
                const actualTotal = reviews.length || totalReviews;
                return actualTotal > 0 ? 'Verified Reviews' : 'Be the first!';
              })()}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1">
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const actualTotal = reviews.length || totalReviews;
                const percentage = actualTotal > 0 ? (count / actualTotal) * 100 : 0;
                const barColor = getBarColor(rating, percentage);
                
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 min-w-[50px]">
                      <span className="text-sm font-medium text-gray-900 w-2">{rating}</span>
                      <span className="text-base">⭐</span>
                    </div>
                    {/* Progress bar with colored fill and gray background */}
                    <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{ 
                          width: `${percentage}%`, 
                          backgroundColor: barColor,
                          minWidth: percentage > 0 && percentage < 2 ? 6 : undefined 
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 min-w-[80px] justify-end">
                      <span className="text-sm font-medium text-gray-900">{count.toLocaleString()}</span>
                      <span className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="flex justify-center gap-8 mt-6 pt-4 border-t border-gray-300">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                const actualTotal = reviews.length || totalReviews;
                return actualTotal > 0 ? Math.round(((ratingDistribution[5] + ratingDistribution[4]) / actualTotal) * 100) : 0;
              })()}%
            </div>
            <div className="text-sm text-gray-500">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {(() => {
                const actualTotal = reviews.length || totalReviews;
                return actualTotal > 0 ? Math.round((ratingDistribution[3] / actualTotal) * 100) : 0;
              })()}%
            </div>
            <div className="text-sm text-gray-500">Neutral</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {(() => {
                const actualTotal = reviews.length || totalReviews;
                return actualTotal > 0 ? Math.round(((ratingDistribution[2] + ratingDistribution[1]) / actualTotal) * 100) : 0;
              })()}%
            </div>
            <div className="text-sm text-gray-500">Negative</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 