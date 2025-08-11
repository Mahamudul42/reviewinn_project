import React from 'react';
import RecentlyViewedItem from '../molecules/RecentlyViewedItem';

interface RecentlyViewed {
  name: string;
  type: string;
  rating: number;
  category: string;
  timestamp: string;
}

interface RecentlyViewedListProps {
  items: RecentlyViewed[];
}

const RecentlyViewedList: React.FC<RecentlyViewedListProps> = ({ items }) => (
  <div className="mt-4">
    {items.map(item => (
      <RecentlyViewedItem key={item.name + item.timestamp} {...item} />
    ))}
  </div>
);

export default RecentlyViewedList; 