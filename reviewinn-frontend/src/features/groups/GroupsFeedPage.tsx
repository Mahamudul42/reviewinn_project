import React, { useState, useEffect, useCallback } from 'react';
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
// import AddReviewStatusBar from '../common/components/AddReviewStatusBar'; // Not used in current implementation
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import GroupCreationForm, { GroupFormData } from './components/GroupCreationForm';
import { imageUploadService } from './services/imageUploadService';
import { apiRequest, API_ENDPOINTS } from '../../config/api';
import { useShowToast } from '../../stores/uiStore';

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
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [userGroups, setUserGroups] = useState<Array<{
    id: string;
    name: string;
    description: string;
    avatar: string;
    member_count: number;
    unread_count: number;
    is_joined: boolean;
    recent_activity: string;
  }>>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<Array<{
    id: string;
    name: string;
    description: string;
    avatar: string;
    member_count: number;
    category: string;
    mutual_connections: number;
    is_joined: boolean;
  }>>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const { user, isAuthenticated } = useUnifiedAuth();
  const { showSuccess, showError } = useShowToast();

  // Handle URL-based navigation
  useEffect(() => {
    // If we're on /groups/feed but have a groupId in URL params, navigate to the group
    if (location.pathname === '/groups/feed' && groupId) {
      navigate(`/groups/${groupId}`);
    }
  }, [groupId, location.pathname, navigate]);

  // Fetch user's groups from API
  const fetchUserGroups = async () => {
    if (!isAuthenticated) {
      setUserGroups([]);
      setLoadingGroups(false);
      return;
    }

    try {
      setLoadingGroups(true);
      const response = await apiRequest(API_ENDPOINTS.groups.list + '?user_groups_only=true&size=50');
      
      if (response.data && Array.isArray(response.data)) {
        // Transform API response to match component expectations
        const transformedGroups = response.data.map((group: Record<string, unknown>) => ({
          id: (group.group_id as number).toString(),
          name: group.name as string,
          description: group.description as string,
          avatar: (group.avatar_url as string) || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop',
          member_count: (group.member_count as number) || 0,
          unread_count: Math.floor(Math.random() * 10), // TODO: Get real unread count from API
          is_joined: true,
          recent_activity: new Date(group.updated_at as string).toLocaleDateString()
        }));
        setUserGroups(transformedGroups);
      }
    } catch {
      // Log error for debugging in development
      setUserGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  // Fetch recommended groups
  const fetchRecommendedGroups = useCallback(async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.groups.list + '?size=20');
      
      if (response.data && Array.isArray(response.data)) {
        // Transform and filter out user's groups
        const userGroupIds = userGroups.map(g => g.id);
        const transformedGroups = response.data
          .filter((group: Record<string, unknown>) => !userGroupIds.includes((group.group_id as number).toString()))
          .map((group: Record<string, unknown>) => ({
            id: (group.group_id as number).toString(),
            name: group.name as string,
            description: group.description as string,
            avatar: (group.avatar_url as string) || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop',
            member_count: (group.member_count as number) || 0,
            category: (group.group_type as string) || 'General',
            mutual_connections: Math.floor(Math.random() * 20), // TODO: Get real mutual connections
            is_joined: false
          }));
        setRecommendedGroups(transformedGroups);
      }
    } catch {
      // Log error for debugging in development
      setRecommendedGroups([]);
    }
  }, [userGroups]);

  // Load groups when component mounts or user authentication changes
  useEffect(() => {
    fetchUserGroups();
  }, [isAuthenticated, user]);

  // Load recommended groups after user groups are loaded
  useEffect(() => {
    const loadRecommendedGroups = async () => {
      if (!loadingGroups && userGroups.length >= 0) {
        await fetchRecommendedGroups();
      }
    };
    loadRecommendedGroups();
  }, [loadingGroups, userGroups, fetchRecommendedGroups]);

  const displayedUserGroupsData = userGroups.slice(0, displayedUserGroups);

  const displayedRecommendedGroupsData = recommendedGroups.slice(0, displayedRecommendedGroups);

  // Load more functions
  const handleLoadMoreUserGroups = async () => {
    setLoadingUserGroups(true);
    // Simulate API call
    setTimeout(() => {
      setDisplayedUserGroups(prev => Math.min(prev + 2, userGroups.length));
      setLoadingUserGroups(false);
    }, 1000);
  };

  const handleLoadMoreRecommendedGroups = async () => {
    setLoadingRecommendedGroups(true);
    // Simulate API call
    setTimeout(() => {
      setDisplayedRecommendedGroups(prev => Math.min(prev + 2, recommendedGroups.length));
      setLoadingRecommendedGroups(false);
    }, 1000);
  };

  // Image upload function using the real service
  const uploadImage = async (file: File, type: 'profile' | 'cover'): Promise<string> => {
    try {
      const result = await imageUploadService.uploadImage(file, type);
      return result.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Fallback to local preview URL for demo purposes
      return imageUploadService.createPreviewUrl(file);
    }
  };

  // Handle group creation
  const handleCreateGroup = async (formData: GroupFormData) => {
    setIsCreatingGroup(true);
    
    try {
      // Upload images if they exist
      let avatarUrl = formData.profileImageUrl;
      let coverImageUrl = formData.coverImageUrl;
      
      if (formData.profileImage) {
        avatarUrl = await uploadImage(formData.profileImage, 'profile');
      }
      
      if (formData.coverImage) {
        coverImageUrl = await uploadImage(formData.coverImage, 'cover');
      }

      // Map category names to IDs
      const categoryMapping: {[key: string]: number} = {
        'education': 1,
        'technology': 2,
        'health': 3,
        'business': 4,
        'location': 5,
        'hobbies': 6,
        'interest_based': 6,
        'sports': 7,
        'arts': 8,
        'food': 4,
        'travel': 5,
        'lifestyle': 6,
        'other': 6
      };

      // Prepare group data for API call
      const groupData = {
        name: formData.name,
        description: formData.description,
        group_type: 'interest_based',
        visibility: formData.privacy,
        avatar_url: avatarUrl,
        cover_image_url: coverImageUrl,
        rules_and_guidelines: formData.rules,
        allow_public_reviews: true,
        require_approval_for_reviews: formData.privacy === 'private',
        category_ids: formData.category ? [categoryMapping[formData.category] || 6] : [6]
      };

      // Make API call to create group
      const response = await apiRequest(API_ENDPOINTS.groups.create, {
        method: 'POST',
        body: JSON.stringify(groupData)
      });
      
      // Group created successfully
      showSuccess('Group Created!', 'Your group has been created successfully and you can now start inviting members.');
      // Refresh user groups list
      await fetchUserGroups();
      setActiveTab('your-groups');
      
    } catch {
      // Handle error
      showError('Failed to Create Group', 'Something went wrong while creating your group. Please try again.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleCancelGroupCreation = () => {
    setActiveTab('your-groups');
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
              <Badge variant="default" className="capitalize">
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
                  {loadingGroups ? 'Loading...' : `Groups you've joined (${userGroups.length})`}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('create')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-4 py-2 text-sm inline-flex items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Create Group</span>
              </button>
            </div>

            {/* Groups Grid */}
            {loadingGroups ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading your groups...</p>
              </div>
            ) : userGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven't joined any groups yet.</p>
                <button 
                  onClick={() => setActiveTab('discover')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg px-6 py-3 inline-flex items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <span>Discover Groups</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedUserGroupsData.map((group) => (
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
            )}

            {/* Load More Button for Your Groups */}
            {!loadingGroups && displayedUserGroups < userGroups.length && (
              <div className="text-center pt-6">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMoreUserGroups}
                  disabled={loadingUserGroups}
                  className="px-8"
                >
                  {loadingUserGroups ? 'Loading...' : `Load More Groups (${userGroups.length - displayedUserGroups} remaining)`}
                </Button>
              </div>
            )}
          </div>
        );

      case 'discover':
        return (
          <div className="space-y-6">
            {/* Discover Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Discover Groups</h2>
                <p className="text-gray-600 mt-1">
                  Find groups that match your interests
                </p>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-full sm:w-64"
                  />
                </div>
                
                {/* Filter Dropdown */}
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white">
                  <option value="">All Categories</option>
                  <option value="university">University</option>
                  <option value="company">Company</option>
                  <option value="location">Location</option>
                  <option value="interest">Interest-Based</option>
                </select>
                
                {/* Sort Dropdown */}
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white">
                  <option value="members">Most Members</option>
                  <option value="activity">Most Active</option>
                  <option value="recent">Recently Created</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Tags */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Quick filters:</span>
              {['Popular', 'New', 'Local', 'Tech', 'Business', 'Education'].map((filter) => (
                <button
                  key={filter}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-colors duration-200"
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Recommended Groups */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Recommended for you</h3>
              <div className="space-y-4">
                {displayedRecommendedGroupsData.map((group) => (
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
              {displayedRecommendedGroups < recommendedGroups.length && (
                <div className="text-center pt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleLoadMoreRecommendedGroups}
                    disabled={loadingRecommendedGroups}
                    className="px-8"
                  >
                    {loadingRecommendedGroups ? 'Loading...' : `Show More Groups (${recommendedGroups.length - displayedRecommendedGroups} remaining)`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'create':
        return (
          <GroupCreationForm
            onSubmit={handleCreateGroup}
            onCancel={handleCancelGroupCreation}
            isLoading={isCreatingGroup}
          />
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
        <nav className="flex space-x-2 p-2 bg-gray-50">
          {[
            { id: 'reviews', label: 'Reviews', icon: MessageSquare },
            { id: 'your-groups', label: 'Your Groups', icon: Users },
            { id: 'discover', label: 'Discover', icon: Compass },
            { id: 'create', label: 'Create', icon: Plus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as TabType)}
              className={`flex items-center space-x-3 py-3 px-4 rounded-lg font-semibold text-sm transition-colors duration-200 flex-1 justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                activeTab === id
                  ? 'bg-purple-600 !text-white hover:bg-purple-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${activeTab === id ? '!text-white' : ''}`} />
              <span className={activeTab === id ? '!text-white' : ''}>{label}</span>
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