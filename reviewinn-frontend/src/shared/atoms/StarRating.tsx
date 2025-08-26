import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  style?: 'default' | 'golden' | 'purple';
  disabled?: boolean;
}

// A component that renders a star icon using an inline SVG.
// This ensures the component is self-contained and avoids external dependencies.
const StarIcon: React.FC<{ 
  size: number; 
  color: string; 
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  interactive?: boolean;
}> = ({ size, color, className = '', onClick, onMouseEnter, interactive, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 576 512"
    height={size}
    width={size}
    fill={color}
    className={className}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    style={{ cursor: interactive ? 'pointer' : 'default' }}
    {...props}
  >
    <path d="M316.9 18C324.6 24.6 331.4 32.5 338.8 41.2c16.3 22.4 36.6 63.4 46.2 92.6H496c14.7 0 28 6.9 36.8 19.3s8.8 29.5-0.1 41.5L421.1 292.1c-13.3 14-20.9 33.3-21.6 53.6-0.6 20.3 3.6 40.5 12.3 58.6L465.1 496c4 7.6 2.3 16.9-4.3 22.7s-16.1 5.9-23.7-1.4L288 436.5 138.9 517.3c-7.6 7.2-19.4 6.7-25.7-1.4-6.3-8.2-7.5-20.1-2.2-29.2l39.5-70.2c8.7-18.1 12.9-38.3 12.3-58.6-0.7-20.3-8.3-39.6-21.6-53.6L71.3 209.8c-8.9-12.1-8.9-25.9 0.1-41.5s22.1-19.3 36.8-19.3H200c9.6-29.2 29.9-70.2 46.2-92.6 7.4-8.7 14.2-16.6 21.9-23.2s17.1-10.4 26.6-10.4s19.2 3.7 26.6 10.4z" />
  </svg>
);

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showValue = true,
  interactive = false,
  onRatingChange,
  className = '',
  style = 'golden',
  disabled = false
}) => {
  const [hover, setHover] = useState(0);

  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40
  };
  
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const safeRating = typeof rating === 'number' && !isNaN(rating) && rating >= 0 ? rating : 0;

  // Handles click event on a star
  const handleClick = (starValue: number) => {
    if (interactive && onRatingChange && !disabled) {
      onRatingChange(starValue);
    }
  };

  // Handles mouse enter event on a star
  const handleMouseEnter = (starValue: number) => {
    if (interactive && !disabled) {
      setHover(starValue);
    }
  };

  // Handles mouse leave event on the star container
  const handleMouseLeave = () => {
    if (interactive && !disabled) {
      setHover(0);
    }
  };

  // Get colors based on style and state
  const getStarColor = (starIndex: number) => {
    const starValue = starIndex + 1;
    const isFilled = (hover || safeRating) >= starValue;
    
    if (style === 'golden') {
      return isFilled ? '#A855F7' : '#6B7280'; // Purple-500 for filled, Gray-500 for empty
    } else if (style === 'purple') {
      return isFilled ? '#A855F7' : '#6B7280'; // Purple-500 for filled, Gray-500 for empty
    } else {
      return isFilled ? '#FBBF24' : '#6B7280'; // Yellow-400 for filled, Gray-500 for empty
    }
  };

  // Get container styling based on style prop
  const getContainerStyle = () => {
    if (style === 'golden') {
      return `
        bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl
        ${interactive ? 'transition-all duration-300 transform hover:scale-105' : ''}
        px-4 py-3 flex items-center gap-3
      `;
    } else if (style === 'purple') {
      return 'flex items-center gap-1';
    } else {
      return 'flex items-center gap-1';
    }
  };

  const containerClass = getContainerStyle();

  return (
    <div className={`${containerClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div
        className="flex justify-center items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {/* Loop to render stars */}
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = (hover || safeRating) >= starValue;
          const starColor = getStarColor(index);
          
          return (
            <StarIcon
              key={index}
              size={sizeMap[size]}
              color={starColor}
              className={`
                transition-transform duration-200 ease-in-out
                ${interactive && !disabled ? 'cursor-pointer' : ''}
                ${hover >= starValue && interactive && !disabled ? 'scale-125 drop-shadow-[0_5px_5px_rgba(168,85,247,0.5)]' : ''}
                ${(style === 'golden' || style === 'purple') && isFilled ? 'drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : ''}
              `}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              interactive={interactive && !disabled}
            />
          );
        })}
      </div>
      
      {showValue && (
        <div className="flex items-center">
          <span className={`${textSizeClasses[size]} ${
            style === 'golden' || style === 'purple'
              ? 'font-bold bg-gradient-to-r from-purple-300 to-violet-300 bg-clip-text text-transparent drop-shadow-sm' 
              : 'text-gray-600 font-medium'
          } ml-2`}>
            {typeof rating === 'number' && !isNaN(rating) && rating >= 0 ? safeRating.toFixed(1) : 'N/A'}
          </span>
          {(style === 'golden' || style === 'purple') && (
            <span className="text-purple-300/70 text-xs ml-1 font-semibold">
              /{maxRating}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating; 