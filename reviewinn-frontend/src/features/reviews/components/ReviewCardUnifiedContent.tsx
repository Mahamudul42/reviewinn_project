import React from 'react';
import StarRating from '../../../shared/atoms/StarRating';
import { truncateContent } from '../../../shared/utils/reviewUtils';
import type { Review } from '../../../types';

interface ReviewCardUnifiedContentProps {
  review: Review;
  onTitleClick: () => void;
}

const ReviewCardUnifiedContent: React.FC<ReviewCardUnifiedContentProps> = ({
  review,
  onTitleClick
}) => {
  const { truncated, needsTruncation } = truncateContent(review.content);

  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:bg-gray-50"
      onClick={onTitleClick}
      title="Click to view full review details"
    >
      {/* Review Title */}
      {review.title && (
        <div className="mb-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-200 inline-flex items-center gap-2 group flex-1">
              <span>{review.title}</span>
              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </h3>
          </div>
        </div>
      )}

      {/* Review Rating */}
      <div className="mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <div className="flex-1">
            <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <span className="text-sm text-blue-700 font-medium">Overall Score:</span>
              <StarRating 
                rating={review.overallRating} 
                size="sm" 
                showValue={true} 
                interactive={false} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="flex-1">
            <div className="text-base text-gray-700 leading-relaxed">
              {truncated}
            </div>
            
            {needsTruncation && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onTitleClick();
                }} 
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200 mt-2"
              >
                See more in full review →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCardUnifiedContent; 