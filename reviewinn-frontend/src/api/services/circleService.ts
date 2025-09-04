import { API_ENDPOINTS } from '../config';
import { createAuthenticatedRequestInit } from '../../shared/utils/auth';
import type {
  ReviewCircle,
  CircleMember,
  CircleSuggestion,
  CircleAnalytics,
  CircleListParams,
  CircleMemberListParams,
  CircleSuggestionListParams,
  CircleCreateRequest,
  CircleRequest,
  User
} from '../../types';
import { TrustLevel } from '../../types';

export interface CircleListResponse {
  items: ReviewCircle[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface CircleMemberListResponse {
  members: CircleMember[];
  total_count: number;
}

export interface CircleRequestListResponse {
  requests: CircleRequest[];
}

export interface CircleSuggestionListResponse {
  suggestions: CircleSuggestion[];
}

export interface CircleActionResponse {
  message: string;
}

export interface BlockUserResponse {
  message: string;
}

export interface BlockedUsersResponse {
  blocked_users: User[];
}

export class CircleService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

  /**
   * Create a new review circle
   */
  async createCircle(circleData: CircleCreateRequest): Promise<ReviewCircle> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.CREATE}`, createAuthenticatedRequestInit({
      method: 'POST',
      body: JSON.stringify(circleData),
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to create circle: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  /**
   * Get list of circles with pagination and filtering
   */
  async getCircles(params: CircleListParams = {}): Promise<CircleListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.is_public !== undefined) searchParams.append('is_public', params.is_public.toString());
    if (params.search) searchParams.append('search', params.search);

    const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.LIST}?${searchParams.toString()}`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to get circles: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result || { items: [], total: 0, page: 1, size: 20, total_pages: 0 };
  }


  /**
   * Get current user's circle members
   */
  async getMyCircleMembers(params: CircleMemberListParams = {}): Promise<CircleMemberListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.size) searchParams.append('size', params.size.toString());
      if (params.trust_level) searchParams.append('trust_level', params.trust_level);

      const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.MY_MEMBERS}?${searchParams.toString()}`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get circle members: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { members: [], total_count: 0 };
    } catch (error) {
      console.error('Failed to get circle members:', error);
      throw error;
    }
  }

  /**
   * Remove a member from circle
   */
  async removeFromCircle(connectionId: number): Promise<CircleActionResponse> {
    const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.REMOVE_MEMBER(connectionId.toString())}`, createAuthenticatedRequestInit({
      method: 'DELETE',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to remove from circle: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  /**
   * Get circle member suggestions
   */
  async getSuggestions(params: CircleSuggestionListParams = {}): Promise<CircleSuggestionListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.min_taste_match) searchParams.append('min_taste_match', params.min_taste_match.toString());

      const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.SUGGESTIONS}?${searchParams.toString()}`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get suggestions: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { suggestions: [] };
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      throw error;
    }
  }

  /**
   * Search for users to add to circle
   */
  async searchUsers(params: { query: string; limit?: number }): Promise<{ users: User[] }> {
    console.log('🌐 CircleService.searchUsers called:', params);
    
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.SEARCH_USERS}?${searchParams.toString()}`;
    
    try {
      console.log('📤 Search API Request URL:', url);
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to search users: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 Search API Response:', result);
      console.log('👥 Found users count:', result.users?.length || 0);
      
      return result.data || result || { users: [] };
    } catch (error: any) {
      console.error('❌ User search API failed:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      throw error;
    }
  }

  /**
   * Send a circle request to a user
   */
  async sendCircleRequest(userId: string, data: { message: string }): Promise<{ message: string; request_id: number }> {
    console.log('🌐 CircleService.sendCircleRequest called:', { userId, message: data.message });
    try {
      const requestData = { user_id: parseInt(userId), message: data.message };
      console.log('📤 API Request:', `${this.baseUrl}${API_ENDPOINTS.CIRCLES.SEND_REQUEST}`, requestData);
      
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.SEND_REQUEST}`, createAuthenticatedRequestInit({
        method: 'POST',
        body: JSON.stringify(requestData),
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to send circle request: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 API Response:', result);
      return result.data || result;
    } catch (error: any) {
      console.error('❌ CircleService.sendCircleRequest failed:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      throw error;
    }
  }

  /**
   * Get pending circle requests for current user
   */
  async getPendingRequests(): Promise<{ requests: CircleRequest[] }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.PENDING_REQUESTS}`, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get pending requests: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { requests: [] };
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return { requests: [] };
    }
  }

  /**
   * Get sent circle requests for current user
   */
  async getSentRequests(): Promise<{ requests: CircleRequest[] }> {
    console.log('🌐 CircleService.getSentRequests called');
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.SENT_REQUESTS}`;
      console.log('📤 API Request GET:', url);
      
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get sent requests: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 getSentRequests API Response:', result);
      console.log('📊 Sent requests count:', result.requests?.length || 0);
      
      return result.data || result || { requests: [] };
    } catch (error: any) {
      console.error('❌ CircleService.getSentRequests failed:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message
      });
      return { requests: [] };
    }
  }

  /**
   * Respond to a circle request with relationship choice
   */
  async respondToCircleRequest(requestId: number, action: 'accept' | 'decline', finalRelationship?: 'circle_member' | 'follower'): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.RESPOND_REQUEST}`, createAuthenticatedRequestInit({
        method: 'POST',
        body: JSON.stringify({ request_id: requestId, action, final_relationship: finalRelationship }),
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to respond to circle request: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to respond to circle request:', error);
      throw error;
    }
  }

  /**
   * Cancel a sent circle request
   */
  async cancelCircleRequest(requestId: number): Promise<{ message: string }> {
    console.log('🌐 CircleService.cancelCircleRequest called:', { requestId });
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.CANCEL_REQUEST(requestId.toString())}`;
      console.log('📤 API Request DELETE:', url);
      
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'DELETE',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to cancel circle request: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 API Response:', result);
      return result.data || result;
    } catch (error: any) {
      console.error('❌ CircleService.cancelCircleRequest failed:', error);
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data
      });
      throw error;
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, reason?: string): Promise<BlockUserResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.BLOCK_USER}`, createAuthenticatedRequestInit({
        method: 'POST',
        body: JSON.stringify({ user_id: parseInt(userId), reason }),
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to block user: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<CircleActionResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.UNBLOCK_USER(userId)}`, createAuthenticatedRequestInit({
        method: 'DELETE',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to unblock user: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      throw error;
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(): Promise<BlockedUsersResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.BLOCKED_USERS}`, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get blocked users: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { blocked_users: [] };
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      return { blocked_users: [] };
    }
  }

  /**
   * Get users who follow the current user
   */
  async getFollowers(): Promise<{ followers: User[] }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.FOLLOWERS}`, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get followers: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { followers: [] };
    } catch (error) {
      console.error('Failed to get followers:', error);
      return { followers: [] };
    }
  }

  /**
   * Get users that the current user follows
   */
  async getFollowing(): Promise<{ following: User[] }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.FOLLOWING}`, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get following: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { following: [] };
    } catch (error) {
      console.error('Failed to get following:', error);
      return { following: [] };
    }
  }

  /**
   * Demote a circle mate to follower status
   */
  async demoteToFollower(userId: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.DEMOTE_TO_FOLLOWER}`, createAuthenticatedRequestInit({
        method: 'POST',
        body: JSON.stringify({ user_id: parseInt(userId) }),
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to demote to follower: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to demote to follower:', error);
      throw error;
    }
  }

  /**
   * Send a promotion request to make a follower into a circle mate
   */
  async promoteToCircleMate(userId: string, message?: string): Promise<{ message: string; request_id: number }> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.PROMOTE_TO_CIRCLE_MATE}`, createAuthenticatedRequestInit({
        method: 'POST',
        body: JSON.stringify({ user_id: parseInt(userId), message }),
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to promote to circle mate: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to promote to circle mate:', error);
      throw error;
    }
  }

  // Legacy method aliases for backward compatibility
  async getReceivedInvites(): Promise<CircleRequestListResponse> {
    return this.getPendingRequests();
  }

  async respondToInvite(inviteId: number, action: 'accept' | 'decline'): Promise<CircleActionResponse> {
    const result = await this.respondToCircleRequest(inviteId, action);
    return { message: result.message };
  }

  async getAnalytics(): Promise<CircleAnalytics | null> {
    // Analytics endpoint not available in current backend structure
    // Return mock data to maintain UI functionality
    try {
      const membersResponse = await this.getMyCircleMembers({ page: 1, size: 100 });
      const members = membersResponse.members || [];
      
      // Calculate basic analytics from member data
      const totalConnections = members.length;
      const trustLevelBreakdown = members.reduce((acc: Record<string, number>, member) => {
        const level = member.trust_level || 'REVIEWER';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});
      
      const averageTasteMatch = members.length > 0 
        ? members.reduce((sum, member) => sum + (member.taste_match_score || 0), 0) / members.length
        : 0;

      return {
        total_connections: totalConnections,
        trust_level_breakdown: trustLevelBreakdown,
        average_taste_match: averageTasteMatch,
        recent_connections: Math.min(totalConnections, 5), // Estimate
        circle_growth: {
          this_month: Math.floor(totalConnections * 0.3), // Estimate
          last_month: Math.floor(totalConnections * 0.2), // Estimate  
          this_year: totalConnections
        }
      };
    } catch (error) {
      // Return basic analytics if member fetch fails
      return {
        total_connections: 0,
        trust_level_breakdown: {},
        average_taste_match: 0,
        recent_connections: 0,
        circle_growth: {
          this_month: 0,
          last_month: 0,
          this_year: 0
        }
      };
    }
  }

  /**
   * Get CSS color class for taste match score
   */
  getTasteMatchColor(score: number): string {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  }

  /**
   * Get CSS color class for trust level
   */
  getTrustLevelColor(trustLevel: TrustLevel): string {
    switch (trustLevel) {
      case TrustLevel.REVIEW_MENTOR:
        return 'bg-purple-100 text-purple-800';
      case TrustLevel.TRUSTED_REVIEWER:
        return 'bg-blue-100 text-blue-800';
      case TrustLevel.REVIEW_ALLY:
        return 'bg-green-100 text-green-800';
      case TrustLevel.REVIEWER:
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get display text for trust level
   */
  getTrustLevelDisplay(trustLevel: TrustLevel): string {
    switch (trustLevel) {
      case TrustLevel.REVIEW_MENTOR:
        return 'Mentor';
      case TrustLevel.TRUSTED_REVIEWER:
        return 'Trusted';
      case TrustLevel.REVIEW_ALLY:
        return 'Ally';
      case TrustLevel.REVIEWER:
      default:
        return 'Member';
    }
  }


  /**
   * Update trust level of a circle member (legacy method - not supported in new structure)
   */
  async updateTrustLevel(_connectionId: number, _trustLevel: TrustLevel): Promise<CircleActionResponse> {
    console.log('Trust level updates not supported in new structure');
    return { message: 'Trust level update not available in current version' };
  }

}

export const circleService = new CircleService();
export default circleService;