/**
 * Unified Groups Page - Facebook-style groups interface
 * Combines all group functionality into one coherent component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Compass, Search } from 'lucide-react';

import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { Button } from '../../shared/design-system/components/Button';
import GroupCreationForm, { GroupFormData } from './components/GroupCreationForm';
import { useUnifiedAuth } from '../../hooks/useUnifiedAuth';
import { imageUploadService } from './services/imageUploadService';
import { useShowToast } from '../../stores/uiStore';

type TabType = 'your-groups' | 'discover' | 'create';

interface Group {
  group_id: number;
  name: string;
  description: string;
  avatar_url?: string;
  cover_image_url?: string;
  visibility: string;
  member_count: number;
  group_type: string;
  created_at?: string;
  updated_at?: string;
}

// Unified API request function with proper error handling
const apiRequest = async (method: string, url: string, body?: any): Promise<any> => {
  const token = localStorage.getItem('reviewinn_jwt_token');
  
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  };

  console.log(`🔗 API ${method} request to:`, url);
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  
  const data = await response.json();
  console.log(`✅ API response:`, data);
  return data;
};

// Helper to create group with proper image upload
const createGroup = async (formData: GroupFormData): Promise<any> => {
  try {
    console.log('🔄 Creating group:', formData.name);
    
    // Upload images if they exist
    let avatarUrl = formData.profileImageUrl;
    let coverImageUrl = formData.coverImageUrl;
    
    if (formData.profileImage) {
      const avatarResponse = await imageUploadService.uploadImage(formData.profileImage, 'profile');
      avatarUrl = avatarResponse.url;
    }
    
    if (formData.coverImage) {
      const coverResponse = await imageUploadService.uploadImage(formData.coverImage, 'cover');
      coverImageUrl = coverResponse.url;
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

    const groupData = {
      name: formData.name,
      description: formData.description,
      group_type: 'interest_based', // Default type
      visibility: formData.privacy === 'public' ? 'public' : 'private',
      category_id: categoryMapping[formData.category] || 6,
      max_members: 100, // Default max members
      avatar_url: avatarUrl,
      cover_image_url: coverImageUrl,
      guidelines: formData.rules // Use rules field for guidelines
    };

    console.log('📤 Sending group data:', groupData);
    const result = await apiRequest('POST', '/api/v1/groups/', groupData);
    console.log('✅ Group created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error creating group:', error);
    throw error;
  }
};

const UnifiedGroupsPage: React.FC = () => {
  const { isAuthenticated } = useUnifiedAuth();
  const { showSuccess, showError } = useShowToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper to fetch groups with proper error handling
  const fetchGroups = useCallback(async (userGroupsOnly = false): Promise<Group[]> => {
    try {
      const params = new URLSearchParams({
        size: userGroupsOnly ? '50' : '20',
        ...(userGroupsOnly && { user_groups_only: 'true' })
      });
      
      const url = `/api/v1/groups/?${params}`;
      const data = await apiRequest('GET', url);
      const groups = data.data || [];
      
      return groups;
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      return [];
    }
  }, []);

  // Helper to refresh all groups data
  const refreshGroupsData = useCallback(async () => {
    console.log('🔄 Refreshing all groups data...');
    try {
      const [userGroupsData, publicGroupsData] = await Promise.all([
        isAuthenticated ? fetchGroups(true) : Promise.resolve([]),
        fetchGroups(false)
      ]);
      
      console.log('📊 Refreshed groups:', { 
        userGroups: userGroupsData.length, 
        publicGroups: publicGroupsData.length 
      });
      
      setUserGroups(userGroupsData);
      setPublicGroups(publicGroupsData);
      
      return { userGroups: userGroupsData, publicGroups: publicGroupsData };
    } catch (error) {
      console.error('❌ Error refreshing groups:', error);
      throw error;
    }
  }, [isAuthenticated, fetchGroups]);

  // Filter out groups that user has already joined
  const availablePublicGroups = publicGroups.filter(
    publicGroup => !userGroups.some(userGroup => userGroup.group_id === publicGroup.group_id)
  );

  // Filter groups by search query
  const filteredPublicGroups = availablePublicGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load groups once when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const loadGroups = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      try {
        const [userGroupsData, publicGroupsData] = await Promise.all([
          isAuthenticated ? fetchGroups(true) : Promise.resolve([]),
          fetchGroups(false)
        ]);
        
        if (!isMounted) return;
        
        setUserGroups(userGroupsData);
        setPublicGroups(publicGroupsData);
      } catch (error) {
        console.error('Failed to load groups:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGroups();
    
    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  const handleCreateGroup = async (formData: GroupFormData) => {
    setIsCreatingGroup(true);
    
    try {
      await createGroup(formData);
      showSuccess('Group Created!', 'Your group has been created successfully.');
      
      // Add small delay to ensure backend processing is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh groups using helper function
      await refreshGroupsData();
      setActiveTab('your-groups');
      
    } catch (error: any) {
      console.error('Failed to create group:', error);
      showError('Failed to Create Group', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!isAuthenticated) {
      showError('Authentication Required', 'Please log in to join groups.');
      return;
    }

    setJoiningGroupId(groupId);
    try {
      console.log('🎯 Joining group:', groupId);
      
      let isAlreadyMember = false;
      try {
        await apiRequest('POST', `/api/v1/groups/${groupId}/join`);
        console.log('✅ Successfully joined group:', groupId);
      } catch (error: any) {
        if (error.message.includes('Already a member')) {
          console.log('ℹ️ User is already a member, continuing...');
          isAlreadyMember = true;
        } else {
          throw error;
        }
      }
      
      // Force refresh groups data with a small delay to ensure backend update is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      await refreshGroupsData();
      
      if (isAlreadyMember) {
        showSuccess('Already a Member', 'You are already part of this group.');
      } else {
        showSuccess('Joined Group!', 'You have successfully joined the group.');
      }
      
      // Switch to "Your Groups" tab to show the result
      setActiveTab('your-groups');
      
    } catch (error: any) {
      console.error('❌ Error joining group:', error);
      showError('Failed to Join Group', error.message || 'Something went wrong. Please try again.');
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleCancelGroupCreation = () => {
    setActiveTab('discover');
  };

  // Generate avatar initials
  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'your-groups':
        return (
          <div className="space-y-6">
            {/* Your Groups Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Groups</h2>
                <p className="text-gray-600 mt-1">Groups you're a member of</p>
              </div>
              
              <Button 
                onClick={() => setActiveTab('create')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>

            {/* Groups Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading your groups...</p>
              </div>
            ) : userGroups.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Groups Yet</h3>
                <p className="text-gray-500 mb-4">You haven't joined any groups yet</p>
                <Button onClick={() => setActiveTab('discover')}>
                  Discover Groups
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userGroups.map((group) => (
                  <div key={group.group_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                       onClick={() => window.location.href = `/groups/${group.group_id}`}>
                    {/* Cover Image */}
                    <div className="h-32 bg-gradient-to-r from-purple-400 to-pink-400 relative">
                      {group.cover_image_url ? (
                        <img src={group.cover_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500" />
                      )}
                      
                      {/* Floating Avatar */}
                      <div className="absolute -bottom-6 left-4">
                        <div className="w-12 h-12 rounded-lg border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
                          {group.avatar_url ? (
                            <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-purple-600">{getInitials(group.name)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 pt-8">
                      <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="w-3 h-3 mr-1" />
                        {group.member_count} members
                      </div>
                    </div>
                  </div>
                ))}
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
                <h2 className="text-2xl font-bold text-gray-900">Discover Groups</h2>
                <p className="text-gray-600 mt-1">Find groups that match your interests</p>
              </div>
              
              {/* Search */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <Button 
                  onClick={() => setActiveTab('create')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>

            {/* Groups List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading groups...</p>
              </div>
            ) : filteredPublicGroups.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Compass className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No groups found' : 'No groups available'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Be the first to create a group!'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setActiveTab('create')}>
                    Create First Group
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPublicGroups.map((group) => (
                  <div key={group.group_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {group.avatar_url ? (
                            <img src={group.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-purple-600">{getInitials(group.name)}</span>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 
                              className="text-lg font-semibold text-gray-900 hover:text-purple-600 cursor-pointer truncate"
                              onClick={() => window.location.href = `/groups/${group.group_id}`}
                            >
                              {group.name}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                              {group.visibility}
                            </span>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                          <div className="flex items-center text-sm text-gray-500 space-x-4">
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {group.member_count} members
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Join Button */}
                      <div className="ml-4 flex-shrink-0">
                        <Button
                          onClick={() => handleJoinGroup(group.group_id)}
                          disabled={joiningGroupId === group.group_id}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {joiningGroupId === group.group_id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Joining...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Join Group
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'create':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Group</h2>
              <p className="text-gray-600">Set up a new group to bring people together around shared interests</p>
            </div>
            
            <GroupCreationForm
              onSubmit={handleCreateGroup}
              onCancel={handleCancelGroupCreation}
              isLoading={isCreatingGroup}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ThreePanelLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold text-gray-900">Groups</h1>
                
                {/* Tab Navigation */}
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('your-groups')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'your-groups'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2 inline" />
                    Your Groups
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('discover')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'discover'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Compass className="w-4 h-4 mr-2 inline" />
                    Discover
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'create'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Create
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderTabContent()}
        </div>
      </div>
    </ThreePanelLayout>
  );
};

export default UnifiedGroupsPage;