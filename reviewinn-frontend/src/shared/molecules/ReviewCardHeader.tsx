import React, { useState } from 'react';
import ReviewCardMenu from './ReviewCardMenu';
import ClaimedBadge from './ClaimedBadge';

interface ReviewCardHeaderProps {
  reviewerName: string;
  reviewerAvatar?: string;
  isVerified?: boolean;
  createdAt: Date | string;
  onHide: () => void;
  claimed?: boolean;
  onMenuClick?: () => void;
}

const ReviewCardHeader: React.FC<ReviewCardHeaderProps> = ({
  reviewerName,
  reviewerAvatar,
  isVerified,
  createdAt,
  onHide,
  claimed = false,
  onMenuClick
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const timeAgo = (dateString: string | Date) => {
    const now = new Date();
    const then = new Date(dateString);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
      { label: 'second', seconds: 1 }
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count > 0) {
        return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };
  return (
    <div className="flex justify-between items-center relative">
      <div className="flex items-center gap-2">
        {reviewerAvatar ? (
          <img src={reviewerAvatar} alt={reviewerName} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-lg">
            {reviewerName ? reviewerName.split(' ').map(n => n[0]).join('').slice(0,2) : 'U'}
          </div>
        )}
        <div>
          <span className="font-semibold text-xs text-gray-900">{reviewerName}</span>
          {isVerified && <span className="ml-1 inline-block align-middle w-3 h-3 bg-green-500 rounded-full" title="Verified"></span>}
          {claimed && <ClaimedBadge />}
          <div className="text-[11px] text-gray-500 italic">{timeAgo(createdAt)}</div>
        </div>
      </div>
      <div className="flex items-center gap-1 absolute top-0 right-0 z-10">
        <button className="w-5 h-5 text-gray-400 hover:text-blue-500 flex items-center justify-center" onClick={() => {
          setMenuOpen((v) => !v);
          onMenuClick?.();
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
            <circle cx="5" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="19" cy="12" r="1.5" />
          </svg>
        </button>
        <button className="w-5 h-5 text-gray-400 hover:text-red-500 flex items-center justify-center ml-1" title="Hide" onClick={onHide}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ReviewCardMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </div>
  );
};

export default ReviewCardHeader; 