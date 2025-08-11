import React, { useState } from 'react';
import StarRating from '../atoms/StarRating';

interface RatingCriteriaProps {
  id: string;
  name: string;
  description: string;
  maxRating: number;
  isRequired: boolean;
  currentRating: number;
  onRatingChange: (criteriaId: string, rating: number) => void;
  className?: string;
}

const RatingCriteria: React.FC<RatingCriteriaProps> = ({
  id, name, description, maxRating, isRequired, currentRating, onRatingChange, className = ''
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const displayRating = hoveredRating || currentRating;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-900">
            {name} {isRequired && '*'}
          </label>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      
      <div 
        className="flex space-x-1 mt-2"
        onMouseLeave={() => setHoveredRating(0)}
      >
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          return (
            <StarRating
              key={index}
              value={starValue}
              maxValue={maxRating}
              isActive={starValue <= displayRating}
              onClick={() => onRatingChange(id, starValue)}
              onMouseEnter={() => setHoveredRating(starValue)}
            />
          );
        })}
        <span className="ml-2 text-sm text-gray-600">
          {displayRating > 0 ? `${displayRating}/${maxRating}` : 'Not rated'}
        </span>
      </div>
    </div>
  );
};

export default RatingCriteria; 