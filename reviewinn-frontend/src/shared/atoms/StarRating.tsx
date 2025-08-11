import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showValue = true,
  interactive = false,
  onRatingChange,
  className = ''
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

  return (
    <div className={`flex items-center space-x-0.5 ${className}`}>
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
        <span className={`${textSizeClasses[size]} text-gray-600 ml-2 font-medium`}>
          {typeof rating === 'number' && !isNaN(rating) && rating >= 0 ? safeRating.toFixed(1) : 'N/A'}
        </span>
      )}
    </div>
  );
};

export default StarRating; 