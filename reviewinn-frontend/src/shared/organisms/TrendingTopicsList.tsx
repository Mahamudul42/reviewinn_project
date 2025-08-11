import React from 'react';
import TrendingTopicItem from '../molecules/TrendingTopicItem';

interface TrendingTopic {
  label: string;
  count: number;
  trend: string;
}

interface TrendingTopicsListProps {
  topics: TrendingTopic[];
}

const TrendingTopicsList: React.FC<TrendingTopicsListProps> = ({ topics }) => (
  <div className="mt-4">
    {topics.map(topic => (
      <TrendingTopicItem key={topic.label} {...topic} />
    ))}
  </div>
);

export default TrendingTopicsList; 