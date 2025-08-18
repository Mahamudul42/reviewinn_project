import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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

type TabType = 'reviews' | 'your-groups' | 'discover' | 'create';

const GroupsFeedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams<{ groupId?: string }>();
  
  const [activeTab, setActiveTab] = useState<TabType>('reviews');
  const [activeFilter, setActiveFilter] = useState<'all' | 'trending' | 'recent' | 'following'>('all');
  const [displayedUserGroups, setDisplayedUserGroups] = useState(3); // Show 3 groups initially
  const [displayedRecommendedGroups, setDisplayedRecommendedGroups] = useState(3); // Show 3 recommended initially
  const [loadingUserGroups, setLoadingUserGroups] = useState(false);
  const [loadingRecommendedGroups, setLoadingRecommendedGroups] = useState(false);
  const { user, isAuthenticated } = useUnifiedAuth();

  // Handle URL-based navigation
  useEffect(() => {
    // If we're on /groups/feed but have a groupId in URL params, navigate to the group
    if (location.pathname === '/groups/feed' && groupId) {
      navigate(`/groups/${groupId}`);
    }
  }, [groupId, location.pathname, navigate]);

  // Sample user groups data (expanded)
  const allUserGroups = [
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
    },
    {
      id: '4',
      name: 'Chittagong Business Network',
      description: 'Connect with business professionals in Chittagong',
      avatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
      member_count: 4521,
      unread_count: 3,
      is_joined: true,
      recent_activity: '3 hours ago'
    },
    {
      id: '5',
      name: 'Cricket Fans Bangladesh',
      description: 'Discuss cricket matches and share experiences',
      avatar: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=100&h=100&fit=crop',
      member_count: 12450,
      unread_count: 8,
      is_joined: true,
      recent_activity: '1 hour ago'
    },
    {
      id: '6',
      name: 'Travel Enthusiasts BD',
      description: 'Share travel experiences and recommendations',
      avatar: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&h=100&fit=crop',
      member_count: 7832,
      unread_count: 2,
      is_joined: true,
      recent_activity: '6 hours ago'
    },
    {
      id: '7',
      name: 'Photography Club Dhaka',
      description: 'Learn and share photography techniques',
      avatar: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=100&h=100&fit=crop',
      member_count: 3245,
      unread_count: 0,
      is_joined: true,
      recent_activity: '2 days ago'
    }
  ];

  const userGroups = allUserGroups.slice(0, displayedUserGroups);

  // Sample recommended groups (expanded)
  const allRecommendedGroups = [
    {
      id: '8',
      name: 'Startup Founders BD',
      description: 'Connect with startup founders and entrepreneurs',
      avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop',
      member_count: 4521,
      category: 'Business',
      mutual_connections: 12,
      is_joined: false
    },
    {
      id: '9',
      name: 'Photography Enthusiasts',
      description: 'Share and discuss photography techniques and tips',
      avatar: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=100&h=100&fit=crop',
      member_count: 7832,
      category: 'Hobbies',
      mutual_connections: 8,
      is_joined: false
    },
    {
      id: '10',
      name: 'Books & Literature Club',
      description: 'Discuss books, share reviews and recommendations',
      avatar: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop',
      member_count: 3245,
      category: 'Education',
      mutual_connections: 5,
      is_joined: false
    },
    {
      id: '11',
      name: 'Digital Marketing Bangladesh',
      description: 'Learn and share digital marketing strategies',
      avatar: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop',
      member_count: 6789,
      category: 'Marketing',
      mutual_connections: 15,
      is_joined: false
    },
    {
      id: '12',
      name: 'Fitness & Wellness BD',
      description: 'Share fitness tips and healthy lifestyle advice',
      avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop',
      member_count: 9234,
      category: 'Health',
      mutual_connections: 7,
      is_joined: false
    },
    {
      id: '13',
      name: 'Mobile App Developers',
      description: 'Discuss mobile app development and share projects',
      avatar: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=100&h=100&fit=crop',
      member_count: 5432,
      category: 'Technology',
      mutual_connections: 20,
      is_joined: false
    }
  ];

  const recommendedGroups = allRecommendedGroups.slice(0, displayedRecommendedGroups);

  // Load more functions
  const handleLoadMoreUserGroups = async () => {
    setLoadingUserGroups(true);
    // Simulate API call
    setTimeout(() => {
      setDisplayedUserGroups(prev => Math.min(prev + 2, allUserGroups.length));
      setLoadingUserGroups(false);
    }, 1000);
  };

  const handleLoadMoreRecommendedGroups = async () => {
    setLoadingRecommendedGroups(true);
    // Simulate API call
    setTimeout(() => {
      setDisplayedRecommendedGroups(prev => Math.min(prev + 2, allRecommendedGroups.length));
      setLoadingRecommendedGroups(false);
    }, 1000);
  };

  const renderTabContent = () => {

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
                     onClick={() => navigate(`/groups/${group.id}`)}>
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

            {/* Load More Button for Your Groups */}
            {displayedUserGroups < allUserGroups.length && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMoreUserGroups}
                  disabled={loadingUserGroups}
                  className="px-8"
                >
                  {loadingUserGroups ? 'Loading...' : `Load More Groups (${allUserGroups.length - displayedUserGroups} remaining)`}
                </Button>
              </div>
            )}
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

              {/* Load More Button for Discover */}
              {displayedRecommendedGroups < allRecommendedGroups.length && (
                <div className="text-center pt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMoreRecommendedGroups}
                    disabled={loadingRecommendedGroups}
                    className="px-8"
                  >
                    {loadingRecommendedGroups ? 'Loading...' : `Show More Groups (${allRecommendedGroups.length - displayedRecommendedGroups} remaining)`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'create':
        return (
          <div className="space-y-6">
            {/* Create Group Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create New Group</h2>
                <p className="text-gray-600 mt-1">
                  Start your own community and connect with like-minded people
                </p>
              </div>
            </div>

            {/* Create Group Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <form className="space-y-6">
                {/* Group Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  
                  {/* Group Name */}
                  <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      id="groupName"
                      name="groupName"
                      placeholder="Enter group name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Group Description */}
                  <div>
                    <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      id="groupDescription"
                      name="groupDescription"
                      rows={4}
                      placeholder="Describe what your group is about, its purpose, and what members can expect"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  {/* Group Category */}
                  <div>
                    <label htmlFor="groupCategory" className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="groupCategory"
                      name="groupCategory"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="business">Business</option>
                      <option value="technology">Technology</option>
                      <option value="education">Education</option>
                      <option value="hobbies">Hobbies</option>
                      <option value="health">Health & Fitness</option>
                      <option value="food">Food & Dining</option>
                      <option value="travel">Travel</option>
                      <option value="sports">Sports</option>
                      <option value="arts">Arts & Culture</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Group Settings */}
                <div className="space-y-4 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900">Group Settings</h3>
                  
                  {/* Privacy Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Privacy *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="privacy"
                          value="public"
                          className="mt-1"
                          defaultChecked
                        />
                        <div>
                          <div className="font-medium text-gray-900">Public</div>
                          <div className="text-sm text-gray-600">Anyone can find and join this group</div>
                        </div>
                      </label>
                      <label className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="privacy"
                          value="private"
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Private</div>
                          <div className="text-sm text-gray-600">People must request to join this group</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Group Rules */}
                  <div>
                    <label htmlFor="groupRules" className="block text-sm font-medium text-gray-700 mb-2">
                      Group Rules (Optional)
                    </label>
                    <textarea
                      id="groupRules"
                      name="groupRules"
                      rows={3}
                      placeholder="Set guidelines for your group members (e.g., be respectful, stay on topic, no spam)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 border-t border-gray-200 pt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setActiveTab('your-groups')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="px-8">
                    Create Group
                  </Button>
                </div>
              </form>
            </div>

            {/* Tips Section */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Tips for Creating a Successful Group</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Choose a clear, descriptive name that tells people what your group is about</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Write a detailed description that explains the group's purpose and what members can expect</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Set clear rules to maintain a positive and focused community environment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Be active and engage with your members to keep the group vibrant</span>
                </li>
              </ul>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
        <nav className="flex space-x-2 p-2 bg-gradient-to-r from-gray-50 via-white to-gray-50">
          {[
            { id: 'reviews', label: 'Reviews', icon: MessageSquare },
            { id: 'your-groups', label: 'Your Groups', icon: Users },
            { id: 'discover', label: 'Discover', icon: Compass },
            { id: 'create', label: 'Create', icon: Plus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`relative flex items-center space-x-3 py-3 px-4 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105 flex-1 justify-center group ${
                activeTab === id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}
              style={activeTab === id ? { 
                boxShadow: '0 10px 25px rgba(147, 51, 234, 0.3), 0 4px 12px rgba(99, 102, 241, 0.2)' 
              } : {}}
            >
              <Icon className={`w-5 h-5 transition-all duration-300 ${activeTab === id ? 'text-white transform rotate-12' : 'group-hover:scale-110'}`} />
              <span className="font-semibold tracking-wide">{label}</span>
              {activeTab === id && (
                <>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/30 rounded-full animate-ping" />
                </>
              )}
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