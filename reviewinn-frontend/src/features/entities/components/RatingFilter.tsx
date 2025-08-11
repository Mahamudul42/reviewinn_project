import React from 'react';
import { Star } from 'lucide-react';

interface RatingFilterProps {
  reviews: any[];
  selectedRating: number | 'all';
  onRatingChange: (rating: number | 'all') => void;
  disabled?: boolean;
}

const RatingFilter: React.FC<RatingFilterProps> = ({
  reviews,
  selectedRating,
  onRatingChange,
  disabled = false
}) => {
  // Calculate rating distribution
  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    reviews.forEach(review => {
      const rating = Math.floor(review.overallRating || 0);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });
    
    return distribution;
  };

  const distribution = getRatingDistribution();
  const totalReviews = reviews.length;

  const getPercentage = (count: number) => {
    return totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500 rounded-lg">
          <Star className="h-5 w-5 text-white fill-current" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-black">Filter by Rating</h3>
          <p className="text-sm text-gray-500">
            {selectedRating === 'all' ? 'Showing all reviews' : `Showing ${selectedRating}-star reviews`}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* All Reviews Option */}
        <button
          onClick={() => onRatingChange('all')}
          disabled={disabled}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
            selectedRating === 'all'
              ? 'bg-blue-50 border-2 border-blue-200 text-blue-700'
              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">All Reviews</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{totalReviews}</span>
          </div>
        </button>

        {/* Individual Star Ratings */}
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = distribution[rating as keyof typeof distribution];
          const percentage = getPercentage(count);
          
          return (
            <button
              key={rating}
              onClick={() => onRatingChange(rating)}
              disabled={disabled || count === 0}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                selectedRating === rating
                  ? 'bg-blue-50 border-2 border-blue-200 text-blue-700'
                  : count === 0
                  ? 'bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{rating} Star{rating !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Progress bar */}
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      rating === 5 ? 'bg-green-500' :
                      rating === 4 ? 'bg-lime-500' :
                      rating === 3 ? 'bg-yellow-500' :
                      rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {/* Count and percentage */}
                <div className="flex items-center gap-1 min-w-[3rem]">
                  <span className="text-sm font-semibold">{count}</span>
                  <span className="text-xs text-gray-500">({percentage}%)</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedRating !== 'all' && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>{distribution[selectedRating as keyof typeof distribution]}</strong> reviews with {selectedRating} star{selectedRating !== 1 ? 's' : ''} out of {totalReviews} total reviews
          </p>
        </div>
      )}
    </div>
  );
};

export default RatingFilter; 