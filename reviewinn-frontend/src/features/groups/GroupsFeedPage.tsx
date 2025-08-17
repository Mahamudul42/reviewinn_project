import React, { useState } from 'react';
import { 
  Filter, 
  Plus,
  Users,
  Compass,
  MessageSquare,
  Search
} from 'lucide-react';

import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { Button } from '../../shared/design-system/components/Button';
import Badge from '../../shared/ui/Badge';
import GroupFeed from './components/GroupFeed';
import AddReviewStatusBar from '../common/components/AddReviewStatusBar';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';

type TabType = 'reviews' | 'your-groups' | 'discover';

const GroupsFeedPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'recent' | 'following'>('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { user, isAuthenticated } = useUnifiedAuth();

  // Sample user groups data
  const userGroups = [
    {
      id: '1',
      name: 'East West University Alumni',
      description: 'Connect with fellow EWU graduates and share experiences',
      avatar: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop',
      member_count: 2845,
      unread_count: 5,
      is_joined: true,
      recent_activity: '2 hours ago'
    },
    {
      id: '2',
      name: 'Dhaka Food Lovers',
      description: 'Discover the best food places in Dhaka city',
      avatar: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop',
      member_count: 15623,
      unread_count: 12,
      is_joined: true,
      recent_activity: '5 hours ago'
    },
    {
      id: '3',
      name: 'Tech Professionals Bangladesh',
      description: 'Network with tech professionals across Bangladesh',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      member_count: 8934,
      unread_count: 0,
      is_joined: true,
      recent_activity: '1 day ago'
    }
  ];

  // Sample recommended groups
  const recommendedGroups = [
    {
      id: '4',
      name: 'Startup Founders BD',
      description: 'Connect with startup founders and entrepreneurs',
      avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop',
      member_count: 4521,
      category: 'Business',
      mutual_connections: 12,
      is_joined: false
    },
    {
      id: '5',
      name: 'Photography Enthusiasts',
      description: 'Share and discuss photography techniques and tips',
      avatar: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=100&h=100&fit=crop',
      member_count: 7832,
      category: 'Hobbies',
      mutual_connections: 8,
      is_joined: false
    },
    {
      id: '6',
      name: 'Books & Literature Club',
      description: 'Discuss books, share reviews and recommendations',
      avatar: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop',
      member_count: 3245,
      category: 'Education',
      mutual_connections: 5,
      is_joined: false
    }
  ];

  const renderTabContent = () => {
    if (selectedGroupId) {
      // Show specific group content with search bar
      const selectedGroup = userGroups.find(g => g.id === selectedGroupId);
      return (
        <div className="space-y-6">
          {/* Group Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setSelectedGroupId(null)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Groups
              </button>
              <div className="flex items-center space-x-3">
                <img 
                  src={selectedGroup?.avatar} 
                  alt={selectedGroup?.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedGroup?.name}</h2>
                  <p className="text-gray-600">{selectedGroup?.member_count?.toLocaleString()} members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar for Group */}
          <AddReviewStatusBar 
            userAvatar={user?.avatar || 'https://ui-avatars.com/api/?name=User&background=gray&color=ffffff'} 
            userName={user?.name || 'User'} 
            onClick={() => console.log('Add review clicked')}
            barRef={null}
            onSearchResults={() => console.log('Search results')}
          />

          {/* Group Reviews Feed */}
          <GroupFeed />
        </div>
      );
    }

    switch (activeTab) {
      case 'reviews':
        return (
          <div className="space-y-6">
            {/* Reviews Tab Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Group Reviews</h2>
                <p className="text-gray-600 mt-1">
                  Reviews from groups you've joined
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Active Filter Display */}
            <div className="flex items-center space-x-2">
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

            {/* Reviews Feed */}
            <GroupFeed />
          </div>
        );

      case 'your-groups':
        return (
          <div className="space-y-6">
            {/* Your Groups Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Groups</h2>
                <p className="text-gray-600 mt-1">
                  Groups you've joined ({userGroups.length})
                </p>
              </div>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                     onClick={() => setSelectedGroupId(group.id)}>
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img 
                        src={group.avatar} 
                        alt={group.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      {group.unread_count > 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {group.unread_count}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{group.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-500">
                          {group.member_count.toLocaleString()} members
                        </span>
                        <span className="text-xs text-gray-400">
                          {group.recent_activity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'discover':
        return (
          <div className="space-y-6">
            {/* Discover Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Discover Groups</h2>
                <p className="text-gray-600 mt-1">
                  Find groups that match your interests
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Recommended Groups */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Recommended for you</h3>
              <div className="space-y-4">
                {recommendedGroups.map((group) => (
                  <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <img 
                          src={group.avatar} 
                          alt={group.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{group.name}</h3>
                            <Badge variant="outline" size="sm">{group.category}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <span className="text-sm text-gray-500">
                              {group.member_count.toLocaleString()} members
                            </span>
                            <span className="text-sm text-gray-500">
                              {group.mutual_connections} mutual connections
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" className="ml-4">
                        Join Group
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ThreePanelLayout
      leftPanelTitle="🌟 Community Highlights"
      rightPanelTitle="💡 Insights & New Entities"
      pageTitle="Groups"
      showPageHeader={true}
      headerGradient="from-purple-600 via-blue-600 to-indigo-800"
      centerPanelClassName="space-y-6"
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'reviews', label: 'Reviews', icon: MessageSquare },
            { id: 'your-groups', label: 'Your Groups', icon: Users },
            { id: 'discover', label: 'Discover', icon: Compass },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </ThreePanelLayout>
  );
};

export default GroupsFeedPage;