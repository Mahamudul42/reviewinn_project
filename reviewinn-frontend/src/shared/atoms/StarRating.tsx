import React from 'react';

// Add custom CSS for shimmer animation
const shimmerStyle = `
  @keyframes shimmer {
    0% { transform: translateX(-100%) skewX(-12deg); }
    100% { transform: translateX(200%) skewX(-12deg); }
  }
`;

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

const StarIcon: React.FC<{ 
  filled: boolean; 
  halfFilled: boolean; 
  size: number; 
  interactive: boolean;
  onClick: () => void;
}> = ({ filled, halfFilled, size, interactive, onClick }) => {
  const gradientId = `star-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div 
      className={`inline-block ${interactive ? 'cursor-pointer transform transition-all duration-300 hover:scale-125 hover:rotate-12 hover:drop-shadow-2xl' : ''} ${filled ? 'animate-in fade-in duration-500' : ''}`}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`drop-shadow-md transition-all duration-300 ${filled ? 'filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : ''}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#9333EA" />
          </linearGradient>
          <linearGradient id={`${gradientId}-half`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        
        <path
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill={filled ? `url(#${gradientId})` : halfFilled ? `url(#${gradientId}-half)` : 'none'}
          stroke={filled || halfFilled ? '#C084FC' : '#D1D5DB'}
          strokeWidth="1"
          className={`transition-all duration-300 ${
            filled ? 'drop-shadow-md' : halfFilled ? 'drop-shadow-sm' : ''
          }`}
        />
        
        {filled && (
          <circle
            cx="12"
            cy="10"
            r="1"
            fill="#F3E8FF"
            opacity="0.8"
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
};

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
  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32
  };
  
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const safeRating = typeof rating === 'number' && !isNaN(rating) && rating >= 0 ? rating : 0;

  const handleStarClick = (starValue: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starValue);
    }
  };

  const starContainer = style === 'golden' 
    ? 'flex items-center gap-1 px-4 py-2.5 bg-gradient-to-r from-purple-50/80 via-violet-50/70 to-fuchsia-50/60 border border-purple-200/40 rounded-2xl shadow-lg backdrop-blur-md relative overflow-hidden'
    : 'flex items-center space-x-1';

  const wrapper = style === 'golden'
    ? 'inline-block bg-gradient-to-br from-purple-100/20 via-violet-100/30 to-fuchsia-100/20 rounded-3xl p-[2px] shadow-xl backdrop-blur-lg relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-400/50 before:via-violet-400/50 before:to-fuchsia-400/50 before:rounded-3xl before:opacity-60 hover:before:opacity-100 before:transition-opacity before:duration-500'
    : '';

  const innerWrapper = style === 'golden'
    ? 'bg-white/80 backdrop-blur-sm rounded-3xl p-1 relative z-10'
    : '';

  return (
    <>
      {/* Inject shimmer animation CSS */}
      <style dangerouslySetInnerHTML={{ __html: shimmerStyle }} />
      
      <div className={`${wrapper} ${className} group relative`}>
        {/* Awesome background glow effect */}
        {style === 'golden' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-violet-400/20 to-fuchsia-400/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
            <div className="absolute top-2 left-2 w-2 h-2 bg-purple-300/40 rounded-full blur-sm animate-pulse z-20"></div>
            <div className="absolute bottom-3 right-3 w-1 h-1 bg-violet-400/50 rounded-full blur-sm animate-pulse delay-1000 z-20"></div>
          </>
        )}
        
        <div className={innerWrapper}>
          <div className={starContainer}>
        {/* Decorative shimmer effect */}
        {style === 'golden' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_ease-in-out] transition-opacity duration-300"></div>
        )}
        
        <div className="flex items-center gap-0.5 relative z-10">
          {Array.from({ length: maxRating }, (_, index) => {
            const starValue = index + 1;
            const isFilled = starValue <= safeRating;
            const isHalfFilled = !isFilled && starValue - safeRating < 1 && starValue - safeRating > 0;
            
            return (
              <StarIcon
                key={starValue}
                filled={isFilled}
                halfFilled={isHalfFilled}
                size={sizeMap[size]}
                interactive={interactive}
                onClick={() => handleStarClick(starValue)}
              />
            );
          })}
        </div>
        
        {showValue && (
          <div className="flex items-center ml-3 relative">
            {/* Glowing background for rating text */}
            {style === 'golden' && (
              <div className="absolute inset-0 bg-purple-500/10 rounded-lg blur-sm scale-110"></div>
            )}
            <span className={`${textSizeClasses[size]} ${
              style === 'golden' 
                ? 'font-extrabold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-700 bg-clip-text text-transparent drop-shadow-sm relative z-10' 
                : 'text-gray-600 font-medium'
            }`}>
              {typeof rating === 'number' && !isNaN(rating) && rating >= 0 ? safeRating.toFixed(1) : 'N/A'}
            </span>
            {style === 'golden' && (
              <span className="text-purple-500/70 text-xs ml-1 font-semibold relative z-10">
                /{maxRating}
              </span>
            )}
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StarRating; 