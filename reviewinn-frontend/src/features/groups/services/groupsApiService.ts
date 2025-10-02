/**
 * Groups API Service
 * Handles all API requests for groups functionality
 */

import { API_CONFIG } from '../../../api/config';
import { useAuthStore } from '../../../stores/authStore';
import type { Group } from '../types';

class GroupsApiService {
  private getAuthToken(): string | null {
    // Use the same auth method as the rest of the application
    const zustandState = useAuthStore.getState();
    const zustandToken = zustandState.token;
    const localStorageToken = localStorage.getItem('reviewinn_jwt_token');
    
    console.log('🔍 Token sources:', {
      zustandToken: zustandToken ? `${zustandToken.slice(0, 30)}...` : 'null',
      localStorageToken: localStorageToken ? `${localStorageToken.slice(0, 30)}...` : 'null',
      isAuthenticated: zustandState.isAuthenticated,
      user: zustandState.user
    });
    
    // Prefer Zustand token as it's the source of truth
    const finalToken = zustandToken || localStorageToken;
    console.log('🎯 Final token selected:', finalToken ? `${finalToken.slice(0, 30)}...` : 'null');
    
    return finalToken;
  }

  private async makeRequest(method: string, endpoint: string, body?: any): Promise<any> {
    const token = this.getAuthToken();
    
    // Use the API base URL configuration to ensure proper routing
    const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
    
    console.log(`🔐 Token from localStorage:`, token ? `${token.slice(0, 20)}...` : 'NO TOKEN');
    
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(body && { body: JSON.stringify(body) })
    };

    console.log(`🔗 API ${method} request to:`, url);
    console.log(`📋 Request headers:`, config.headers);
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
      console.log(`❌ API Error Response:`, errorData);
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API response:`, data);
    return data;
  }

  async fetchGroups(userGroupsOnly = false): Promise<Group[]> {
    try {
      const params = new URLSearchParams({
        size: userGroupsOnly ? '50' : '20',
        ...(userGroupsOnly && { user_groups_only: 'true' })
      });
      
      const endpoint = `/groups/?${params}`;
      console.log(`🔍 Fetching groups (userOnly: ${userGroupsOnly}):`, endpoint);
      
      // Debug authentication
      const token = this.getAuthToken();
      console.log(`🔐 Auth token available:`, !!token);
      console.log(`🔐 Token preview:`, token ? `${token.slice(0, 30)}...` : 'NO TOKEN');
      
      // Test authentication by checking store state
      const zustandState = useAuthStore.getState();
      console.log(`🏪 Zustand auth state:`, {
        isAuthenticated: zustandState.isAuthenticated,
        hasToken: !!zustandState.token,
        user: zustandState.user ? `${zustandState.user.username} (ID: ${(zustandState.user as any).user_id || zustandState.user.id})` : 'No user'
      });
      
      const data = await this.makeRequest('GET', endpoint);
      const groups = data.data || [];
      
      console.log(`📊 Fetched ${groups.length} groups (userOnly: ${userGroupsOnly}):`, groups);
      
      // Debug: Check if any groups have user_membership data
      const groupsWithMembership = groups.filter((g: Group) => g.user_membership !== null);
      console.log(`👥 Groups with membership data: ${groupsWithMembership.length}`);
      
      if (userGroupsOnly && groups.length === 0) {
        console.warn('⚠️ No user groups returned. This might indicate authentication or backend filtering issues.');
      }
      
      return groups;
    } catch (error) {
      console.error('❌ Error fetching groups:', error);
      return [];
    }
  }

  async joinGroup(groupId: number): Promise<void> {
    console.log('🎯 Joining group:', groupId);
    await this.makeRequest('POST', `/groups/${groupId}/join`);
    console.log('✅ Successfully joined group:', groupId);
  }

  async createGroup(groupData: any): Promise<any> {
    console.log('🔄 Creating group:', groupData.name);
    return await this.makeRequest('POST', '/groups/', groupData);
  }
}

export const groupsApiService = new GroupsApiService();