import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

interface AddReviewBarProps {
  userName: string;
  userAvatar: string;
  onClick: () => void;
}

const AddReviewBar = forwardRef<HTMLDivElement, AddReviewBarProps>(({ userName, userAvatar, onClick }, ref) => {
  return (
    <div
      ref={ref}
      className="flex items-center bg-white rounded-full shadow border border-gray-200 px-2 py-1 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all gap-3 w-full min-h-[52px]"
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`Add a review as ${userName}`}
    >
      <img
        src={userAvatar}
        alt={userName}
        className="w-10 h-10 rounded-full object-cover border border-gray-300"
      />
      <div className="flex flex-col flex-1 justify-center">
        <div className="flex items-center">
          <Search className="h-5 w-5 text-blue-500 mr-2" />
          <span className="text-gray-700 text-[16px] font-medium select-none opacity-90">
            What would you like to review today, {userName}?
          </span>
        </div>
      </div>
    </div>
  );
});

export default AddReviewBar; 