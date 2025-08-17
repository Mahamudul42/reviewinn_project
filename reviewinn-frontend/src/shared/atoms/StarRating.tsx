import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  style?: 'default' | 'golden';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showValue = true,
  interactive = false,
  onRatingChange,
  className = '',
  style = 'golden'
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  // Ensure rating is a valid number >= 0
  const safeRating = typeof rating === 'number' && !isNaN(rating) && rating >= 0 ? rating : 0;

  const handleStarClick = (starValue: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const starContainer = style === 'golden' 
    ? 'flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full shadow-sm'
    : 'flex items-center space-x-0.5';

  const wrapper = style === 'golden'
    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-2 border border-yellow-200'
    : '';

  return (
    <div className={`${wrapper} ${className}`}>
      <div className={starContainer}>
        {Array.from({ length: maxRating }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= safeRating;
          const isHalfFilled = !isFilled && starValue - safeRating < 1 && starValue - safeRating > 0;
          
          return (
            <span
              key={starValue}
              className={`${sizeClasses[size]} ${
                interactive ? 'cursor-pointer hover:scale-110 transition-transform duration-200' : ''
              }`}
              onClick={() => handleStarClick(starValue)}
              role="img"
              aria-label={isFilled ? 'filled star' : isHalfFilled ? 'half-filled star' : 'empty star'}
              style={{
                display: 'inline-block',
                lineHeight: '1',
                filter: isFilled ? 'none' : isHalfFilled ? 'grayscale(50%) opacity(0.7)' : 'grayscale(100%) opacity(0.3)',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              ⭐
            </span>
          );
        })}
        {showValue && (
          <span className={`${textSizeClasses[size]} ${style === 'golden' ? 'text-yellow-900 ml-2 font-bold' : 'text-gray-600 ml-2 font-medium'}`}>
            {typeof rating === 'number' && !isNaN(rating) && rating >= 0 ? safeRating.toFixed(1) : 'N/A'}
          </span>
        )}
      </div>
    </div>
  );
};

export default StarRating; 