/**
 * Unified Groups Page - Modular Version
 * Facebook-style groups interface with clean separation of concerns
 */

import React from 'react';
import ThreePanelLayout from '../../shared/layouts/ThreePanelLayout';
import { useShowToast } from '../../stores/uiStore';
import { useGroupsPage } from './hooks/useGroupsLogic';
import { createGroup } from './services/groupCreationService';
import { GroupsTabs } from './components/GroupsTabs';
import { YourGroupsTab } from './components/YourGroupsTab';
import { DiscoverGroupsTab } from './components/DiscoverGroupsTab';
import { CreateGroupTab } from './components/CreateGroupTab';
import type { GroupFormData } from './services/groupCreationService';

const UnifiedGroupsPage: React.FC = () => {
  const { showSuccess, showError } = useShowToast();
  
  const {
    // State
    userGroups,
    loading,
    searchQuery,
    joiningGroupId,
    isCreatingGroup,
    activeTab,
    filteredPublicGroups,
    isAuthenticated,
    
    // Actions
    setActiveTab,
    updateState,
    refreshGroupsData,
    joinGroup,
  } = useGroupsPage();

  // Handle group creation
  const handleCreateGroup = async (formData: GroupFormData): Promise<void> => {
    updateState({ isCreatingGroup: true });
    
    try {
      await createGroup(formData);
      
      // Refresh data and switch to user groups
      await refreshGroupsData();
      setActiveTab('your-groups');
      
      showSuccess('Group Created!', 'Your group has been created successfully.');
    } catch (error: any) {
      console.error('❌ Error creating group:', error);
      showError('Failed to Create Group', error.message || 'Something went wrong. Please try again.');
    } finally {
      updateState({ isCreatingGroup: false });
    }
  };

  // Handle cancel group creation
  const handleCancelGroupCreation = () => {
    setActiveTab('discover');
  };

  // Handle search query change
  const handleSearchChange = (query: string) => {
    updateState({ searchQuery: query });
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'your-groups':
        return (
          <YourGroupsTab
            groups={userGroups}
            loading={loading}
            isAuthenticated={isAuthenticated}
          />
        );

      case 'discover':
        return (
          <DiscoverGroupsTab
            groups={filteredPublicGroups}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onJoinGroup={joinGroup}
            joiningGroupId={joiningGroupId}
          />
        );

      case 'create':
        return (
          <CreateGroupTab
            onCreateGroup={handleCreateGroup}
            onCancel={handleCancelGroupCreation}
            isCreating={isCreatingGroup}
          />
        );

      default:
        return null;
    }
  };

  return (
    <ThreePanelLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Tabs */}
        <div className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
                <p className="text-gray-600 mt-1">Connect with communities that share your interests</p>
              </div>
            </div>
            
            {/* Tabs Navigation */}
            <GroupsTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
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