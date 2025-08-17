import React, { useState } from 'react';
import { 
  Filter, 
  Plus
} from 'lucide-react';

import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { Button } from '../../shared/design-system/components/Button';
import Badge from '../../shared/ui/Badge';
import GroupFeed from './components/GroupFeed';

const GroupsFeedPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'recent' | 'following'>('all');

  return (
    <ThreePanelLayout
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Insights & New Entities"
      pageTitle="Groups Feed"
      showPageHeader={true}
      headerGradient="from-purple-600 via-blue-600 to-indigo-800"
      centerPanelClassName="space-y-6"
    >
      {/* Groups Feed Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Groups Feed</h1>
          <p className="text-gray-600 mt-1">
            Stay updated with reviews and discussions from your groups
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Write Review
          </Button>
        </div>
      </div>

      {/* Active Filter Display */}
      <div className="flex items-center space-x-2 mb-6">
        <span className="text-sm text-gray-500">Showing:</span>
        <Badge variant="outline" className="capitalize">
          {activeFilter === 'all' ? 'All Posts' : activeFilter} Posts
        </Badge>
        {activeFilter !== 'all' && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveFilter('all')}
            className="text-xs"
          >
            Clear Filter
          </Button>
        )}
      </div>

      {/* Feed Content */}
      <GroupFeed />
    </ThreePanelLayout>
  );
};

export default GroupsFeedPage;