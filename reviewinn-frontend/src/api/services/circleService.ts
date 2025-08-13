import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';
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
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Create a new review circle
   */
  async createCircle(circleData: CircleCreateRequest): Promise<ReviewCircle> {
    const response = await httpClient.post<ReviewCircle>(`${this.baseUrl}${API_ENDPOINTS.CIRCLES.CREATE}`, circleData);
    return response.data!;
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
    const response = await httpClient.get<CircleListResponse>(url, true);
    
    return response.data || { items: [], total: 0, page: 1, size: 20, total_pages: 0 };
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
      const response = await httpClient.get<CircleMemberListResponse>(url, true);
      
      return response.data || { members: [], total_count: 0 };
    } catch (error) {
      console.error('Failed to get circle members:', error);
      throw error;
    }
  }

  /**
   * Remove a member from circle
   */
  async removeFromCircle(connectionId: number): Promise<CircleActionResponse> {
    const response = await httpClient.delete<CircleActionResponse>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.REMOVE_MEMBER(connectionId.toString())}`
    );
    return response.data!;
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
      const response = await httpClient.get<CircleSuggestionListResponse>(url, true);
      
      return response.data || { suggestions: [] };
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      throw error;
    }
  }

  /**
   * Search for users to add to circle
   */
  async searchUsers(params: { query: string; limit?: number }): Promise<{ users: User[] }> {
    const searchParams = new URLSearchParams();
    searchParams.append('query', params.query);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.SEARCH_USERS}?${searchParams.toString()}`;
    
    try {
      console.log('Attempting to search users with URL:', url);
      const response = await httpClient.get<{ users: User[] }>(url, true);
      console.log('Search API response:', response);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('API response was not successful');
      }
    } catch (error) {
      console.log('User search API failed:', error);
      throw error;
    }
  }

  /**
   * Send a circle request to a user
   */
  async sendCircleRequest(userId: string, data: { message: string }): Promise<{ message: string; request_id: number }> {
    try {
      const response = await httpClient.post<{ message: string; request_id: number }>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.SEND_REQUEST}`,
        { user_id: parseInt(userId), message: data.message }
      );
      return response.data!;
    } catch (error) {
      console.error('Failed to send circle request:', error);
      throw error;
    }
  }

  /**
   * Get pending circle requests for current user
   */
  async getPendingRequests(): Promise<{ requests: CircleRequest[] }> {
    try {
      const response = await httpClient.get<{ requests: CircleRequest[] }>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.PENDING_REQUESTS}`,
        true
      );
      return response.data || { requests: [] };
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return { requests: [] };
    }
  }

  /**
   * Get sent circle requests for current user (legacy support)
   */
  async getSentRequests(): Promise<{ requests: CircleRequest[] }> {
    try {
      // Note: This endpoint may not be implemented in the new backend
      console.log('Sent requests API not yet available, returning empty data');
      return { requests: [] };
    } catch (error) {
      console.error('Failed to get sent requests:', error);
      return { requests: [] };
    }
  }

  /**
   * Respond to a circle request
   */
  async respondToCircleRequest(requestId: number, action: 'accept' | 'decline'): Promise<{ message: string }> {
    try {
      const response = await httpClient.post<{ message: string }>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.RESPOND_REQUEST}`,
        { request_id: requestId, action }
      );
      return response.data!;
    } catch (error) {
      console.error('Failed to respond to circle request:', error);
      throw error;
    }
  }

  /**
   * Block a user
   */
  async blockUser(userId: string, reason?: string): Promise<BlockUserResponse> {
    try {
      const response = await httpClient.post<BlockUserResponse>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.BLOCK_USER}`,
        { user_id: parseInt(userId), reason }
      );
      return response.data!;
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
      const response = await httpClient.delete<CircleActionResponse>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.UNBLOCK_USER(userId)}`
      );
      return response.data!;
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
      const response = await httpClient.get<BlockedUsersResponse>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.BLOCKED_USERS}`,
        true
      );
      return response.data || { blocked_users: [] };
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      return { blocked_users: [] };
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
    // Analytics endpoint removed in new structure, return null for now
    console.log('Analytics endpoint not available in new structure');
    return null;
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
   * Add a user directly to circle (legacy method for backward compatibility)
   */
  async addToCircle(userId: string): Promise<CircleActionResponse> {
    try {
      // Convert to sending a circle request instead
      const result = await this.sendCircleRequest(userId, { message: 'Would you like to join my review circle?' });
      return { message: result.message };
    } catch (error) {
      console.error('Failed to add user to circle:', error);
      throw error;
    }
  }

  /**
   * Update trust level of a circle member (legacy method - not supported in new structure)
   */
  async updateTrustLevel(connectionId: number, trustLevel: TrustLevel): Promise<CircleActionResponse> {
    console.log('Trust level updates not supported in new structure');
    return { message: 'Trust level update not available in current version' };
  }

}

export const circleService = new CircleService();
export default circleService;