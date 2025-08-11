import React from 'react';

interface RecentlyViewedItemProps {
  name: string;
  type: string;
  rating: number;
  timestamp: string;
}

const RecentlyViewedItem: React.FC<RecentlyViewedItemProps> = ({ name, type, rating, timestamp }) => (
  <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg transition-all">
    <div className="flex flex-col">
      <span className="font-medium text-sm text-gray-800">{name}</span>
      <span className="text-xs text-gray-400">{type} • {timestamp}</span>
    </div>
    <span className="text-xs font-semibold text-yellow-600">★ {rating}</span>
  </div>
);

export default RecentlyViewedItem; 