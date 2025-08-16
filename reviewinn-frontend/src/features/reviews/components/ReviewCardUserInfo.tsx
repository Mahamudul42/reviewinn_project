import React from 'react';
import { useNavigate } from 'react-router-dom';
import { generateInitials } from '../../../shared/utils/reviewUtils';
import UserHoverCard from '../../../shared/components/UserHoverCard';

interface ReviewCardUserInfoProps {
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerId?: string;
  reviewerUsername?: string;
}

const ReviewCardUserInfo: React.FC<ReviewCardUserInfoProps> = ({
  reviewerName,
  reviewerAvatar,
  reviewerId,
  reviewerUsername
}) => {
  const navigate = useNavigate();
  
  console.log('👤 ReviewCardUserInfo props:', {
    reviewerName,
    reviewerId,
    reviewerUsername,
    hasAvatar: !!reviewerAvatar
  });

  const handleUserClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (reviewerName !== 'Anonymous' && (reviewerUsername || reviewerId)) {
      // Prefer username over ID for cleaner URLs
      const identifier = reviewerUsername || reviewerId;
      console.log('Navigating to profile:', identifier, 'for user:', reviewerName);
      navigate(`/profile/${identifier}`);
    }
  };

  const isClickable = (reviewerUsername || reviewerId) && reviewerName !== 'Anonymous';

  return (
    <UserHoverCard
      userId={reviewerId}
      username={reviewerUsername}
      fallbackName={reviewerName}
      fallbackAvatar={reviewerAvatar}
      delay={300}
    >
      <div 
        className={`flex items-center gap-2 ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={isClickable ? handleUserClick : undefined}
        title={isClickable ? `View ${reviewerName}'s profile` : undefined}
      >
        {reviewerAvatar ? (
          <img 
            src={reviewerAvatar} 
            alt={reviewerName} 
            className={`w-8 h-8 rounded-full object-cover border border-gray-200 ${isClickable ? 'hover:border-blue-300 transition-colors' : ''}`}
          />
        ) : (
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ${isClickable ? 'hover:shadow-md transition-shadow' : ''}`}>
            {generateInitials(reviewerName)}
          </div>
        )}
        <span className={`font-semibold text-sm text-gray-900 ${isClickable ? 'hover:text-blue-600 transition-colors' : ''}`}>
          {reviewerName || 'Anonymous'}
        </span>
      </div>
    </UserHoverCard>
  );
};

export default ReviewCardUserInfo; 