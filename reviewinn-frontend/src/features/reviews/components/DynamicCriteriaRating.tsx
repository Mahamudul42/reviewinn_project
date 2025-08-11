import React from 'react';
import type { CriteriaConfig } from '../../../types';

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[...Array(maxRating)].map((_, index) => {
          const ratingValue = index + 1;
          const isActive = ratingValue <= currentRating;
          
          return (
            <button
              key={index}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                padding: '4px',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                fontSize: '24px',
                lineHeight: '1',
                opacity: disabled ? 0.6 : 1,
                transform: 'scale(1)',
              }}
              onClick={() => !disabled && onRatingChange(criteriaId, ratingValue)}
              disabled={disabled}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.backgroundColor = 'rgba(251, 191, 36, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span
                style={{
                  filter: isActive 
                    ? 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.8))' 
                    : 'grayscale(100%) opacity(0.3)',
                  transition: 'filter 0.2s ease',
                  display: 'inline-block'
                }}
              >
                ⭐
              </span>
            </button>
          );
        })}
        <span style={{
          marginLeft: '8px',
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500'
        }}>
          {currentRating > 0 ? `${currentRating}/${maxRating}` : 'Not rated'}
        </span>
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