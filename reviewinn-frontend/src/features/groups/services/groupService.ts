// Group service for API interactions
import { createAuthenticatedRequestInit } from '../../../shared/utils/auth';
import {
  Group,
  GroupCategory,
  GroupMembership,
  GroupInvitation,
  GroupInvitationRequest,
  GroupInvitationResponse,
  GroupCreateRequest,
  GroupUpdateRequest,
  GroupListParams,
  GroupSearchResult,
  GroupAnalytics,
  ReviewScopeRequest,
  PaginatedResponse
} from '../types';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/groups`;

class GroupService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...createAuthenticatedRequestInit(options),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Groups CRUD
  async getGroups(params?: GroupListParams): Promise<PaginatedResponse<Group>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<PaginatedResponse<Group>>(`/${query ? `?${query}` : ''}`);
  }

  async getGroup(groupId: number): Promise<Group> {
    return this.request<Group>(`/${groupId}`);
  }

  async createGroup(group: GroupCreateRequest): Promise<Group> {
    return this.request<Group>('/', {
      method: 'POST',
      body: JSON.stringify(group),
    });
  }

  async updateGroup(groupId: number, updates: GroupUpdateRequest): Promise<Group> {
    return this.request<Group>(`/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteGroup(groupId: number): Promise<void> {
    return this.request<void>(`/${groupId}`, {
      method: 'DELETE',
    });
  }

  // Group membership
  async getGroupMembers(groupId: number, params?: GroupListParams): Promise<PaginatedResponse<GroupMembership>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<PaginatedResponse<GroupMembership>>(`/${groupId}/members${query ? `?${query}` : ''}`);
  }

  async joinGroup(groupId: number): Promise<GroupMembership> {
    return this.request<GroupMembership>(`/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveGroup(groupId: number): Promise<void> {
    return this.request<void>(`/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async updateMemberRole(groupId: number, userId: number, role: string): Promise<GroupMembership> {
    return this.request<GroupMembership>(`/${groupId}/members/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    return this.request<void>(`/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Group invitations
  async getGroupInvitations(groupId: number): Promise<PaginatedResponse<GroupInvitation>> {
    return this.request<PaginatedResponse<GroupInvitation>>(`/${groupId}/invitations`);
  }

  async sendInvitation(groupId: number, invitation: GroupInvitationRequest): Promise<GroupInvitation> {
    return this.request<GroupInvitation>(`/${groupId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(invitation),
    });
  }

  async respondToInvitation(invitationId: number, response: GroupInvitationResponse): Promise<GroupInvitation> {
    return this.request<GroupInvitation>(`/invitations/${invitationId}/respond`, {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }

  // Group search and discovery
  async searchGroups(query: string, params?: GroupListParams): Promise<GroupSearchResult> {
    const searchParams = new URLSearchParams({ search: query });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && key !== 'search') {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<GroupSearchResult>(`/search?${searchParams.toString()}`);
  }

  async getPopularGroups(limit?: number): Promise<Group[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await this.request<{ popular_groups: Group[], count: number }>(`/popular${params}`);
    return response.popular_groups || [];
  }

  async getRecommendedGroups(userId: number, limit?: number): Promise<Group[]> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<Group[]>(`/recommendations/${userId}${params}`);
  }

  // Group categories
  async getGroupCategories(): Promise<GroupCategory[]> {
    return this.request<GroupCategory[]>('/categories');
  }

  async getGroupsByCategory(categoryId: number, params?: GroupListParams): Promise<PaginatedResponse<Group>> {
    const queryParams = new URLSearchParams({ category_id: categoryId.toString() });
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && key !== 'category_id') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<Group>>(`/?${queryParams.toString()}`);
  }

  // Group analytics
  async getGroupAnalytics(groupId: number): Promise<GroupAnalytics> {
    return this.request<GroupAnalytics>(`/${groupId}/analytics`);
  }

  // Review scope management
  async setReviewScope(groupId: number, reviewId: number, scope: ReviewScopeRequest): Promise<void> {
    return this.request<void>(`/${groupId}/reviews/${reviewId}/scope`, {
      method: 'PUT',
      body: JSON.stringify(scope),
    });
  }

  async getGroupReviews(groupId: number, params?: { page?: number; size?: number }): Promise<PaginatedResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const query = queryParams.toString();
    return this.request<PaginatedResponse<any>>(`/${groupId}/reviews${query ? `?${query}` : ''}`);
  }
}

export const groupService = new GroupService();