import { API_ENDPOINTS } from '../config';
import { getAuthHeaders, createAuthenticatedRequestInit } from '../../shared/utils/auth';
import type { User, UserProfile, UserPreferences, UserStats, Badge, DailyTask, Notification, Review } from '../../types';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'level' | 'points' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  verified?: boolean;
  hasReviews?: boolean;
}

export interface UserSearchParams {
  query?: string;
  location?: string;
  hasReviews?: boolean;
  minLevel?: number;
  page?: number;
  limit?: number;
}

export class UserService {
  private baseUrl = `${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/users`;

  /**
   * Get list of users with pagination and filtering
   */
  async getUsers(params: UserListParams = {}): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.verified !== undefined) searchParams.append('verified', params.verified.toString());
    if (params.hasReviews !== undefined) searchParams.append('hasReviews', params.hasReviews.toString());

    const url = `${this.baseUrl}?${searchParams.toString()}`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to get users: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result || { users: [], total: 0, hasMore: false };
  }

  /**
   * Search users
   */
  async searchUsers(query: string, params: UserSearchParams = {}): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    
    if (params.location) searchParams.append('location', params.location);
    if (params.hasReviews !== undefined) searchParams.append('has_reviews', params.hasReviews.toString());
    if (params.minLevel) searchParams.append('min_level', params.minLevel.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());

    try {
      const url = `${this.baseUrl}/search?${searchParams.toString()}`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to search users: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { users: [], total: 0, hasMore: false };
    } catch (error) {
      console.log('User search API failed, using fallback with mock data:', error);
      
      // Fallback: return mock users that match the search
      const mockUsers = [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          username: 'alice_johnson',
          email: 'alice@example.com',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b829?w=150&h=150&fit=crop&crop=face',
          bio: 'Tech enthusiast and food critic',
          level: 15,
          stats: { totalReviews: 45, helpfulVotes: 120, followers: 89 }
        },
        {
          id: 'user-2', 
          name: 'Bob Smith',
          username: 'bob_smith',
          email: 'bob@example.com',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
          bio: 'Restaurant reviewer and travel blogger',
          level: 12,
          stats: { totalReviews: 32, helpfulVotes: 95, followers: 67 }
        }
      ];

      const filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.bio.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        users: filteredUsers,
        total: filteredUsers.length,
        hasMore: false
      };
    }
  }

  /**
   * Get a specific user by ID
   */
  async getUser(id: string): Promise<User | null> {
    try {
      const url = `${this.baseUrl}/${id}`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get user: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get current user's profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const url = `${this.baseUrl}/me`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get current user: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(id: string): Promise<UserProfile | null> {
    try {
      const url = `${this.baseUrl}/${id}/profile`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get user profile: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Handle enterprise API response format
      if (result && result.status === 'success' && result.data) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Get user profile by identifier (username or ID)
   */
  async getUserProfileByIdentifier(identifier: string): Promise<UserProfile | null> {
    try {
      const url = `${this.baseUrl}/${identifier}/profile`;
      
      // Use direct fetch for public profile viewing (no auth required)
      const response = await fetch(url);
      const data = await response.json();
      
      // Handle enterprise API response format
      if (data && data.status === 'success' && data.data) {
        return data.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user profile by identifier:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(id: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const url = `${this.baseUrl}/me/profile`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'PUT',
      body: JSON.stringify(profileData),
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to update user profile: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Handle enterprise API response format
    if (result && result.status === 'success' && result.data) {
      return result.data;
    }
    
    throw new Error('Failed to update user profile');
  }

  /**
   * Delete user account (added for profile deletion)
   */
  async deleteUser(id: string): Promise<void> {
    const url = `${this.baseUrl}/${id}`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'DELETE',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to delete user: ${response.statusText}`);
    }
  }

  /**
   * Delete user profile (alias for deleteUser)
   */
  async deleteUserProfile(id: string): Promise<void> {
    return this.deleteUser(id);
  }

  /**
   * Get user statistics
   */
  async getUserStats(id: string): Promise<UserStats | null> {
    const url = `${this.baseUrl}/${id}/stats`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to get user stats: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result || null;
  }

  /**
   * Get user badges
   */
  async getUserBadges(id: string): Promise<Badge[]> {
    const url = `${this.baseUrl}/${id}/badges`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to get user badges: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result || [];
  }

  /**
   * Follow a user
   */
  async followUser(userId: string): Promise<void> {
    const url = `${this.baseUrl}/${userId}/follow`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'POST',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to follow user: ${response.statusText}`);
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(userId: string): Promise<void> {
    const url = `${this.baseUrl}/${userId}/follow`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'DELETE',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to unfollow user: ${response.statusText}`);
    }
  }

  /**
   * Get user followers
   */
  async getUserFollowers(userId: string, page: number = 1, limit: number = 20): Promise<{
    followers: User[];
    total: number;
    hasMore: boolean;
  }> {
    const url = `${this.baseUrl}/${userId}/followers?page=${page}&limit=${limit}`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to get user followers: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result || { followers: [], total: 0, hasMore: false };
  }

  /**
   * Get users that the user is following
   */
  async getUserFollowing(userId: string, page: number = 1, limit: number = 20): Promise<{
    following: User[];
    total: number;
    hasMore: boolean;
  }> {
    const url = `${this.baseUrl}/${userId}/following?page=${page}&limit=${limit}`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'GET',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to get user following: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || result || { following: [], total: 0, hasMore: false };
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const url = `${this.baseUrl}/${userId}/preferences`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get user preferences: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const url = `${this.baseUrl}/${userId}/preferences`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'PUT',
      body: JSON.stringify(preferences),
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to update user preferences: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.data && !result) {
      throw new Error('Failed to update user preferences');
    }
    
    return result.data || result;
  }

    /**
   * Get user daily tasks
   */
  async getUserDailyTasks(userId: string): Promise<DailyTask[]> {
    try {
      const url = `${this.baseUrl}/${userId}/daily-tasks`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get user daily tasks: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || [];
    } catch (error) {
      console.error('Error getting user daily tasks:', error);
      return [];
    }
  }

  /**
   * Complete a daily task
   */
  async completeDailyTask(userId: string, taskId: string): Promise<DailyTask> {
    const url = `${this.baseUrl}/${userId}/daily-tasks/${taskId}/complete`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'POST',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to complete daily task: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.data && !result) {
      throw new Error('Failed to complete daily task');
    }
    
    return result.data || result;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20): Promise<{
    notifications: Notification[];
    total: number;
    hasMore: boolean;
    unreadCount: number;
  }> {
    try {
      const url = `${this.baseUrl}/${userId}/notifications?page=${page}&limit=${limit}`;
      const response = await fetch(url, createAuthenticatedRequestInit({
        method: 'GET',
        credentials: 'include',
      }));

      if (!response.ok) {
        throw new Error(`Failed to get user notifications: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result || { notifications: [], total: 0, hasMore: false, unreadCount: 0 };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { notifications: [], total: 0, hasMore: false, unreadCount: 0 };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const url = `${this.baseUrl}/${userId}/notifications/${notificationId}/read`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'POST',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.statusText}`);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const url = `${this.baseUrl}/${userId}/notifications/read-all`;
    const response = await fetch(url, createAuthenticatedRequestInit({
      method: 'POST',
      credentials: 'include',
    }));

    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
    }
  }

  /**
   * Get user reviews with enhanced API response mapping
   */
  async getUserReviews(userId: string, params: {
    page?: number;
    limit?: number;
    includeAnonymous?: boolean;
  } = {}): Promise<{
    reviews: Review[];
    total: number;
    hasMore: boolean;
  }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('size', params.limit.toString()); // Backend uses 'size' parameter
    if (params.includeAnonymous !== undefined) searchParams.append('include_anonymous', params.includeAnonymous.toString());

    const url = `${this.baseUrl}/${userId}/reviews?${searchParams.toString()}`;
    
    // Use direct fetch to get the new optimized API response
    const directResponse = await fetch(url);
    const directData = await directResponse.json();
    
    // Use the direct response structure from the optimized backend
    const reviewsData = directData.data || [];
    
    // Map API response to frontend Review type with full entity data from backend
    const mappedReviews: Review[] = reviewsData.map((apiReview: any) => ({
      id: apiReview.review_id?.toString() || apiReview.id?.toString(),
      entityId: apiReview.entity_id?.toString(),
      reviewerId: apiReview.user_id?.toString(),
      reviewerName: apiReview.user?.name || 'Unknown',
      reviewerUsername: apiReview.user?.username,
      reviewerAvatar: apiReview.user?.avatar,
      category: apiReview.entity?.category || 'companies',
      title: apiReview.title,
      content: apiReview.content,
      overallRating: apiReview.overall_rating || 0,
      ratings: apiReview.ratings || {},
      criteria: apiReview.criteria || {},
      pros: apiReview.pros || [],
      cons: apiReview.cons || [],
      isAnonymous: apiReview.is_anonymous || false,
      isVerified: apiReview.is_verified || false,
      view_count: apiReview.view_count || 0,
      reactions: apiReview.reactions || {},
      user_reaction: apiReview.user_reaction,
      top_reactions: apiReview.top_reactions || [],
      total_reactions: apiReview.total_reactions || 0,
      createdAt: apiReview.created_at,
      updatedAt: apiReview.updated_at,
      comments: [], // Comments would be loaded separately if needed
      // Map full entity data from optimized backend response - no frontend entity loading needed
      entity: apiReview.entity ? {
        id: apiReview.entity.id?.toString(),
        entity_id: apiReview.entity.entity_id?.toString() || apiReview.entity.id?.toString(),
        name: apiReview.entity.name,
        description: apiReview.entity.description || '',
        category: apiReview.entity.category || 'companies',
        subcategory: apiReview.entity.subcategory,
        avatar: apiReview.entity.avatar,
        isVerified: apiReview.entity.isVerified || false,
        isClaimed: apiReview.entity.isClaimed || false,
        claimedBy: apiReview.entity.claimedBy,
        claimedAt: apiReview.entity.claimedAt,
        context: apiReview.entity.context || {},
        // Rating and count data
        rating: apiReview.entity.rating || apiReview.entity.average_rating || 0,
        average_rating: apiReview.entity.average_rating || apiReview.entity.rating || 0,
        averageRating: apiReview.entity.averageRating || apiReview.entity.average_rating || 0,
        reviewCount: apiReview.entity.reviewCount || apiReview.entity.review_count || 0,
        review_count: apiReview.entity.review_count || apiReview.entity.reviewCount || 0,
        view_count: apiReview.entity.view_count || 0,
        viewCount: apiReview.entity.viewCount || apiReview.entity.view_count || 0,
        createdAt: apiReview.entity.createdAt,
        updatedAt: apiReview.entity.updatedAt,
        // Category data for breadcrumb display
        unified_category_id: apiReview.entity.unified_category_id,
        root_category_id: apiReview.entity.root_category_id,
        final_category_id: apiReview.entity.final_category_id,
        category_breadcrumb: apiReview.entity.category_breadcrumb || [],
        category_display: apiReview.entity.category_display,
        root_category: apiReview.entity.root_category,
        final_category: apiReview.entity.final_category
      } : undefined
    }));
    
    return {
      reviews: mappedReviews,
      total: directData.pagination?.total || mappedReviews.length,
      hasMore: directData.pagination?.has_next || false
    };
  }
}

// Export singleton instance
export const userService = new UserService(); 