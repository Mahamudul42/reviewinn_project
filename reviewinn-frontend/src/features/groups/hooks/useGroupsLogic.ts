/**
 * Custom hook for Groups functionality
 * Manages state and operations for the groups feature
 */

import { useState, useCallback, useEffect } from 'react';
import { useUnifiedAuth } from '../../../hooks/useUnifiedAuth';
import { useShowToast } from '../../../stores/uiStore';
import { groupsApiService } from '../services/groupsApiService';
import type { Group, GroupsState, TabType, UseGroupsReturn } from '../types';

export const useGroupsPage = (): UseGroupsReturn => {
  const { isAuthenticated } = useUnifiedAuth();
  const { showSuccess, showError } = useShowToast();
  
  const [state, setState] = useState<GroupsState>({
    userGroups: [],
    publicGroups: [],
    loading: false,
    searchQuery: '',
    joiningGroupId: null,
    isCreatingGroup: false,
  });

  const [activeTab, setActiveTab] = useState<TabType>('discover');

  // Update state helper
  const updateState = useCallback((updates: Partial<GroupsState>) => {
    setState((prev: GroupsState) => ({ ...prev, ...updates }));
  }, []);

  // Fetch groups data
  const fetchGroups = useCallback(async (userGroupsOnly = false) => {
    return await groupsApiService.fetchGroups(userGroupsOnly);
  }, []);

  // Refresh all groups data
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
      
      updateState({
        userGroups: userGroupsData,
        publicGroups: publicGroupsData
      });
      
      return { userGroups: userGroupsData, publicGroups: publicGroupsData };
    } catch (error) {
      console.error('❌ Error refreshing groups:', error);
      throw error;
    }
  }, [isAuthenticated, fetchGroups, updateState]);

  // Join a group
  const joinGroup = useCallback(async (groupId: number) => {
    if (!isAuthenticated) {
      showError('Authentication Required', 'Please log in to join groups.');
      return;
    }

    updateState({ joiningGroupId: groupId });
    
    try {
      let isAlreadyMember = false;
      try {
        await groupsApiService.joinGroup(groupId);
      } catch (error: any) {
        if (error.message.includes('Already a member')) {
          console.log('ℹ️ User is already a member, continuing...');
          isAlreadyMember = true;
        } else {
          throw error;
        }
      }
      
      // Force refresh groups data with a small delay
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
      updateState({ joiningGroupId: null });
    }
  }, [isAuthenticated, showSuccess, showError, refreshGroupsData, updateState]);

  // Load groups on mount and auth change
  useEffect(() => {
    let isMounted = true;
    
    const loadGroups = async () => {
      if (!isMounted) return;
      
      console.log('🚀 Loading groups, isAuthenticated:', isAuthenticated);
      updateState({ loading: true });
      
      try {
        const [userGroupsData, publicGroupsData] = await Promise.all([
          isAuthenticated ? fetchGroups(true) : Promise.resolve([]),
          fetchGroups(false)
        ]);
        
        if (!isMounted) return;
        
        console.log('✅ Setting groups data:', { 
          userGroups: userGroupsData.length, 
          publicGroups: publicGroupsData.length 
        });
        
        updateState({
          userGroups: userGroupsData,
          publicGroups: publicGroupsData
        });
      } catch (error) {
        console.error('Failed to load groups:', error);
      } finally {
        if (isMounted) {
          updateState({ loading: false });
        }
      }
    };

    loadGroups();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchGroups, updateState]);

  // Computed values
  const availablePublicGroups = state.publicGroups.filter(
    (publicGroup: Group) => !state.userGroups.some((userGroup: Group) => userGroup.group_id === publicGroup.group_id)
  );

  const filteredPublicGroups = availablePublicGroups.filter((group: Group) =>
    group.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  return {
    // State
    ...state,
    activeTab,
    availablePublicGroups,
    filteredPublicGroups,
    isAuthenticated,
    
    // Actions
    setActiveTab,
    updateState,
    refreshGroupsData,
    joinGroup,
    
    // Computed
    hasUserGroups: state.userGroups.length > 0,
    hasPublicGroups: filteredPublicGroups.length > 0,
  };
};