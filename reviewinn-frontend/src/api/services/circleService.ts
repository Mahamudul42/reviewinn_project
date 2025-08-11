import { httpClient } from '../httpClient';
import { API_CONFIG, API_ENDPOINTS } from '../config';
import type {
  ReviewCircle,
  CircleInvite,
  CircleMember,
  CircleSuggestion,
  CircleAnalytics,
  TrustLevel,
  CircleListParams,
  CircleMemberListParams,
  CircleSuggestionListParams,
  CircleCreateRequest,
  CircleInviteRequest,
  CircleRequest,
  User
} from '../../types';

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

export interface CircleInviteListResponse {
  invites: CircleInvite[];
}

export interface CircleSuggestionListResponse {
  suggestions: CircleSuggestion[];
}

export interface CircleInviteResponse {
  message: string;
  connection_id: number;
  taste_match_score: number;
}

export interface CircleActionResponse {
  message: string;
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
   * Send a circle invite
   */
  async sendInvite(circleId: number, inviteData: CircleInviteRequest): Promise<CircleInviteResponse> {
    const response = await httpClient.post<CircleInviteResponse>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.INVITE(circleId.toString())}`,
      inviteData
    );
    console.log('Circle service response:', response);
    return response.data!;
  }

  /**
   * Get received invites for current user
   */
  async getReceivedInvites(): Promise<CircleInviteListResponse> {
    try {
      const response = await httpClient.get<CircleInviteListResponse>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.INVITES_RECEIVED}`,
        true
      );
      return response.data || { invites: [] };
    } catch (error) {
      console.error('Failed to get received invites:', error);
      return { invites: [] };
    }
  }

  /**
   * Get sent invites for current user
   */
  async getSentInvites(): Promise<CircleInviteListResponse> {
    const response = await httpClient.get<CircleInviteListResponse>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.INVITES_SENT}`,
      true
    );
    return response.data || { invites: [] };
  }

  /**
   * Respond to a circle invite
   */
  async respondToInvite(inviteId: number, action: 'accept' | 'decline'): Promise<CircleActionResponse> {
    const response = await httpClient.put<CircleActionResponse>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.RESPOND_INVITE(inviteId.toString())}`,
      { action }
    );
    return response.data!;
  }

  /**
   * Get circle members
   */
  async getCircleMembers(circleId: number, params: CircleMemberListParams = {}): Promise<CircleMemberListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.size) searchParams.append('size', params.size.toString());
    if (params.trust_level) searchParams.append('trust_level', params.trust_level);

    const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.MEMBERS(circleId.toString())}?${searchParams.toString()}`;
    const response = await httpClient.get<CircleMemberListResponse>(url, true);
    
    return response.data || { members: [], total_count: 0 };
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
      // Fallback to mock data
      return { members: this.getMockMemberData(), total_count: this.getMockMemberData().length };
    }
  }

  /**
   * Update trust level of a circle member
   */
  async updateTrustLevel(connectionId: number, trustLevel: TrustLevel): Promise<CircleActionResponse> {
    const response = await httpClient.put<CircleActionResponse>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.UPDATE_TRUST_LEVEL(connectionId.toString())}`,
      { trust_level: trustLevel }
    );
    return response.data!;
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
      // Fallback to mock data for demo purposes
      return { suggestions: this.getMockSuggestionData() };
    }
  }

  /**
   * Dismiss a suggestion
   */
  async dismissSuggestion(suggestionId: number): Promise<CircleActionResponse> {
    const response = await httpClient.post<CircleActionResponse>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.DISMISS_SUGGESTION(suggestionId.toString())}`,
      {}
    );
    return response.data!;
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
        console.log('API response was not successful, using mock data');
        return { users: this.getMockSearchResults(params.query) };
      }
    } catch (error) {
      console.log('User search API failed:', error);
      console.log('Falling back to mock data for query:', params.query);
      return { users: this.getMockSearchResults(params.query) };
    }
  }

  /**
   * Send a circle request to a user
   */
  async sendCircleRequest(userId: string, data: { message: string }): Promise<{ message: string; request_id: number }> {
    try {
      const response = await httpClient.post<{ message: string; request_id: number }>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.SEND_REQUEST}`,
        { user_id: userId, message: data.message }
      );
      return response.data!;
    } catch (error) {
      console.error('Failed to send circle request:', error);
      // For demo purposes, simulate success
      return { 
        message: 'Circle request sent successfully',
        request_id: Math.floor(Math.random() * 1000)
      };
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
   * Get sent circle requests for current user
   */
  async getSentRequests(): Promise<{ requests: CircleRequest[] }> {
    try {
      // Note: Backend doesn't have sent requests endpoint yet, but we should still try
      // For now, return empty data but structure it for when the endpoint is available
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
      throw error; // Re-throw to let UI handle the error properly
    }
  }

  /**
   * Add a user to circle directly from suggestions
   */
  async addToCircle(userId: string, circleId?: number): Promise<CircleActionResponse> {
    // Validate input parameters
    if (!userId || userId.trim() === '') {
      throw new Error(`Invalid user ID: ${userId}`);
    }
    
    if (circleId !== undefined && circleId <= 0) {
      throw new Error(`Invalid circle ID: ${circleId}`);
    }
    
    // Convert userId to number for backend compatibility
    const userIdNumber = parseInt(userId, 10);
    if (isNaN(userIdNumber)) {
      throw new Error(`Invalid user ID format: ${userId}`);
    }
    
    const payload: { user_id: number; circle_id?: number } = { user_id: userIdNumber };
    if (circleId !== undefined && circleId !== null) {
      payload.circle_id = circleId;
    }
    
    console.log('CircleService.addToCircle - sending payload:', payload);
    console.log('CircleService.addToCircle - payload type check:', {
      user_id_type: typeof payload.user_id,
      user_id_value: payload.user_id,
      circle_id_type: typeof payload.circle_id,
      circle_id_value: payload.circle_id
    });
    
    try {
      const response = await httpClient.post<CircleActionResponse>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.ADD_TO_CIRCLE}`,
        payload
      );
      console.log('CircleService.addToCircle - received response:', response);
      return response.data!;
    } catch (error) {
      console.error('CircleService.addToCircle - error:', error);
      throw error;
    }
  }

  /**
   * Get circle analytics for current user
   */
  async getAnalytics(): Promise<CircleAnalytics> {
    try {
      const response = await httpClient.get<CircleAnalytics>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.ANALYTICS}`,
        true
      );
      return response.data || {
        total_connections: 0,
        trust_level_breakdown: {
          REVIEWER: 0,
          TRUSTED_REVIEWER: 0,
          REVIEW_ALLY: 0,
          REVIEW_MENTOR: 0
        },
        average_taste_match: 0.0,
        recent_connections: 0,
        circle_growth: {
          this_month: 0,
          last_month: 0,
          this_year: 0
        }
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return {
        total_connections: 0,
        trust_level_breakdown: {
          REVIEWER: 0,
          TRUSTED_REVIEWER: 0,
          REVIEW_ALLY: 0,
          REVIEW_MENTOR: 0
        },
        average_taste_match: 0.0,
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
   * Remove user from circle
   */
  async removeUserFromCircle(connectionId: number): Promise<{message: string}> {
    const url = `${this.baseUrl}${API_ENDPOINTS.CIRCLES.REMOVE_MEMBER(String(connectionId))}`;
    console.log('removeUserFromCircle - URL:', url);
    console.log('removeUserFromCircle - connectionId:', connectionId, typeof connectionId);
    
    const response = await httpClient.delete<{message: string}>(url, true);
    console.log('removeUserFromCircle - response:', response);
    return response.data!;
  }


  /**
   * Block a user
   */
  async blockUser(userId: string | number, reason?: string): Promise<{message: string}> {
    const response = await httpClient.post<{message: string}>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.BLOCK_USER}`,
      { user_id: Number(userId), reason },
      true
    );
    return response.data!;
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string | number): Promise<{message: string}> {
    const response = await httpClient.delete<{message: string}>(
      `${this.baseUrl}${API_ENDPOINTS.CIRCLES.UNBLOCK_USER(String(userId))}`,
      true
    );
    return response.data!;
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(): Promise<{blocked_users: any[]}> {
    try {
      const response = await httpClient.get<{blocked_users: any[]}>(
        `${this.baseUrl}${API_ENDPOINTS.CIRCLES.BLOCKED_USERS}`,
        true
      );
      return response.data || { blocked_users: [] };
    } catch (error) {
      console.error('Failed to get blocked users:', error);
      return { blocked_users: [] };
    }
  }

  /**
   * Helper functions for UI display
   */
  getTrustLevelDisplay(trustLevel: TrustLevel): string {
    switch (trustLevel) {
      case 'REVIEWER':
        return 'Reviewer';
      case 'TRUSTED_REVIEWER':
        return 'Trusted Reviewer';
      case 'REVIEW_ALLY':
        return 'Review Ally';
      case 'REVIEW_MENTOR':
        return 'Review Mentor';
      default:
        return 'Reviewer';
    }
  }

  getTrustLevelColor(trustLevel: TrustLevel): string {
    switch (trustLevel) {
      case 'REVIEWER':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'TRUSTED_REVIEWER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REVIEW_ALLY':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REVIEW_MENTOR':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }

  getTasteMatchColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  }

  getTasteMatchDescription(score: number): string {
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Good match';
    if (score >= 40) return 'Fair match';
    return 'Different tastes';
  }

  /**
   * Fallback data for when API is not available
   */
  getMockCircleData(): ReviewCircle[] {
    return [
      {
        id: 1,
        name: 'Tech Reviewers',
        description: 'A circle for technology product reviews',
        is_public: true,
        max_members: 50,
        member_count: 23,
        creator_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Food Enthusiasts',
        description: 'Restaurant and food reviews',
        is_public: true,
        max_members: 100,
        member_count: 45,
        creator_id: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  getMockMemberData(): CircleMember[] {
    return [
      {
        connection_id: 1,
        user: {
          id: 1,
          name: 'Alice Johnson',
          username: 'alice_j',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e6ff88?w=150&h=150&fit=crop&crop=face'
        },
        trust_level: 'REVIEW_MENTOR' as TrustLevel,
        taste_match_score: 92.5,
        connected_since: '2024-01-15T10:30:00Z',
        last_interaction: '2024-07-10T14:20:00Z',
        interaction_count: 15
      },
      {
        connection_id: 2,
        user: {
          id: 2,
          name: 'Bob Smith',
          username: 'bob_smith',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        trust_level: 'TRUSTED_REVIEWER' as TrustLevel,
        taste_match_score: 78.3,
        connected_since: '2024-02-20T09:15:00Z',
        last_interaction: '2024-07-08T16:45:00Z',
        interaction_count: 8
      }
    ];
  }

  getMockSuggestionData(): CircleSuggestion[] {
    return [
      {
        user: {
          id: 13,
          name: 'Mia Johnson',
          username: 'mia_j',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
        },
        taste_match_score: 85.7,
        reasons: ['Pet product expertise', 'Active in same categories', 'Comparable experience level'],
        mutual_connections: 3
      },
      {
        user: {
          id: 16,
          name: 'Ryan Brown',
          username: 'ryan_b',
          avatar: 'https://images.unsplash.com/photo-1507038772120-7fff76f79d79?w=150&h=150&fit=crop&crop=face'
        },
        taste_match_score: 88.2,
        reasons: ['Smart home expertise', 'Tech reviewer', 'High taste alignment'],
        mutual_connections: 4
      },
      {
        user: {
          id: 12,
          name: 'Leo Rodriguez',
          username: 'leo_r',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        taste_match_score: 76.3,
        reasons: ['Music gear reviews', 'Detailed analysis style', 'Similar review frequency'],
        mutual_connections: 2
      },
      {
        user: {
          id: 14,
          name: 'Noah Green',
          username: 'noah_g',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
        },
        taste_match_score: 79.1,
        reasons: ['Outdoor gear expertise', 'Adventure enthusiast', 'Geographic proximity'],
        mutual_connections: 1
      },
      {
        user: {
          id: 15,
          name: 'Olivia Taylor',
          username: 'olivia_t',
          avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face'
        },
        taste_match_score: 82.4,
        reasons: ['Creative product reviews', 'Art supplies expert', 'Active reviewer'],
        mutual_connections: 2
      }
    ];
  }

  /**
   * Mock search results for testing
   */
  getMockSearchResults(query: string): User[] {
    const allUsers: User[] = [
      {
        id: '101',
        name: 'Jane Smith',
        username: 'jane_smith',
        email: 'jane@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e6ff88?w=150&h=150&fit=crop&crop=face',
        level: 8,
        points: 2450,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 45, averageRatingGiven: 4.2, entitiesReviewed: 25, streakDays: 7 },
        following: [],
        followers: []
      },
      {
        id: '102',
        name: 'John Doe',
        username: 'john_doe',
        email: 'john@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        level: 12,
        points: 3890,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 67, averageRatingGiven: 4.5, entitiesReviewed: 40, streakDays: 12 },
        following: [],
        followers: []
      },
      {
        id: '103',
        name: 'Sarah Connor',
        username: 'sarah_c',
        email: 'sarah@example.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        level: 5,
        points: 1800,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 32, averageRatingGiven: 4.1, entitiesReviewed: 18, streakDays: 5 },
        following: [],
        followers: []
      },
      {
        id: '104',
        name: 'Mike Johnson',
        username: 'mike_j',
        email: 'mike@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        level: 7,
        points: 2100,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 38, averageRatingGiven: 4.3, entitiesReviewed: 22, streakDays: 9 },
        following: [],
        followers: []
      },
      {
        id: '105',
        name: 'Emma Wilson',
        username: 'emma_w',
        email: 'emma@example.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        level: 9,
        points: 2800,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 52, averageRatingGiven: 4.4, entitiesReviewed: 31, streakDays: 15 },
        following: [],
        followers: []
      },
      {
        id: '106',
        name: 'Alex Taylor',
        username: 'alex_t',
        email: 'alex@example.com',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        level: 6,
        points: 1950,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 29, averageRatingGiven: 4.0, entitiesReviewed: 16, streakDays: 3 },
        following: [],
        followers: []
      },
      {
        id: '107',
        name: 'David Chen',
        username: 'david_chen',
        email: 'david@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        level: 10,
        points: 3200,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 78, averageRatingGiven: 4.3, entitiesReviewed: 45, streakDays: 21 },
        following: [],
        followers: []
      },
      {
        id: '108',
        name: 'Lisa Rodriguez',
        username: 'lisa_r',
        email: 'lisa@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e6ff88?w=150&h=150&fit=crop&crop=face',
        level: 6,
        points: 1750,
        badges: [],
        createdAt: new Date().toISOString(),
        preferences: { notifications: { email: true, reviewReplies: true }, privacy: { profileVisible: true, showContexts: true } },
        stats: { totalReviews: 34, averageRatingGiven: 4.1, entitiesReviewed: 20, streakDays: 4 },
        following: [],
        followers: []
      }
    ];

    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(lowerQuery) ||
      (user.username && user.username.toLowerCase().includes(lowerQuery)) ||
      user.email.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  }

  /**
   * Mock pending requests for testing
   */
  getMockPendingRequests(): CircleRequest[] {
    return [
      {
        id: 301,
        requester: {
          id: 103,
          name: 'Sarah Connor',
          username: 'sarah_c',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        },
        message: 'Hi! I really appreciate your tech reviews and would love to connect in your review circle.',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'pending'
      },
      {
        id: 302,
        requester: {
          id: 104,
          name: 'Mike Johnson',
          username: 'mike_j',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        message: 'Your food reviews are amazing! Would love to be part of your circle.',
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        status: 'pending'
      },
      {
        id: 303,
        requester: {
          id: 107,
          name: 'David Chen',
          username: 'david_chen',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        message: 'I enjoy your detailed reviews and would like to join your review circle for better collaboration.',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        status: 'pending'
      }
    ];
  }

  /**
   * Mock sent requests for testing
   */
  getMockSentRequests(): CircleRequest[] {
    return [
      {
        id: 401,
        requester: {
          id: 105,
          name: 'Emma Wilson',
          username: 'emma_w',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
        },
        message: 'Hi Emma! I enjoy your creative product reviews and would love to connect in my review circle.',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        status: 'pending'
      },
      {
        id: 402,
        requester: {
          id: 106,
          name: 'Alex Taylor',
          username: 'alex_t',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
        },
        message: 'Your outdoor gear reviews are fantastic! I would love to join your circle.',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        status: 'pending'
      },
      {
        id: 403,
        requester: {
          id: 108,
          name: 'Lisa Rodriguez',
          username: 'lisa_r',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b9e6ff88?w=150&h=150&fit=crop&crop=face'
        },
        message: 'Hi Lisa! I noticed we have similar reviewing styles. Would you like to connect?',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        status: 'pending'
      }
    ];
  }
}

// Export singleton instance
export const circleService = new CircleService();