import React from 'react';
import NavBadge from '../atoms/NavBadge';

interface TrendingTopicItemProps {
  label: string;
  count: number;
  trend: string;
}

const TrendingTopicItem: React.FC<TrendingTopicItemProps> = ({ label, count, trend }) => (
  <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 rounded-lg transition-all">
    <div className="flex flex-col">
      <span className="font-medium text-sm text-gray-800">{label}</span>
      <span className="text-xs text-gray-400">{count} reviews</span>
    </div>
    <NavBadge count={trend} colorClass="bg-green-100 text-green-700" />
  </div>
);

export default TrendingTopicItem; 