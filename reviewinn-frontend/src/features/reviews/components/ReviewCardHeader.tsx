import React from 'react';
import { generateInitials, formatTimeAgo } from '../../../shared/utils/reviewUtils';

interface ReviewCardHeaderProps {
  reviewerName: string;
  reviewerAvatar?: string;
  createdAt: string;
  onViewDetailsClick: () => void;
  onMenuClick: () => void;
  onHideClick: () => void;
  menuButtonRef: React.RefObject<HTMLButtonElement>;
  menuOpen: boolean;
  ReviewCardMenu: React.ComponentType<any>;
}

const ReviewCardHeader: React.FC<ReviewCardHeaderProps> = ({
  reviewerName,
  reviewerAvatar,
  createdAt,
  onViewDetailsClick,
  onMenuClick,
  onHideClick,
  menuButtonRef,
  menuOpen,
  ReviewCardMenu
}) => {
  const timeAgo = createdAt ? formatTimeAgo(new Date(createdAt)) : '';

  return (
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        {reviewerAvatar ? (
          <img 
            src={reviewerAvatar} 
            alt={reviewerName} 
            className="w-8 h-8 rounded-full object-cover border border-gray-200" 
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
            {generateInitials(reviewerName)}
          </div>
        )}
        <span className="font-semibold text-base text-gray-900">
          {reviewerName || 'Anonymous'}
        </span>
        <span className="text-sm text-gray-500 italic ml-2">
          {timeAgo}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Enhanced View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetailsClick();
          }}
          className="opacity-60 group-hover:opacity-100 transition-all duration-200 text-blue-600 text-xs font-medium bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-full border border-blue-200 hover:border-blue-300 hover:shadow-sm cursor-pointer"
          title="Click to view full review details"
        >
          📖 View Details
        </button>
        
        <button 
          ref={menuButtonRef} 
          className="w-5 h-5 text-gray-400 hover:text-blue-500 flex items-center justify-center transition-all duration-200 ease-in-out hover:scale-110 hover:bg-gray-100 rounded" 
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
        
        <button 
          className="w-5 h-5 text-gray-400 hover:text-red-500 flex items-center justify-center ml-1 transition-all duration-200 ease-in-out hover:scale-110 hover:bg-gray-100 rounded" 
          title="Hide" 
          onClick={(e) => {
            e.stopPropagation();
            onHideClick();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <ReviewCardMenu 
          open={menuOpen} 
          onClose={() => {}} 
          menuButtonRef={menuButtonRef} 
        />
      </div>
    </div>
  );
};

export default ReviewCardHeader; 