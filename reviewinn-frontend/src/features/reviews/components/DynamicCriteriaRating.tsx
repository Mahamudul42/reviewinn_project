import React from 'react';
import type { CriteriaConfig } from '../../../types';
import StarRating from '../../../shared/atoms/StarRating';

interface DynamicCriteriaRatingProps {
  criteria: CriteriaConfig[];
  ratings: Record<string, number>;
  onRatingChange: (criteriaId: string, rating: number) => void;
  disabled?: boolean;
}

export const DynamicCriteriaRating: React.FC<DynamicCriteriaRatingProps> = ({
  criteria,
  ratings,
  onRatingChange,
  disabled = false
}) => {
  const renderStars = (criteriaId: string, maxRating: number, currentRating: number) => {
    return (
      <div className="flex items-center gap-2">
        <StarRating
          rating={currentRating}
          maxRating={maxRating}
          size="md"
          showValue={true}
          style="golden"
          onRatingChange={(rating) => !disabled && onRatingChange(criteriaId, rating)}
          disabled={disabled}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Rate Your Experience
      </h3>
      
      {criteria.map((criterion) => (
        <div key={criterion.id} className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900">
                {criterion.name}
                {criterion.isRequired && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h4>
              {criterion.description && (
                <p className="text-xs text-gray-600 mt-1">
                  {criterion.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {renderStars(
              criterion.id,
              criterion.maxRating,
              ratings[criterion.id] || 0
            )}
          </div>
          
          {criterion.isRequired && !ratings[criterion.id] && (
            <p className="text-xs text-red-500">This rating is required</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default DynamicCriteriaRating;