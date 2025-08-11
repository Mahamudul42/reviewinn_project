import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FloatingGiveReviewButtonProps {
  entityId?: string;
  className?: string;
}

const FloatingGiveReviewButton: React.FC<FloatingGiveReviewButtonProps> = ({ 
  entityId,
  className = '' 
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (entityId) {
      // Navigate to review page for specific entity
      navigate(`/review/${entityId}`);
    } else {
      // Navigate to entity selection page or search
      navigate('/search');
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
        style={{
          width: isHovered ? 'auto' : '56px',
          height: '56px',
          minWidth: '56px',
          paddingLeft: isHovered ? '16px' : '0',
          paddingRight: isHovered ? '16px' : '0',
        }}
        title={entityId ? "Write a review for this entity" : "Write a review"}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-6 h-6 mr-0 group-hover:mr-2 transition-all duration-300">
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4v16m8-8H4" 
            />
          </svg>
        </div>
        
        {/* Expandable Text */}
        <span 
          className={`whitespace-nowrap font-medium text-sm transition-all duration-300 ${
            isHovered ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden'
          }`}
        >
          Give Review
        </span>

        {/* Pulse animation for attention */}
        <div className="absolute inset-0 rounded-full bg-blue-600 opacity-30 animate-ping"></div>
      </button>

      {/* Tooltip for mobile or when not expanded */}
      {!isHovered && (
        <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {entityId ? "Write review" : "Give a review"}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default FloatingGiveReviewButton;